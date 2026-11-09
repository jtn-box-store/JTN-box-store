"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ConnexionPage() {
  const [loading, setLoading] = useState(false);

  async function connexionGoogle() {
    setLoading(true);

    // Récupérer la page que le client voulait ouvrir
    const params = new URLSearchParams(window.location.search);
    const requestedNext = params.get("next");

    // Autoriser uniquement une adresse interne au site
    const next =
      requestedNext?.startsWith("/") &&
      !requestedNext.startsWith("//")
        ? requestedNext
        : "/";

    const redirectTo =
      `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white">
      <div className="w-full max-w-md rounded-3xl border border-yellow-600/30 bg-[#111] p-8 text-center shadow-2xl">
        <h1 className="text-3xl font-black text-yellow-500">
          JTN BOX STORE
        </h1>

        <p className="mt-3 text-gray-400">
          Connecte-toi pour accéder à ton compte et continuer ton achat.
        </p>

        <button
          onClick={connexionGoogle}
          disabled={loading}
          className="mt-10 w-full rounded-xl bg-white px-5 py-4 font-bold text-black hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? "Connexion..." : "🌐 Continuer avec Google"}
        </button>

        <p className="mt-6 text-xs text-gray-500">
          Connexion sécurisée avec Google et Supabase.
        </p>
      </div>
    </main>
  );
}