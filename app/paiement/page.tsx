
"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PaymentMethod = "NatCash" | "MonCash";

type Confirmation = {
  orderId: string;
  email: string;
  fullName: string;
  jtnId: string;
  plan: string;
  priceUSD: number;
  priceHTG: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
};

const paymentDetails = {
  NatCash: {
    name: "Mulane Duperoy",
    number: "35024472",
  },
  MonCash: {
    name: "Mulane Duperoy",
    number: "34798991",
  },
};

function PaiementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const plan = searchParams.get("plan") || "Abonnement JTN BOX";
  const price = Number(
    (searchParams.get("price") || "0").replace(",", ".")
  );
  const amount = Number(searchParams.get("gds") || "0");
  const id = searchParams.get("id") || "";

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | null>(null);

  const [proof, setProof] = useState<File | null>(null);
  const [proofError, setProofError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailNotice, setEmailNotice] = useState("");

  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testError, setTestError] = useState("");

  const [confirmation, setConfirmation] =
    useState<Confirmation | null>(null);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 2,
    }).format(value);

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      alert("Copié !");
    } catch {
      alert("Impossible de copier.");
    }
  }

  async function sendTestEmail() {
    if (testLoading) return;

    setTestLoading(true);
    setTestMessage("");
    setTestError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error(
          "Connecte-toi à ton compte avant le test."
        );
      }

      const response = await fetch("/api/send-test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Impossible d'envoyer l'e-mail de test."
        );
      }

      setTestMessage(
        "Demande acceptée par Resend. Vérifie la boîte Gmail et les spams de christjustind@gmail.com."
      );
    } catch (error) {
      setTestError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setTestLoading(false);
    }
  }

  function handleProof(file?: File) {
    setProofError("");
    setProof(null);

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setProofError("Choisis une image JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > 22 * 1024 * 1024) {
      setProofError("La photo doit faire moins de 22 Mo.");
      return;
    }

    setProof(file);
  }

  async function sendProof() {
    if (loading) return;

    if (!paymentMethod) {
      setProofError("Choisis d'abord ton moyen de paiement.");
      return;
    }

    if (!proof) {
      setProofError("Une preuve de paiement est obligatoire.");
      return;
    }

    if (
      !id ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setProofError(
        "Les informations de commande sont incomplètes."
      );
      return;
    }

    setLoading(true);
    setProofError("");
    setEmailNotice("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Connecte-toi à ton compte avant d'envoyer ta preuve."
        );
      }

      if (!user.email) {
        throw new Error("Adresse Gmail introuvable.");
      }

      const { data: profileData, error: profileError } =
        await supabase.rpc("lookup_jtn_profile", {
          p_jtn_id: id,
        });

      if (profileError) {
        throw new Error(
          "Impossible de vérifier ton compte JTN."
        );
      }

      const profile = Array.isArray(profileData)
        ? profileData[0]
        : profileData;

      if (!profile?.full_name) {
        throw new Error("Nom du compte JTN introuvable.");
      }

      const extension = proof.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, proof, {
          contentType: proof.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          "Erreur pendant l'envoi de la photo : " +
            uploadError.message
        );
      }

      const { data: order, error: orderError } = await supabase
        .from("payment_orders")
        .insert({
          user_id: user.id,
          email: user.email,
          jtn_id: id,
          full_name: profile.full_name,
          plan,
          amount_usd: price,
          amount_htg: amount,
          proof_path: filePath,
          status: "pending",
        })
        .select("id, created_at")
        .single();

      if (orderError || !order) {
        throw new Error(
          "La commande n'a pas pu être enregistrée : " +
            (orderError?.message || "Erreur inconnue.")
        );
      }

      let adminNotice = "";

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          throw new Error("Session utilisateur introuvable.");
        }

        const adminResponse = await fetch("/api/notify-admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            orderId: order.id,
          }),
        });

        const adminResult = await adminResponse.json();

        if (!adminResponse.ok) {
          throw new Error(
            adminResult.error ||
              "Notification admin non envoyée."
          );
        }

        adminNotice = "Notification envoyée à JTN BOX ADMIN.";
      } catch (adminError) {
        console.error(
          "Erreur notification admin :",
          adminError
        );
        adminNotice = "Notification admin non envoyée.";
      }

      let notice =
        "Commande enregistrée. En attente de vérification.";

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          throw new Error("Session utilisateur introuvable.");
        }

        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            orderId: order.id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Échec de l'envoi de l'e-mail."
          );
        }

        notice = "Un e-mail de confirmation a été envoyé.";
      } catch (emailError) {
        console.error(
          "Erreur e-mail client :",
          emailError
        );

        notice =
          "Commande enregistrée, mais l'e-mail client n'a pas pu être envoyé.";
      }

      if (adminNotice) {
        notice += " " + adminNotice;
      }

      setEmailNotice(notice);

      setConfirmation({
        orderId: order.id,
        email: user.email,
        fullName: profile.full_name,
        jtnId: id,
        plan,
        priceUSD: price,
        priceHTG: amount,
        paymentMethod,
        createdAt: order.created_at,
      });
    } catch (error) {
      setProofError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  const details = paymentMethod
    ? paymentDetails[paymentMethod]
    : null;

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-2xl">

        {confirmation ? (
          <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl text-green-600">
                ✓
              </div>

              <p className="mt-5 text-sm font-black tracking-[0.3em] text-yellow-600">
                JTN BOX STORE
              </p>

              <h1 className="mt-3 text-3xl font-black">
                Commande enregistrée !
              </h1>

              <p className="mt-3 text-gray-600">
                Ta preuve a été envoyée. Notre équipe doit maintenant
                vérifier ton paiement.
              </p>

              <span className="mt-5 inline-block rounded-full bg-yellow-100 px-5 py-3 font-bold text-yellow-800">
                En attente de vérification
              </span>

              <p className="mt-4 text-sm font-semibold text-gray-600">
                {emailNotice}
              </p>
            </div>

            <div className="my-7 border-t" />

            <h2 className="text-xl font-black">
              Détails de ton achat
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Adresse Gmail</p>
                <p className="break-all font-bold">
                  {confirmation.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Nom du client</p>
                <p className="font-bold">
                  {confirmation.fullName}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Identifiant JTN</p>
                <p className="font-bold">{confirmation.jtnId}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Abonnement acheté
                </p>
                <p className="font-bold">{confirmation.plan}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Moyen de paiement
                </p>
                <p className="font-bold">
                  {confirmation.paymentMethod}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Prix en dollars
                </p>
                <p className="text-xl font-black">
                  {formatMoney(confirmation.priceUSD)} USD
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Prix en gourdes
                </p>
                <p className="text-2xl font-black text-yellow-600">
                  {formatMoney(confirmation.priceHTG)} HTG
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Date et heure
                </p>
                <p className="font-bold">
                  {new Date(confirmation.createdAt).toLocaleString(
                    "fr-FR",
                    {
                      dateStyle: "long",
                      timeStyle: "short",
                      timeZone: "America/Port-au-Prince",
                    }
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Référence de commande
                </p>
                <p className="break-all font-bold">
                  {confirmation.orderId}
                </p>
              </div>
            </div>

            <div className="my-7 border-t" />

            <section className="rounded-2xl bg-yellow-50 p-5">
              <h3 className="text-lg font-black">
                Besoin d'aide ?
              </h3>

              <p className="mt-3 text-sm text-gray-700">
                Contacte notre assistance JTN BOX STORE.
              </p>

              <p className="mt-4 font-bold">
                Gmail : christjustind@gmail.com
              </p>

              <a
                href="https://wa.me/50931136622"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-xl bg-green-600 py-3 text-center font-bold text-white"
              >
                Contacter sur WhatsApp
              </a>

              <a
                href="mailto:christjustind@gmail.com"
                className="mt-3 block rounded-xl border border-yellow-500 py-3 text-center font-bold text-gray-900"
              >
                Envoyer un e-mail
              </a>
            </section>

            <p className="mt-6 text-center text-xs text-gray-500">
              Conserve ta référence de commande pour toute demande
              concernant ton achat.
            </p>

            <button
              onClick={() => router.push("/")}
              className="mt-6 w-full rounded-xl bg-yellow-500 py-4 font-black text-black hover:bg-yellow-400"
            >
              RETOUR À L'ACCUEIL
            </button>
          </section>
        ) : !paymentMethod ? (
          <>
            <div className="mb-8 text-center">
              <p className="text-sm font-black tracking-[0.3em] text-yellow-600">
                JTN BOX STORE
              </p>

              <h1 className="mt-3 text-3xl font-black">
                Choisir un moyen de paiement
              </h1>

              <p className="mt-3 text-gray-600">
                Sélectionne le service que tu souhaites utiliser.
              </p>
            </div>

            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Abonnement sélectionné
              </p>

              <h2 className="mt-2 text-2xl font-black">{plan}</h2>

              <div className="mt-5 border-t pt-5">
                <p className="text-sm text-gray-500">
                  Montant à payer
                </p>

                <p className="mt-1 text-3xl font-black text-yellow-600">
                  {formatMoney(amount)} GDS
                </p>

                <p className="mt-1 text-gray-500">
                  {formatMoney(price)} USD
                </p>
              </div>
            </section>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("NatCash");
                  setProofError("");
                }}
                className="rounded-3xl border-2 border-yellow-500 bg-white p-7 text-left shadow-sm transition hover:bg-yellow-50"
              >
                <span className="text-3xl font-black text-yellow-600">
                  N
                </span>

                <h2 className="mt-4 text-2xl font-black">
                  NatCash
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Payer avec NatCash
                </p>

                <span className="mt-6 block rounded-xl bg-yellow-500 py-3 text-center font-black text-black">
                  CHOISIR NATCASH
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("MonCash");
                  setProofError("");
                }}
                className="rounded-3xl border-2 border-red-500 bg-white p-7 text-left shadow-sm transition hover:bg-red-50"
              >
                <span className="text-3xl font-black text-red-600">
                  M
                </span>

                <h2 className="mt-4 text-2xl font-black">
                  MonCash
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Payer avec MonCash
                </p>

                <span className="mt-6 block rounded-xl bg-red-600 py-3 text-center font-black text-white">
                  CHOISIR MONCASH
                </span>
              </button>
            </div>

            <button
              onClick={() => router.back()}
              className="mt-6 w-full rounded-xl border border-gray-300 bg-white py-4 font-bold"
            >
              Retour à la commande
            </button>
          </>
        ) : (
          <>
            <div className="mb-7 text-center">
              <p className="text-sm font-black tracking-[0.3em] text-yellow-600">
                JTN BOX STORE
              </p>

              <h1 className="mt-3 text-3xl font-black">
                Paiement {paymentMethod}
              </h1>

              <p className="mt-3 text-gray-600">
                Effectue ton transfert avec les informations ci-dessous.
              </p>
            </div>


            {/* COORDONNÉES DE PAIEMENT */}

            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="border-b py-5">
                <p className="text-gray-500">
                  Service de paiement
                </p>
                <p className="mt-2 text-2xl font-black">
                  {paymentMethod}
                </p>
              </div>

              <div className="border-b py-5">
                <p className="text-gray-500">Nom du compte</p>
                <p className="mt-2 text-2xl font-bold">
                  {details?.name}
                </p>
              </div>

              <div className="border-b py-5">
                <p className="text-gray-500">
                  Numéro {paymentMethod}
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {details?.number}
                </p>

                <button
                  onClick={() => copyText(details?.number || "")}
                  className="mt-4 w-full rounded-full border py-3 font-bold hover:bg-gray-100"
                >
                  COPIER
                </button>
              </div>

              <div className="py-5">
                <p className="text-gray-500">Montant à envoyer</p>

                <p className="mt-2 text-3xl font-black">
                  G {formatMoney(amount)}
                </p>

                <button
                  onClick={() => copyText(String(amount))}
                  className="mt-4 w-full rounded-full border py-3 font-bold hover:bg-gray-100"
                >
                  COPIER
                </button>
              </div>
            </section>

            {/* PREUVE DE PAIEMENT */}

            <section className="mt-5 rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">
                Preuve de paiement
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Sélectionne la photo de ton reçu {paymentMethod}
                dans ta galerie.
              </p>

              <label
                htmlFor="payment-proof"
                className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-yellow-500 bg-yellow-50 p-7 text-center transition hover:bg-yellow-100"
              >
                <span className="text-4xl">📷</span>

                <span className="mt-3 font-bold">
                  CHOISIR UNE PHOTO
                </span>

                <span className="mt-2 text-sm text-gray-600">
                  JPG, PNG ou WEBP
                </span>

                <span className="mt-1 text-sm font-semibold text-yellow-700">
                  Taille maximale : 22 Mo
                </span>

                <input
                  id="payment-proof"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) =>
                    handleProof(e.target.files?.[0])
                  }
                />
              </label>

              {proof && (
                <div className="mt-4 rounded-xl border border-green-300 bg-green-50 p-4">
                  <p className="font-bold text-green-700">
                    ✓ Photo sélectionnée
                  </p>

                  <p className="mt-2 break-all text-sm text-gray-700">
                    {proof.name}
                  </p>

                  <p className="text-sm text-gray-600">
                    {(proof.size / (1024 * 1024)).toFixed(2)} Mo
                  </p>

                  <button
                    onClick={() => setProof(null)}
                    className="mt-3 text-sm font-bold text-red-600"
                  >
                    Supprimer la photo
                  </button>
                </div>
              )}

              {proofError && (
                <p className="mt-4 text-sm font-semibold text-red-600">
                  {proofError}
                </p>
              )}

              <p className="mt-4 text-sm font-bold text-red-600">
                * Une preuve est obligatoire pour continuer.
              </p>
            </section>

            {/* CONFIRMATION */}

            <section className="mt-5 rounded-3xl border bg-white p-6 shadow-sm">
              <p className="text-gray-500">
                Statut de vérification
              </p>

              <span className="mt-4 inline-block rounded-full bg-yellow-100 px-5 py-3 font-bold text-yellow-800">
                En attente de paiement
              </span>

              <p className="mt-5 text-lg leading-8">
                Après l'envoi de ta preuve, notre équipe devra
                vérifier le transfert {paymentMethod}.
              </p>

              <button
                onClick={sendProof}
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-yellow-500 py-4 font-bold text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "ENVOI EN COURS..."
                  : "CONFIRMER ET ENVOYER MA PREUVE"}
              </button>

              <button
                onClick={() => {
                  setPaymentMethod(null);
                  setProof(null);
                  setProofError("");
                }}
                disabled={loading}
                className="mt-4 w-full rounded-xl border border-yellow-500 py-4 font-bold text-yellow-700"
              >
                CHANGER DE MOYEN DE PAIEMENT
              </button>
            </section>
          </>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          JTN BOX STORE
        </p>
      </div>
    </main>
  );
}

export default function PaiementPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
          Chargement du paiement...
        </main>
      }
    >
      <PaiementContent />
    </Suspense>
  );
}
