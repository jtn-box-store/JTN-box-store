
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  user_id: string;
  jtn_id: string;
  full_name: string;
  plan: string;
  amount_usd: number;
  amount_htg: number;
  status: string;
  created_at: string;
};

export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadOrders() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        if (mounted) {
          setError("Connecte-toi pour consulter tes achats.");
          setLoading(false);
        }
        return;
      }

      const userId = authData.user.id;

      async function refreshOrders() {
        const { data, error } = await supabase
          .from("payment_orders")
          .select(
            "id,user_id,jtn_id,full_name,plan,amount_usd,amount_htg,status,created_at"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!mounted) return;

        if (error) {
          setError("Impossible de charger tes achats.");
        } else {
          setError("");
          setOrders((data || []) as Order[]);
        }

        setLoading(false);
      }

      await refreshOrders();

      channel = supabase
        .channel("mes-achats-" + userId)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "payment_orders",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            refreshOrders();
          }
        )
        .subscribe();
    }

    loadOrders();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  function getStatus(status: string) {
    switch (status?.toLowerCase()) {
      case "approved":
        return {
          label: "Approuvé",
          color: "bg-green-500/15 text-green-400 border-green-500/30",
          description: "Ta commande a été approuvée par l'administration.",
        };

      case "rejected":
        return {
          label: "Refusé",
          color: "bg-red-500/15 text-red-400 border-red-500/30",
          description: "Ta commande a été refusée par l'administration.",
        };

      default:
        return {
          label: "En attente",
          color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
          description:
            "Ta commande est en cours de vérification par l'administration.",
        };
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-yellow-500 hover:text-yellow-400"
        >
          ← Retour à l'accueil
        </Link>

        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-yellow-500">
            JTN BOX STORE
          </p>

          <h1 className="text-3xl font-black md:text-4xl">
            Achats effectués
          </h1>

          <p className="mt-3 text-gray-400">
            Consulte tes commandes, leurs détails et leur état de validation.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#111] p-10 text-center text-gray-400">
            Chargement de tes achats...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error}</p>

            <Link
              href="/"
              className="mt-5 inline-block rounded-xl bg-red-600 px-6 py-3 font-bold"
            >
              Retour à l'accueil
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#111] p-10 text-center">
            <div className="mb-4 text-5xl">🛍️</div>

            <h2 className="text-xl font-bold">
              Aucun achat pour le moment
            </h2>

            <p className="mt-3 text-gray-400">
              Tes commandes apparaîtront ici après leur enregistrement.
            </p>

            <Link
              href="/abonnements"
              className="mt-6 inline-block rounded-xl bg-red-600 px-6 py-3 font-bold hover:bg-red-700"
            >
              Découvrir les abonnements
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-300">
                Historique de tes achats
              </h2>

              <span className="rounded-full bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-500">
                {orders.length} commande(s)
              </span>
            </div>

            {orders.map((order) => {
              const status = getStatus(order.status);
              const isOpen = selectedOrder === order.id;

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedOrder(isOpen ? null : order.id)
                    }
                    className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-white/[0.03] md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Abonnement
                      </p>

                      <h3 className="mt-2 text-xl font-black text-white">
                        {order.plan}
                      </h3>

                      <p className="mt-2 text-sm text-gray-400">
                        Commande du{" "}
                        {new Date(order.created_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Référence : {order.id}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
                      <span
                        className={`rounded-full border px-4 py-2 text-sm font-bold ${status.color}`}
                      >
                        {status.label}
                      </span>

                      <span className="text-xl font-black text-yellow-500">
                        ${Number(order.amount_usd).toFixed(2)}
                      </span>

                      <span className="text-xs text-gray-500">
                        {isOpen ? "Fermer ▲" : "Voir les détails ▼"}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/10 bg-[#0c0c0c] p-5">
                      <h3 className="mb-5 text-lg font-black text-yellow-500">
                        Détails de ta commande
                      </h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-[#171717] p-4">
                          <p className="text-xs text-gray-500">Nom complet</p>
                          <p className="mt-2 font-bold">
                            {order.full_name}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#171717] p-4">
                          <p className="text-xs text-gray-500">ID JTN</p>
                          <p className="mt-2 font-bold">{order.jtn_id}</p>
                        </div>

                        <div className="rounded-xl bg-[#171717] p-4">
                          <p className="text-xs text-gray-500">Abonnement</p>
                          <p className="mt-2 font-bold">{order.plan}</p>
                        </div>

                        <div className="rounded-xl bg-[#171717] p-4">
                          <p className="text-xs text-gray-500">Prix USD</p>
                          <p className="mt-2 font-bold">
                            ${Number(order.amount_usd).toFixed(2)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#171717] p-4">
                          <p className="text-xs text-gray-500">Prix GDS</p>
                          <p className="mt-2 font-bold">
                            G {Number(order.amount_htg).toLocaleString("fr-FR")}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#171717] p-4">
                          <p className="text-xs text-gray-500">
                            Date de commande
                          </p>
                          <p className="mt-2 font-bold">
                            {new Date(order.created_at).toLocaleString(
                              "fr-FR"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl border border-white/10 bg-[#171717] p-5">
                        <p className="mb-3 text-sm font-bold text-gray-400">
                          ÉTAT DE LA COMMANDE
                        </p>

                        <span
                          className={`inline-block rounded-full border px-4 py-2 text-sm font-bold ${status.color}`}
                        >
                          {status.label}
                        </span>

                        <p className="mt-3 text-sm text-gray-300">
                          {status.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
