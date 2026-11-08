
"use client";

import { useState } from "react";

export default function CodePromoPage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  function verifierCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!code.trim()) {
      setMessage("Entre ton code promotionnel.");
      return;
    }

    setMessage(
      "La vérification des codes promotionnels sera bientôt disponible."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white">

      <div className="w-full max-w-lg rounded-3xl border border-yellow-500/30 bg-[#141414] p-8 shadow-2xl">

        <a href="/" className="text-sm text-gray-400 hover:text-yellow-500">
          ← Retour à l'accueil
        </a>

        <div className="mt-10 text-center">
          <div className="text-6xl">🎟️</div>

          <h1 className="mt-6 text-3xl font-black">
            CODE <span className="text-yellow-500">PROMOTIONNEL</span>
          </h1>

          <p className="mt-4 text-gray-400">
            Tu possèdes un code promotionnel JTN BOX ?
            Entre-le ci-dessous.
          </p>
        </div>

        <form onSubmit={verifierCode} className="mt-10">

          <label className="mb-3 block text-sm font-bold text-yellow-500">
            TON CODE PROMOTIONNEL
          </label>

          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setMessage("");
            }}
            placeholder="EXEMPLE : JTN2026"
            className="w-full rounded-xl border border-white/20 bg-black px-5 py-4 text-center font-bold tracking-widest text-white outline-none focus:border-yellow-500"
          />

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-red-600 py-4 font-black transition hover:bg-red-700"
          >
            VÉRIFIER MON CODE
          </button>

          {message && (
            <p className="mt-5 text-center text-sm text-yellow-400">
              {message}
            </p>
          )}

        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          JTN BOX STORE © 2026
        </p>

      </div>
    </main>
  );
}
