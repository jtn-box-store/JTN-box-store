
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  order_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type Order = {
  id: string;
  plan: string;
  amount_usd: number;
  amount_htg: number;
  status: string;
  created_at: string;
  jtn_id: string;
  full_name: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function start() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (!mounted) return;

      if (authError || !authData.user) {
        setMessage("Connecte-toi pour consulter tes notifications.");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      async function refreshNotifications() {
        const { data, error } = await supabase
          .from("user_notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!mounted) return;

        if (error) {
          setMessage("Impossible de charger les notifications.");
        } else {
          setMessage("");
          setNotifications((data || []) as Notification[]);
        }

        setLoading(false);
      }

      // Nom unique pour éviter de réutiliser un ancien canal
      const channelName =
        "user-notifications-" +
        userId +
        "-" +
        Math.random().toString(36).slice(2);

      // Enregistrer le callback AVANT subscribe()
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            refreshNotifications();
          }
        );

      await refreshNotifications();

      if (mounted && channel) {
        channel.subscribe();
      }
    }

    start();

    return () => {
      mounted = false;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  async function openNotification(notification: Notification) {
    if (openingId) return;

    setOpeningId(notification.id);
    setMessage("");

    try {
      if (!notification.is_read) {
        const { error } = await supabase
          .from("user_notifications")
          .update({ is_read: true })
          .eq("id", notification.id);

        if (error) {
          setMessage("Impossible de marquer cette notification comme lue.");
          return;
        }

        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true }
              : item
          )
        );
      }

      const { data, error } = await supabase
        .from("payment_orders")
        .select(
          "id,plan,amount_usd,amount_htg,status,created_at,jtn_id,full_name"
        )
        .eq("id", notification.order_id)
        .single();

      if (error || !data) {
        setSelectedOrder(null);
        setMessage("Les détails de cet achat ne sont plus disponibles.");
        return;
      }

      setSelectedOrder(data as Order);
    } catch {
      setMessage("Une erreur est survenue. Réessaie.");
    } finally {
      setOpeningId(null);
    }
  }

  function statusInfo(status: string) {
    switch (status?.toLowerCase()) {
      case "approved":
        return {
          title: "Paiement approuvé",
          description: "Ton paiement a été confirmé par notre équipe.",
          color: "border-green-500/30 bg-green-500/10 text-green-400",
        };

      case "rejected":
        return {
          title: "Paiement refusé",
          description:
            "Ta preuve de paiement a été refusée. Contacte l'assistance.",
          color: "border-red-500/30 bg-red-500/10 text-red-400",
        };

      default:
        return {
          title: "En attente",
          description:
            "Ta commande est en cours de vérification par l'administration.",
          color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
        };
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-sm font-black tracking-[0.3em] text-yellow-500">
          JTN BOX STORE
        </p>

        <h1 className="mt-3 text-center text-3xl font-black">
          🔔 Mes notifications
        </h1>

        <p className="mt-3 text-center text-gray-400">
          {unreadCount} notification(s) non lue(s)
        </p>

        {loading && (
          <p className="mt-8 rounded-xl bg-[#151515] p-6 text-center text-gray-400">
            Chargement des notifications...
          </p>
        )}

        {!loading && message && (
          <p className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center text-red-300">
            {message}
          </p>
        )}

        {!loading && notifications.length === 0 && !message && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#151515] p-8 text-center">
            <p className="text-4xl">🔔</p>
            <h2 className="mt-4 text-xl font-bold">
              Aucune notification
            </h2>
            <p className="mt-2 text-gray-400">
              Tes informations d'achat apparaîtront ici.
            </p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              disabled={openingId !== null}
              onClick={() => openNotification(notification)}
              className={`w-full rounded-2xl border p-5 text-left transition hover:border-yellow-500/60 disabled:opacity-60 ${
                notification.is_read
                  ? "border-white/10 bg-[#151515]"
                  : "border-yellow-500/40 bg-[#19160d]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 text-xl text-yellow-400">
                  🔔
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-black">
                      {notification.title}
                    </h2>

                    {!notification.is_read ? (
                      <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold">
                        NON LU
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Lu</span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-gray-300">
                    {notification.message}
                  </p>

                  <p className="mt-3 text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleString(
                      "fr-FR",
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "America/Port-au-Prince",
                      }
                    )}
                  </p>

                  <p className="mt-3 text-sm font-bold text-yellow-500">
                    {openingId === notification.id
                      ? "Chargement..."
                      : "Voir les détails →"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedOrder && (
          <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-[#151515] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-yellow-500">
                Détails de l'achat
              </h2>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg bg-white/10 px-3 py-2"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Nom complet</p>
                <p className="mt-1 font-bold">
                  {selectedOrder.full_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">ID JTN</p>
                <p className="mt-1 font-bold">
                  {selectedOrder.jtn_id}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Abonnement</p>
                <p className="mt-1 font-bold">
                  {selectedOrder.plan}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Prix USD</p>
                <p className="mt-1 font-bold">
                  ${Number(selectedOrder.amount_usd).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Prix GDS</p>
                <p className="mt-1 font-bold">
                  G{" "}
                  {Number(selectedOrder.amount_htg).toLocaleString("fr-FR")}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="mt-1 font-bold">
                  {new Date(selectedOrder.created_at).toLocaleString(
                    "fr-FR",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "America/Port-au-Prince",
                    }
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-[#0b0b0b] p-4">
              <p className="text-sm text-gray-400">Statut actuel</p>

              <span
                className={`mt-3 inline-block rounded-full border px-4 py-2 text-sm font-bold ${
                  statusInfo(selectedOrder.status).color
                }`}
              >
                {statusInfo(selectedOrder.status).title}
              </span>

              <p className="mt-3 text-sm text-gray-300">
                {statusInfo(selectedOrder.status).description}
              </p>
            </div>
          </div>
        )}

        <Link
          href="/"
          className="mt-8 block rounded-xl bg-yellow-500 py-4 text-center font-black text-black"
        >
          RETOUR À L'ACCUEIL
        </Link>
      </div>
    </main>
  );
}
