
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json(
        { error: "Connexion requise." },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: userData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !userData.user) {
      return NextResponse.json(
        { error: "Session invalide." },
        { status: 401 }
      );
    }

    // Vérifier que le compte est administrateur.
    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: "Accès réservé à l'administration." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (
      typeof orderId !== "string" ||
      !["approved", "rejected"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Informations invalides." },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Commande introuvable." },
        { status: 404 }
      );
    }

    if (order.status === status) {
      return NextResponse.json({
        success: true,
        message: "Ce statut est déjà enregistré.",
      });
    }

    // Mise à jour autorisée par la politique RLS ADMIN.
    const { error: updateError } = await supabase
      .from("payment_orders")
      .update({ status })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json(
        { error: "Erreur de modification : " + updateError.message },
        { status: 500 }
      );
    }

    if (!order.email) {
      return NextResponse.json({
        success: true,
        warning: "Statut modifié, mais aucun e-mail client n'est enregistré.",
      });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        warning: "Statut modifié, mais Resend n'est pas configuré.",
      });
    }

    const resend = new Resend(apiKey);
    const approved = status === "approved";

    const result = await resend.emails.send({
      from: "JTN BOX <onboarding@resend.dev>",
      to: [order.email],
      subject: approved
        ? "Paiement approuvé - JTN BOX"
        : "Mise à jour de votre commande - JTN BOX",
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;color:#222">
          <h1 style="color:#c90020">JTN BOX STORE</h1>

          <h2>
            ${approved ? "Paiement approuvé !" : "Paiement refusé"}
          </h2>

          <p>Bonjour ${escapeHtml(order.full_name || "Client")},</p>

          <p>
            ${
              approved
                ? "Bonne nouvelle ! Votre paiement a été approuvé par notre administration."
                : "Après vérification, votre paiement n'a pas été approuvé. Veuillez contacter notre assistance pour obtenir des informations."
            }
          </p>

          <hr />

          <p><strong>JTN ID :</strong> ${escapeHtml(order.jtn_id || "")}</p>
          <p><strong>Abonnement :</strong> ${escapeHtml(order.plan || "")}</p>
          <p><strong>Prix :</strong> ${Number(order.amount_usd).toFixed(2)} USD</p>
          <p><strong>Montant :</strong> G ${Number(order.amount_htg).toFixed(2)}</p>
          <p><strong>Référence :</strong> ${escapeHtml(order.id)}</p>

          <hr />

          <p>Merci d'utiliser JTN BOX STORE.</p>
        </div>
      `,
    });

    if (result.error) {
      console.error("Erreur Resend :", result.error);

      return NextResponse.json({
        success: true,
        warning: "Statut modifié, mais l'e-mail n'a pas pu être envoyé.",
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
    });

  } catch (error) {
    console.error("Erreur notification statut :", error);

    return NextResponse.json(
      { error: "Impossible de traiter cette demande." },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}
