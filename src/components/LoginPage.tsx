import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Error signing in", err);
      setError("Login fehlgeschlagen. Bitte prüfe deine Zugangsdaten.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f0f0f0] min-h-screen p-2 sm:p-4 md:p-8 text-gray-800 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg p-6 sm:p-8 rounded-lg">
          <header className="text-center pb-4 border-b-2 border-gray-200">
            <h1 className="text-2xl sm:text-3xl font-bold font-press-start tracking-tighter">
              Soullink Tracker
            </h1>
            <p className="text-sm text-gray-500 mt-2">Anmeldung erforderlich</p>
          </header>

          <form onSubmit={handleAuthAction} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-70"
            >
              {loading ? "Anmelden…" : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
