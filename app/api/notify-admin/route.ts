
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Session invalide." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const orderId = body.orderId;

    if (typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Identifiant de commande invalide." },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("payment_orders")
      .select(
        "id, user_id, email, full_name, jtn_id, plan, amount_usd, amount_htg, created_at"
      )
      .eq("id", orderId)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Commande introuvable." },
        { status: 404 }
      );
    }

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;

    if (!adminEmail || !apiKey) {
      return NextResponse.json(
        { error: "Configuration email incomplète." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: "JTN BOX <onboarding@resend.dev>",
      to: ["christjustind@gmail.com"],
      subject: "Nouvelle commande reçue - JTN BOX",
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;color:#222">
          <h1 style="color:#c90020">JTN BOX ADMIN</h1>
          <h2>Nouvelle commande reçue !</h2>

          <p>Un client vient de passer une commande.</p>

          <hr />

          <p><strong>Nom :</strong> ${escapeHtml(order.full_name)}</p>
          <p><strong>Gmail :</strong> ${escapeHtml(order.email || "Non renseigné")}</p>
          <p><strong>JTN ID :</strong> ${escapeHtml(order.jtn_id)}</p>
          <p><strong>Abonnement :</strong> ${escapeHtml(order.plan)}</p>
          <p><strong>Prix :</strong> ${Number(order.amount_usd).toFixed(2)} USD</p>
          <p><strong>Montant :</strong> ${Number(order.amount_htg).toFixed(2)} HTG</p>
          <p><strong>Référence :</strong> ${escapeHtml(order.id)}</p>

          <hr />

          <p>
            Connecte-toi à ton tableau de bord JTN BOX ADMIN
            pour vérifier la preuve de paiement.
          </p>

          <p style="color:#888">Notification automatique JTN BOX.</p>
        </div>
      `,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur notification admin :", error);

    return NextResponse.json(
      { error: "Impossible d'envoyer la notification." },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
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
