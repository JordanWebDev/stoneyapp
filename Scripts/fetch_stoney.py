import requests
from bs4 import BeautifulSoup
import json
import time
import string
import os

# Configuration
BASE_URL = "https://dictionary.stoneynakoda.org/index.php/Search"
OUTPUT_FILE = os.path.join("Resources", "stoney_data.json")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Origin": "https://dictionary.stoneynakoda.org",
    "Referer": "https://dictionary.stoneynakoda.org/"
}

def fetch_data():
    all_entries = []
    
    # Iterate through A-Z
    letters = string.ascii_lowercase
    
    print(f"Starting scraping job. Target: {BASE_URL}", flush=True)

    for char in letters:
        page = 0
        while True:
            print(f"Fetching letter '{char}' page {page}...", flush=True)
            
            payload = {
                "lang": "E",
                "word": char,
                "token": "7", # Observed static token
                "page": str(page)
            }
            
            try:
                response = requests.post(BASE_URL, data=payload, headers=HEADERS)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                cards = soup.find_all('div', class_='card')
                
                if not cards:
                    print(f"No more cards for '{char}' at page {page}. Moving to next letter.", flush=True)
                    break
                
                for card in cards:
                    entry = parse_card(card)
                    if entry:
                        all_entries.append(entry)
                
                # Check for pagination end (simple heuristic: if < 10 cards, likely last page, but safer to check if next page returns empty)
                # The site might return empty string or specific message. 
                # Our loop break on `not cards` covers empty/no-results case.
                
                page += 1
                time.sleep(2) # Polite delay
                
            except Exception as e:
                print(f"Error fetching {char} page {page}: {e}", flush=True)
                break
        
        # Incremental save after each letter
        save_data(all_entries)

    print("Scraping completed.", flush=True)

def parse_card(card):
    try:
        # Word (English)
        word_elem = card.find('span', class_='Entry__LemmaStem')
        word = word_elem.get_text(strip=True) if word_elem else "Unknown"
        
        # Translation (Stoney)
        # Try multiple classes as observed
        trans_elem = card.find('span', class_='ReversalSense__LemmaStemScript')
        if not trans_elem:
             trans_elem = card.find('span', class_='ReversalSense__LemmaDeclarativeScript')
        translation = trans_elem.get_text(strip=True) if trans_elem else ""
        
        # Part of Speech
        pos_elem = card.find('span', class_='ReversalSense__PartOfSpeechScript')
        pos = pos_elem.get_text(strip=True) if pos_elem else ""
        
        # Audio URL
        audio_elem = card.find('audio')
        audio_url = audio_elem['src'] if audio_elem and 'src' in audio_elem.attrs else None
        
        return {
            "word": word,
            "translation": translation,
            "partOfSpeech": pos,
            "audioUrl": audio_url
        }
    except Exception as e:
        print(f"Error parsing card: {e}")
        return None

def save_data(data):
    # Ensure directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Successfully saved {len(data)} entries to {OUTPUT_FILE}")

if __name__ == "__main__":
    fetch_data()
