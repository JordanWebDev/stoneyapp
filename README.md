# Stoney Nakoda Language App

A SwiftUI-based iOS application for learning the Stoney Nakoda language.

## Project Rules
1. **Tech Stack**: iOS 18+, SwiftUI, SwiftData, Python 3.12.
2. **Cultural Constraint**: 
   - Respect is paramount.
   - **Never truncate audio clips.**
   - **Earth Tones Only**: Ochre (#CC7722), Sage (#9DC183), Slate (#708090).
   - Dark Mode by default.
3. **Offline First**: All dictionary data is pre-loaded via SwiftData.

## Agent Roles
- **@Archivist**: Python, scraping, JSON, data cleaning.
  - To extract fresh data: `python Scripts/fetch_stoney.py`
  - Data output: `Resources/stoney_data.json`
- **@Architect**: SwiftUI, animations, UX logic.
