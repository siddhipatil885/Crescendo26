import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";

// ─────────────────────────────────────────────
// useAdminAuth hook
// ─────────────────────────────────────────────

export const useAdminAuth = () => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const login = async (email, password, onSuccess) => {
        setLoading(true);
        setError("");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const tokenResult = await userCredential.user.getIdTokenResult();

            if (tokenResult.claims.admin) {
                onSuccess?.();
            } else {
                await signOut(auth);
                setError("Insufficient permissions. Admin access required.");
            }
        } catch (err) {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    return { login, logout, error, loading };
};

// ─────────────────────────────────────────────
// AuthFlow Component
// ─────────────────────────────────────────────

export default function AuthFlow() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { login, error, loading } = useAdminAuth();

    const handleLogin = () => {
        login(email, password, () => navigate("/admin/dashboard"));
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#030712',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: '#111827',
                border: '1px solid #1F2937',
                borderRadius: '16px',
                padding: '2rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                    Admin Login
                </h1>
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    CIVIX — Pune
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@pune.gov.in"
                            style={{
                                width: '100%',
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                padding: '0.625rem 1rem',
                                color: 'white',
                                fontSize: '0.875rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                padding: '0.625rem 1rem',
                                color: 'white',
                                fontSize: '0.875rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {error && (
                        <p style={{ color: '#F87171', fontSize: '0.875rem' }}>{error}</p>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        style={{
                            width: '100%',
                            backgroundColor: '#F97316',
                            color: 'white',
                            fontWeight: '600',
                            padding: '0.625rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.5 : 1,
                            fontSize: '0.875rem',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </div>

                <p style={{ color: '#4B5563', fontSize: '0.75rem', textAlign: 'center', marginTop: '1.5rem' }}>
                    Citizens don't need to log in — just open the app.
                </p>
            </div>
        </div>
    );
}