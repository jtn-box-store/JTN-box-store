
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  jtn_id: string;
  full_name: string;
};

const offers: Record<
  string,
  {
    usd: number;
    htg: number;
    description: string;
    features: string[];
  }
> = {
  "1 MOIS": {
    usd: 3,
    htg: 390,
    description: "Accès pendant 1 mois",
    features: ["Accès pendant 1 mois"],
  },
  "2 MOIS": {
    usd: 4.99,
    htg: 670,
    description: "Accès pendant 2 mois",
    features: ["Accès pendant 2 mois"],
  },
  "3 MOIS": {
    usd: 6,
    htg: 900,
    description: "Accès pendant 3 mois",
    features: ["Accès pendant 3 mois"],
  },
  "STANDARD AVEC PUB": {
    usd: 6.99,
    htg: 915,
    description: "Forfait Standard avec publicité",
    features: [
      "Qualité vidéo : 144p, 320p et 480p",
      "Jusqu'à 2 appareils",
      "Avec publicité",
    ],
  },
  "STANDARD SANS PUB": {
    usd: 8,
    htg: 1050,
    description: "Forfait Standard sans publicité",
    features: [
      "Qualité vidéo jusqu'à Full HD 1080p",
      "Accès au catalogue complet",
      "Sans publicité",
    ],
  },
  PREMIUM: {
    usd: 9,
    htg: 1230,
    description: "Forfait Premium",
    features: [
      "Qualité vidéo jusqu'à 4K Ultra HD",
      "3 appareils simultanément",
      "Programmes différents sur les appareils",
      "Sans publicité",
      "Accès au catalogue mondial",
      "Badge Premium",
    ],
  },
  VIP: {
    usd: 11,
    htg: 1430,
    description: "Forfait VIP",
    features: [
      "Badge VIP",
      "Accès à tous les contenus",
      "Accès à toutes les fonctionnalités VIP",
    ],
  },
};

function VerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedPlan = searchParams.get("plan") || "";
  const offer = offers[selectedPlan];

  const priceUSD = offer?.usd ?? 0;
  const priceHTG = offer?.htg ?? 0;

  const [authChecked, setAuthChecked] = useState(false);

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");

  // Vérifier si le client est connecté
  useEffect(() => {
    let active = true;

    async function checkLogin() {
      if (!offer) {
        setAuthChecked(true);
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        const destination =
          `/verification?plan=${encodeURIComponent(selectedPlan)}`;

        router.replace(
          `/connexion?next=${encodeURIComponent(destination)}`
        );

        return;
      }

      setAuthChecked(true);
    }

    checkLogin();

    return () => {
      active = false;
    };
  }, [selectedPlan, offer, router]);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 2,
    }).format(amount);

  async function searchAccount() {
    const id = userId.trim();

    if (!id) {
      setMessage("Entre ton identifiant JTN BOX.");
      setProfile(null);
      return;
    }

    setLoading(true);
    setMessage("");
    setProfile(null);

    try {
      const { data, error } = await supabase.rpc(
        "lookup_jtn_profile",
        { p_jtn_id: id }
      );

      if (error) {
        setMessage("Erreur lors de la recherche. Réessaie.");
      } else if (!data || data.length === 0) {
        setMessage("Aucun compte trouvé.");
      } else {
        setProfile(data[0]);
      }
    } catch {
      setMessage("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  function applyPromoCode() {
    if (!promoCode.trim()) {
      setPromoMessage("Entre un code promotionnel.");
      return;
    }

    setPromoMessage(
      "Code enregistré. La réduction sera disponible prochainement."
    );
  }

  async function confirmPurchase() {
    if (!offer) {
      setMessage("Cette offre est invalide.");
      return;
    }

    // Vérifier encore la session avant de continuer
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      const destination =
        `/verification?plan=${encodeURIComponent(selectedPlan)}`;

      router.push(
        `/connexion?next=${encodeURIComponent(destination)}`
      );

      return;
    }

    if (!profile) {
      setMessage("Vérifie d'abord ton compte JTN.");
      return;
    }

    const params = new URLSearchParams({
      plan: selectedPlan,
      price: String(priceUSD),
      gds: String(priceHTG),
      id: profile.jtn_id,
    });

    router.push(`/paiement?${params.toString()}`);
  }

  // Écran de chargement pendant la vérification
  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="text-center">
          <p className="text-xl font-bold text-yellow-400">
            Vérification de connexion...
          </p>
          <p className="mt-3 text-gray-400">
            Préparation de ton abonnement JTN BOX.
          </p>
        </div>
      </main>
    );
  }

  if (!offer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-black">
            Forfait introuvable
          </h1>

          <p className="mt-3 text-gray-400">
            Retourne choisir un abonnement.
          </p>

          <button
            onClick={() => router.push("/abonnements")}
            className="mt-6 rounded-full bg-red-600 px-7 py-4 font-bold"
          >
            Voir les abonnements
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-12 text-white">
      <div className="mx-auto max-w-xl">

        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-bold tracking-[0.35em] text-red-500">
            JTN BOX STORE
          </p>

          <h1 className="text-3xl font-black">
            Vérification du compte
          </h1>

          <p className="mt-3 text-gray-400">
            Vérifie ton identifiant avant de continuer.
          </p>
        </div>

        {/* FORFAIT ET INFORMATIONS */}

        <section className="rounded-3xl border border-yellow-600/40 bg-[#151515] p-6">
          <p className="text-sm font-bold uppercase tracking-widest text-yellow-500">
            Forfait sélectionné
          </p>

          <h2 className="mt-3 text-2xl font-black">
            {selectedPlan}
          </h2>

          <p className="mt-2 text-gray-400">
            {offer.description}
          </p>

          <div className="my-5 border-t border-white/10" />

          <h3 className="font-bold text-yellow-400">
            INFORMATIONS ET AVANTAGES
          </h3>

          <ul className="mt-4 space-y-3">
            {offer.features.map((feature) => (
              <li key={feature} className="flex gap-3 text-gray-300">
                <span className="font-black text-yellow-500">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="my-5 border-t border-white/10" />

          <p className="text-gray-400">Prix en dollars</p>

          <p className="text-3xl font-black">
            {formatMoney(priceUSD)} $
          </p>

          <p className="mt-5 text-gray-400">
            Montant exact en gourdes
          </p>

          <p className="mt-1 text-3xl font-black text-yellow-400">
            {formatMoney(priceHTG)} GDS
          </p>
        </section>

        {/* CODE PROMOTIONNEL */}

        <section className="mt-7 rounded-3xl border border-yellow-500/30 bg-[#151515] p-6">
          <h2 className="text-xl font-bold">
            🎟️ Code promotionnel
          </h2>

          <input
            value={promoCode}
            onChange={(e) =>
              setPromoCode(e.target.value.toUpperCase())
            }
            placeholder="Exemple : JTN2026"
            className="mt-5 w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-yellow-500"
          />

          <button
            onClick={applyPromoCode}
            className="mt-4 w-full rounded-xl border border-yellow-500/50 py-4 font-bold text-yellow-400"
          >
            Appliquer
          </button>

          {promoMessage && (
            <p className="mt-3 text-center text-sm text-yellow-400">
              {promoMessage}
            </p>
          )}
        </section>

        {/* IDENTIFIANT JTN */}

        <section className="mt-7 rounded-3xl border border-white/10 bg-[#151515] p-6">
          <h2 className="text-xl font-bold">
            Identifiant JTN BOX
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Entre ton identifiant pour retrouver ton compte.
          </p>

          <input
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setProfile(null);
            }}
            placeholder="Exemple : 3885936494"
            className="mt-5 w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-red-500"
          />

          <button
            onClick={searchAccount}
            disabled={loading}
            className="mt-4 w-full rounded-full bg-red-600 py-4 font-bold disabled:opacity-50"
          >
            {loading ? "Vérification..." : "Vérifier mon compte"}
          </button>

          {message && (
            <p className="mt-4 text-center text-sm text-red-400">
              {message}
            </p>
          )}

          {profile && (
            <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="font-bold text-green-400">
                Compte trouvé !
              </p>

              <p className="mt-2 text-gray-300">
                Nom : {profile.full_name}
              </p>

              <p className="text-gray-300">
                Identifiant : {profile.jtn_id}
              </p>
            </div>
          )}
        </section>

        {/* RÉCAPITULATIF */}

        {profile && (
          <section className="mt-7 rounded-3xl border border-yellow-500/40 bg-[#151515] p-6">
            <h2 className="text-2xl font-black">
              Récapitulatif de commande
            </h2>

            <div className="my-5 border-t border-white/10" />

            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Produit</span>
              <strong>JTN BOX STORE</strong>
            </div>

            <div className="mt-4 flex justify-between gap-3">
              <span className="text-gray-400">Abonnement</span>
              <strong>{selectedPlan}</strong>
            </div>

            <div className="mt-4 flex justify-between gap-3">
              <span className="text-gray-400">Application</span>
              <strong>JTN BOX2</strong>
            </div>

            <div className="mt-4 flex justify-between gap-3">
              <span className="text-gray-400">Client</span>
              <strong>{profile.full_name}</strong>
            </div>

            <div className="mt-4 flex justify-between gap-3">
              <span className="text-gray-400">ID JTN</span>
              <strong>{profile.jtn_id}</strong>
            </div>

            <div className="mt-4 flex justify-between gap-3">
              <span className="text-gray-400">Quantité</span>
              <strong>1 abonnement</strong>
            </div>

            <div className="my-5 border-t border-white/10" />

            <div className="flex justify-between">
              <span className="text-gray-400">Prix USD</span>
              <strong>{formatMoney(priceUSD)} $</strong>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-gray-400">Sous-total</span>
              <strong>{formatMoney(priceHTG)} GDS</strong>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-gray-400">Frais</span>
              <strong>0 GDS</strong>
            </div>

            <div className="my-5 border-t border-white/10" />

            <div className="flex items-center justify-between">
              <strong className="text-xl">TOTAL</strong>

              <strong className="text-2xl text-yellow-400">
                {formatMoney(priceHTG)} GDS
              </strong>
            </div>

            <button
              onClick={confirmPurchase}
              className="mt-7 w-full rounded-xl bg-yellow-500 py-4 font-black text-black transition hover:bg-yellow-400"
            >
              CONFIRMER MON ACHAT
            </button>
          </section>
        )}

      </div>
    </main>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
          Chargement...
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}
