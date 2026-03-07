/**
 * admin/_layout.tsx — Admin layout with Supabase Auth login + password change.
 *
 * PROPER AUTH: Uses supabase.auth.signInWithPassword() so that the
 * authenticated user's UUID is set in the database context. This makes
 * the is_admin() RLS function work correctly for all operations.
 *
 * Setup required:
 *   1. Go to Supabase Dashboard → Authentication → Users → Add User
 *   2. Email: admin@stoney.app, Password: admin
 *   3. Run fix_feedback_policy.sql to link user to admin_users table
 *
 * On logout: navigates to homepage and shows a "Logged out" popup.
 */

import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AdminLayout() {
    const router = useRouter();

    // Track whether the user is logged in via Supabase Auth
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    // Login form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // Password change form
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    // --------------------------------------------------
    // Check for existing session on mount
    // --------------------------------------------------
    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        setCheckingSession(false);
    };

    // --------------------------------------------------
    // Login with Supabase Auth
    // --------------------------------------------------
    const handleLogin = async () => {
        setLoginLoading(true);
        setError('');

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) {
            setError('Invalid email or password');
        } else {
            setIsAuthenticated(true);
        }
        setLoginLoading(false);
    };

    // --------------------------------------------------
    // Logout — sign out, navigate to home, show popup
    // --------------------------------------------------
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setEmail('');
        setPassword('');
        setShowPasswordChange(false);
        // Navigate to homepage — the root layout shows the popup
        router.replace('/?loggedOut=true');
    };

    // --------------------------------------------------
    // Change password via Supabase Auth
    // --------------------------------------------------
    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 4) {
            setPasswordMessage('Password must be at least 4 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage('Passwords do not match');
            return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            setPasswordMessage(updateError.message);
        } else {
            setPasswordMessage('✅ Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowPasswordChange(false);
                setPasswordMessage('');
            }, 2000);
        }
    };

    // --------------------------------------------------
    // Loading state while checking session
    // --------------------------------------------------
    if (checkingSession) {
        return (
            <View style={styles.loginContainer}>
                <Text style={{ color: '#a8a29e' }}>Checking session...</Text>
            </View>
        );
    }

    // --------------------------------------------------
    // LOGIN SCREEN — shown when NOT authenticated
    // --------------------------------------------------
    if (!isAuthenticated) {
        return (
            <View style={styles.loginContainer}>
                <View style={styles.loginCard}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.loginTitle}>Admin Login</Text>
                    <Text style={styles.loginSubtitle}>
                        Enter your credentials to access the dashboard
                    </Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="admin@stoney.app"
                        placeholderTextColor="#a8a29e"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter password"
                        placeholderTextColor="#a8a29e"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        onSubmitEditing={handleLogin}
                    />

                    <Pressable
                        style={({ pressed }) => [
                            styles.loginBtn,
                            pressed && styles.btnPressed,
                            loginLoading && { opacity: 0.7 },
                        ]}
                        onPress={handleLogin}
                        disabled={loginLoading}
                    >
                        <Text style={styles.loginBtnText}>
                            {loginLoading ? 'Signing in...' : 'Sign In'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    // --------------------------------------------------
    // ADMIN DASHBOARD — shown when authenticated
    // --------------------------------------------------
    return (
        <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            {/* Top bar with settings and logout */}
            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>Admin Portal — Stoney Language</Text>
                <View style={styles.topBarRight}>
                    <Pressable
                        style={({ pressed }) => [styles.settingsBtn, pressed && styles.btnPressed]}
                        onPress={() => setShowPasswordChange(!showPasswordChange)}
                    >
                        <Text style={styles.settingsText}>
                            {showPasswordChange ? '✕ Close' : '🔑 Password'}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.logoutBtn, pressed && styles.btnPressed]}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutText}>Logout</Text>
                    </Pressable>
                </View>
            </View>

            {/* Password change panel */}
            {showPasswordChange && (
                <View style={styles.passwordPanel}>
                    <Text style={styles.passwordTitle}>Change Password</Text>
                    {passwordMessage ? (
                        <Text
                            style={[
                                styles.passwordMsg,
                                passwordMessage.startsWith('✅')
                                    ? styles.successMsg
                                    : styles.errorMsg,
                            ]}
                        >
                            {passwordMessage}
                        </Text>
                    ) : null}
                    <View style={styles.passwordRow}>
                        <View style={styles.passwordField}>
                            <Text style={styles.passwordLabel}>New Password</Text>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Min 4 characters"
                                placeholderTextColor="#a8a29e"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                        </View>
                        <View style={styles.passwordField}>
                            <Text style={styles.passwordLabel}>Confirm Password</Text>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Re-enter password"
                                placeholderTextColor="#a8a29e"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                onSubmitEditing={handleChangePassword}
                            />
                        </View>
                        <Pressable
                            style={({ pressed }) => [
                                styles.savePasswordBtn,
                                pressed && styles.btnPressed,
                            ]}
                            onPress={handleChangePassword}
                        >
                            <Text style={styles.savePasswordText}>Update</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
            </Stack>
        </View>
    );
}

/* ──────────────────────────────────────────────
 * STYLES
 * ────────────────────────────────────────────── */
const styles = StyleSheet.create({
    loginContainer: {
        flex: 1,
        backgroundColor: '#fafaf9',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loginCard: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 32,
        borderWidth: 1,
        borderColor: '#e7e5e4',
    },
    lockIcon: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
    loginTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1c1917',
        textAlign: 'center',
        marginBottom: 4,
    },
    loginSubtitle: { fontSize: 14, color: '#a8a29e', textAlign: 'center', marginBottom: 24 },
    label: { fontSize: 13, fontWeight: '600', color: '#57534e', marginBottom: 6, marginTop: 12 },
    input: {
        borderWidth: 1,
        borderColor: '#e7e5e4',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        backgroundColor: '#fafaf9',
        color: '#1c1917',
    },
    loginBtn: {
        marginTop: 24,
        backgroundColor: '#ea580c',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    btnPressed: { opacity: 0.8 },
    errorBox: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    errorText: { color: '#dc2626', fontSize: 13, fontWeight: '500', textAlign: 'center' },

    // Top bar
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    topBarTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    topBarRight: { flexDirection: 'row', gap: 8 },
    settingsBtn: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    settingsText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    logoutBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Password panel
    passwordPanel: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e7e5e4',
    },
    passwordTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
    passwordRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' },
    passwordField: { minWidth: 200, flex: 1 },
    passwordLabel: { fontSize: 12, fontWeight: '600', color: '#57534e', marginBottom: 4 },
    passwordInput: {
        borderWidth: 1,
        borderColor: '#e7e5e4',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        backgroundColor: '#fafaf9',
    },
    savePasswordBtn: {
        backgroundColor: '#ea580c',
        paddingVertical: 11,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'flex-end',
    },
    savePasswordText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    passwordMsg: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
    successMsg: { color: '#16a34a' },
    errorMsg: { color: '#dc2626' },
});
