
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  jtn_id: string;
  full_name: string;
  plan: string;
  amount_usd: number;
  amount_htg: number;
  status: string;
  created_at: string;
};

export default function MesCommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    setLoading(true);
    setMessage("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setMessage("Connectez-vous à votre compte pour consulter vos commandes.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("payment_orders")
      .select(
        "id, jtn_id, full_name, plan, amount_usd, amount_htg, status, created_at"
      )
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Impossible de charger vos commandes : " + error.message);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  function getStatus(status: string) {
    switch (status) {
      case "approved":
        return {
          title: "Paiement approuvé",
          description:
            "Félicitations ! Votre commande a été approuvée par les administrateurs de JTN BOX. Votre abonnement est validé.",
          color: "text-green-400",
          background: "bg-green-500/10",
        };

      case "rejected":
        return {
          title: "Paiement refusé",
          description:
            "Votre paiement n'a pas été approuvé. Veuillez contacter l'assistance.",
          color: "text-red-400",
          background: "bg-red-500/10",
        };

      default:
        return {
          title: "En cours de vérification",
          description:
            "Votre commande est en cours de vérification. Nous attendons l'approbation de l'administration.",
          color: "text-yellow-400",
          background: "bg-yellow-500/10",
        };
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <main className="min-h-screen bg-[#080808] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-black text-yellow-400">
          JTN BOX
        </h1>

        <h2 className="text-2xl font-bold mt-3">
          Mes commandes
        </h2>

        <p className="text-gray-400 mt-2 mb-6">
          Consultez l'état de vos achats et de vos paiements.
        </p>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="bg-yellow-500 text-black font-bold px-5 py-3 rounded-xl mb-6 disabled:opacity-50"
        >
          {loading ? "Chargement..." : "Actualiser mes commandes"}
        </button>

        {message && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Chargement de vos commandes...</p>
        ) : !message && orders.length === 0 ? (
          <div className="bg-[#171717] border border-gray-800 p-6 rounded-2xl">
            <p className="text-gray-300 font-semibold">
              Aucune commande trouvée.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Vos commandes apparaîtront ici après votre achat.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const status = getStatus(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-[#171717] border border-gray-800 rounded-2xl p-5"
                >
                  <div className="flex justify-between items-center gap-3 mb-4">
                    <h3 className="text-lg font-bold">
                      {order.plan}
                    </h3>

                    <span className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-300">
                    <p>
                      <b>Nom :</b> {order.full_name}
                    </p>
                    <p>
                      <b>JTN ID :</b> {order.jtn_id}
                    </p>
                    <p>
                      <b>Prix :</b> ${order.amount_usd} USD
                    </p>
                    <p>
                      <b>Montant :</b> {order.amount_htg} GDS
                    </p>
                  </div>

                  <div className={`${status.background} rounded-xl p-4 mt-5`}>
                    <p className={`font-bold ${status.color}`}>
                      {status.title}
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                      {status.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
