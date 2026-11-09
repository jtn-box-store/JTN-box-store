
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

      setMessage("Connexion réussie !");

      router.replace("/");
    }

    finishLogin();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-lg">{message}</p>
    </main>
  );
}
