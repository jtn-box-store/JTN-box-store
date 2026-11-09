"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Connexion en cours...");

  useEffect(() => {
    let active = true;

    async function finishLogin() {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (!active) return;

      if (error) {
        setMessage("Erreur de connexion : " + error.message);
        return;
      }

      // Récupérer la destination après connexion
      const params = new URLSearchParams(window.location.search);
      const requestedNext = params.get("next");

      const next =
        requestedNext?.startsWith("/") &&
        !requestedNext.startsWith("//")
          ? requestedNext
          : "/";

      setMessage("Connexion réussie ! Redirection...");

      router.replace(next);
    }

    finishLogin();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <p className="text-lg">{message}</p>
    </main>
  );
}