
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AuthModal from "./AuthModal";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  // Charger le client connecté
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (mounted) {
        setUser(data.user);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Charger uniquement les notifications non lues
  useEffect(() => {
    if (!user?.id) {
      setNotificationCount(0);
      return;
    }

    let mounted = true;

    async function loadNotifications() {
      const { count, error } = await supabase
        .from("user_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (!error && mounted) {
        setNotificationCount(count || 0);
      }

      if (error) {
        console.error("Erreur notifications :", error.message);
      }
    }

    loadNotifications();

    // Écouter les nouvelles notifications et celles marquées comme lues
    const channel = supabase
      .channel("user-notifications-" + user.id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Déconnexion
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setNotificationCount(0);
    setMenuOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-[90] border-b border-white/10 bg-black/95">
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* LOGO */}
          <Link href="/" className="text-2xl font-black tracking-wider">
            JTN<span className="text-red-600"> BOX</span>
            <span className="ml-2 text-xs text-yellow-500">STORE</span>
          </Link>

          <div className="flex items-center gap-3">

            {/* NOTIFICATIONS */}
            {user && (
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative rounded-full border border-yellow-500/40 bg-[#151515] p-3 text-xl"
                onClick={() => setMenuOpen(false)}
              >
                🔔

                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-black text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Link>
            )}

            {/* BOUTON MENU */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 rounded-full border border-yellow-500/40 bg-[#151515] px-5 py-3 font-bold"
            >
              <span className="text-yellow-500">MENU</span>
              <span className="text-xl">
                {menuOpen ? "✕" : "☰"}
              </span>
            </button>
          </div>

          {/* MENU DÉROULANT */}
          {menuOpen && (
            <>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
                className="fixed inset-0 z-40"
              />

              <div className="absolute right-6 top-full z-50 mt-3 w-72 rounded-2xl border border-yellow-500/30 bg-[#111] p-4 shadow-2xl">

                {user ? (
                  <>
                    <p className="mb-3 break-all px-3 text-sm text-yellow-500">
                      👤 {user.email}
                    </p>

                    <Link
                      href="/notifications"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-red-600/20"
                    >
                      <span>🔔 Notifications</span>

                      {notificationCount > 0 && (
                        <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
                          {notificationCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      href="/mon-compte"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-4 py-3 hover:bg-red-600/20"
                    >
                      Mon compte
                    </Link>

                    <Link
                      href="/verification"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-4 py-3 hover:bg-red-600/20"
                    >
                      Mon ID JTN
                    </Link>

                    <Link
                      href="/abonnements"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-4 py-3 hover:bg-red-600/20"
                    >
                      Mon abonnement
                    </Link>

                    <Link
                      href="/commandes"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-4 py-3 hover:bg-red-600/20"
                    >
                      Achats effectués
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-3 w-full rounded-xl bg-red-600 px-4 py-3 text-left font-bold hover:bg-red-700"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-yellow-500">
                      MENU JTN BOX STORE
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setShowAuth(true);
                      }}
                      className="w-full rounded-xl bg-red-600 px-4 py-3 text-left font-bold hover:bg-red-700"
                    >
                      Connexion / Créer un compte
                    </button>
                  </>
                )}

                <div className="my-3 border-t border-white/10" />

                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 hover:bg-red-600/20"
                >
                  Accueil
                </Link>

                <Link
                  href="/abonnements"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 hover:bg-red-600/20"
                >
                  Prix / Abonnements
                </Link>

                <Link
                  href="/code-promo"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 hover:bg-red-600/20"
                >
                  Code promotionnel
                </Link>

                <Link
                  href="/paiement"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 hover:bg-red-600/20"
                >
                  Moyens de paiement
                </Link>

                <Link
                  href="/assistance"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 hover:bg-red-600/20"
                >
                  Assistance
                </Link>
              </div>
            </>
          )}
        </nav>
      </header>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </>
  );
}
