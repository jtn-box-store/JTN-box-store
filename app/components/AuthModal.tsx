"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: "https://jtn-box-store.vercel.app/",
          },
        });
        if (error) throw error;
        setMessage("Compte créé ! Vérifie ton Gmail pour confirmer ton adresse.");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setMessage("Un lien de réinitialisation a été envoyé à ton Gmail.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
  setLoading(true);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://jtn-box-store.vercel.app/",
    },
  });

  if (error) {
    setMessage(error.message);
    setLoading(false);
  }
}
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-yellow-600/30 bg-[#101010] p-7 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-4 text-3xl text-gray-400 hover:text-white"
          aria-label="Fermer"
        >
          ×
        </button>

        <div className="mb-7 text-center">
          <h1 className="text-3xl font-black text-yellow-500">
            JTN BOX STORE
          </h1>
          <h2 className="mt-4 text-2xl font-bold">
            {mode === "login"
              ? "Bienvenue !"
              : mode === "signup"
              ? "Créer un compte"
              : "Mot de passe oublié"}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Connecte-toi pour profiter de ton espace.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Adresse Gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-[#1b1b1b] px-4 py-4 outline-none focus:border-yellow-500"
          />

          {mode !== "reset" && (
            <input
              type="password"
              required
              minLength={6}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-[#1b1b1b] px-4 py-4 outline-none focus:border-yellow-500"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-700 py-4 font-bold hover:bg-red-600 disabled:opacity-50"
          >
            {loading
              ? "Patiente..."
              : mode === "login"
              ? "Se connecter"
              : mode === "signup"
              ? "Créer mon compte"
              : "Envoyer le lien"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-yellow-400">
            {message}
          </p>
        )}

        {mode === "login" && (
          <>
            <button
              onClick={() => setMode("reset")}
              className="mt-4 block w-full text-center text-sm text-gray-400 hover:text-yellow-400"
            >
              Mot de passe oublié ?
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-700" />
              <span className="text-xs text-gray-500">OU</span>
              <div className="h-px flex-1 bg-gray-700" />
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full rounded-xl bg-white py-4 font-bold text-black hover:bg-gray-200 disabled:opacity-50"
            >
              🌐 Continuer avec Google
            </button>

            <p className="mt-6 text-center text-sm text-gray-400">
              Pas encore de compte ?{" "}
              <button
                onClick={() => setMode("signup")}
                className="font-bold text-yellow-500"
              >
                Créer un compte
              </button>
            </p>
          </>
        )}

        {mode !== "login" && (
          <button
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className="mt-5 w-full text-center text-sm text-yellow-500"
          >
            Retour à la connexion
          </button>
        )}
      </div>
    </div>
  );
}