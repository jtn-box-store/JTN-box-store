
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  user_id: string;
  jtn_id: string;
  full_name: string;
  email?: string | null;
  plan: string;
  amount_usd: number;
  amount_htg: number;
  proof_path: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function loadOrders() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("payment_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setOrders(data || []);

      if (selectedOrder) {
        const updated = (data || []).find(
          (order) => order.id === selectedOrder.id
        );

        setSelectedOrder(updated || null);
      }
    }

    setLoading(false);
  }

  async function showProof(path: string) {
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 60);

    if (error) {
      alert("Impossible d'ouvrir le reçu : " + error.message);
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  
async function updateStatus(
  order: Order,
  newStatus: "approved" | "rejected"
) {
  const action =
    newStatus === "approved" ? "approuver" : "refuser";

  const confirmed = window.confirm(
    `Veux-tu vraiment ${action} cette commande ?`
  );

  if (!confirmed) return;

  setActionLoading(true);
  setMessage("");

  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const token = sessionData.session?.access_token;

    if (sessionError || !token) {
      setMessage("Connexion expirée. Reconnecte-toi.");
      return;
    }

    const response = await fetch("/api/notify-order-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId: order.id,
        status: newStatus,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Une erreur est survenue.");
      return;
    }

    const updatedOrder = {
      ...order,
      status: newStatus,
    };

    setOrders((previous) =>
      previous.map((item) =>
        item.id === order.id ? updatedOrder : item
      )
    );

    setSelectedOrder(updatedOrder);

    setMessage(
      newStatus === "approved"
        ? "Commande approuvée avec succès."
        : "Commande refusée."
    );

    if (result.warning) {
      setMessage(
        `Statut modifié. Attention : ${result.warning}`
      );
    } else if (result.emailSent) {
      setMessage(
        newStatus === "approved"
          ? "Commande approuvée. E-mail envoyé au client."
          : "Commande refusée. E-mail envoyé au client."
      );
    }
  } catch (error) {
    console.error(error);
    setMessage("Impossible de contacter le serveur.");
  } finally {
    setActionLoading(false);
  }
}


  async function deleteOrder(order: Order) {
    const confirmed = window.confirm(
      `ATTENTION ! Veux-tu vraiment supprimer la commande de ${order.full_name} ? Cette action est définitive.`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("payment_orders")
      .delete()
      .eq("id", order.id);

    if (error) {
      setMessage("Erreur de suppression : " + error.message);
      setActionLoading(false);
      return;
    }

    setOrders((previous) =>
      previous.filter((item) => item.id !== order.id)
    );

    setSelectedOrder(null);

    // Nettoyage facultatif du fichier reçu.
    const { error: storageError } = await supabase.storage
      .from("payment-proofs")
      .remove([order.proof_path]);

    if (storageError) {
      setMessage(
        "Commande supprimée. Le reçu est encore présent dans le stockage."
      );
    } else {
      setMessage("Commande et reçu supprimés avec succès.");
    }

    setActionLoading(false);
  }

  function statusLabel(status: string) {
    switch (status) {
      case "approved":
        return "Paiement approuvé par l'administration";

      case "rejected":
        return "Paiement refusé";

      case "pending":
        return "En attente de vérification";

      default:
        return status;
    }
  }

  function statusStyle(status: string) {
    switch (status) {
      case "approved":
        return "bg-green-900 text-green-300";

      case "rejected":
        return "bg-red-900 text-red-300";

      default:
        return "bg-yellow-900 text-yellow-300";
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <main className="min-h-screen bg-[#080808] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-5xl">

        <header className="mb-8">
          <h1 className="text-3xl font-black text-yellow-400">
            JTN BOX STORE
          </h1>

          <h2 className="mt-2 text-xl font-bold">
            Administration des paiements
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Consulte les commandes et vérifie les paiements des clients.
          </p>
        </header>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="mb-6 rounded-lg bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50"
        >
          {loading ? "CHARGEMENT..." : "ACTUALISER LES COMMANDES"}
        </button>

        {message && (
          <div className="mb-5 rounded-xl border border-yellow-600 bg-[#171717] p-4 text-sm text-yellow-300">
            {message}
          </div>
        )}

        {/* DÉTAILS DE LA COMMANDE */}

        {selectedOrder && (
          <section className="mb-8 rounded-2xl border-2 border-yellow-500 bg-[#171717] p-5 sm:p-7">

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-yellow-400">
                Détails de la commande
              </h2>

              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm"
              >
                FERMER
              </button>
            </div>

            <div className="mt-6 space-y-4">

              <div>
                <p className="text-sm text-gray-400">Client</p>
                <p className="text-lg font-bold">
                  {selectedOrder.full_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Adresse e-mail</p>
                <p className="break-all font-bold">
                  {selectedOrder.email || "Non renseignée"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Identifiant JTN</p>
                <p className="font-bold">{selectedOrder.jtn_id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Abonnement</p>
                <p className="text-xl font-black text-yellow-400">
                  {selectedOrder.plan}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Prix en dollars</p>
                <p className="font-bold">
                  ${selectedOrder.amount_usd} USD
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Montant en gourdes</p>
                <p className="text-xl font-black">
                  G {selectedOrder.amount_htg}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">
                  Date de la commande
                </p>
                <p className="font-bold">
                  {new Date(
                    selectedOrder.created_at
                  ).toLocaleString("fr-FR")}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Statut actuel</p>

                <span
                  className={`mt-2 inline-block rounded-full px-4 py-2 text-sm font-bold ${statusStyle(
                    selectedOrder.status
                  )}`}
                >
                  {statusLabel(selectedOrder.status)}
                </span>
              </div>

              <button
                onClick={() => showProof(selectedOrder.proof_path)}
                className="w-full rounded-xl bg-blue-600 py-4 font-bold hover:bg-blue-700"
              >
                VOIR LE REÇU DE PAIEMENT
              </button>

              {selectedOrder.status !== "approved" && (
                <button
                  onClick={() =>
                    updateStatus(selectedOrder, "approved")
                  }
                  disabled={actionLoading}
                  className="w-full rounded-xl bg-green-600 py-4 font-black text-white hover:bg-green-700 disabled:opacity-50"
                >
                  APPROUVER LA COMMANDE
                </button>
              )}

              {selectedOrder.status !== "rejected" && (
                <button
                  onClick={() =>
                    updateStatus(selectedOrder, "rejected")
                  }
                  disabled={actionLoading}
                  className="w-full rounded-xl bg-orange-600 py-4 font-black text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  REFUSER LA COMMANDE
                </button>
              )}

              <button
                onClick={() => deleteOrder(selectedOrder)}
                disabled={actionLoading}
                className="w-full rounded-xl border border-red-500 bg-red-950 py-4 font-black text-red-300 hover:bg-red-900 disabled:opacity-50"
              >
                SUPPRIMER LA COMMANDE
              </button>

            </div>
          </section>
        )}

        {/* LISTE DES COMMANDES */}

        <h2 className="mb-5 text-xl font-black">
          Toutes les commandes ({orders.length})
        </h2>

        {loading ? (
          <p className="text-gray-400">Chargement des commandes...</p>
        ) : orders.length === 0 ? (
          <p className="rounded-xl bg-[#171717] p-5 text-gray-400">
            Aucune commande pour le moment.
          </p>
        ) : (
          <div className="space-y-4">

            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrder(order)}
                className="block w-full rounded-2xl border border-gray-700 bg-[#171717] p-5 text-left transition hover:border-yellow-500 hover:bg-[#202020]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div>
                    <p className="text-lg font-black">
                      {order.full_name}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {order.jtn_id}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-2 text-xs font-bold ${statusStyle(
                      order.status
                    )}`}
                  >
                    {statusLabel(order.status)}
                  </span>

                </div>

                <div className="mt-4 border-t border-gray-700 pt-4">
                  <p className="font-bold text-yellow-400">
                    {order.plan}
                  </p>

                  <p className="mt-1 text-sm text-gray-300">
                    ${order.amount_usd} USD — G {order.amount_htg}
                  </p>

                  <p className="mt-3 text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleString("fr-FR")}
                  </p>

                  <p className="mt-4 text-sm font-bold text-blue-400">
                    CLIQUER POUR VOIR LA COMMANDE →
                  </p>
                </div>
              </button>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}
