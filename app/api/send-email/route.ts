
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");
    const token = authorization?.replace(/^Bearer /i, "");

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

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user?.email) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const orderId = body.orderId;

    if (typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Commande invalide." },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("payment_orders")
      .select("id, user_id, jtn_id, full_name, plan, amount_usd, amount_htg, status, created_at")
      .eq("id", orderId)
      .eq("user_id", authData.user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Commande introuvable ou accès refusé." },
        { status: 404 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Cette commande n'est pas en attente." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Configuration e-mail manquante." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const date = new Date(order.created_at).toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "America/Port-au-Prince",
    });

    const { data, error } = await resend.emails.send({
      from: "JTN BOX STORE <onboarding@resend.dev>",
      to: authData.user.email,
      subject: "Commande reçue - JTN BOX STORE",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;background:#101010;color:white;border-radius:12px">
          <h1 style="color:#eab308">JTN BOX STORE</h1>
          <h2>Votre commande est enregistrée !</h2>
          <p>Bonjour ${escapeHtml(order.full_name)},</p>
          <p>Nous avons bien reçu votre preuve de paiement.</p>
          <p><b>Gmail :</b> ${escapeHtml(authData.user.email)}</p>
          <p><b>JTN ID :</b> ${escapeHtml(order.jtn_id)}</p>
          <p><b>Abonnement :</b> ${escapeHtml(order.plan)}</p>
          <p><b>Prix :</b> ${Number(order.amount_usd).toFixed(2)} USD</p>
          <p><b>Montant :</b> ${Number(order.amount_htg).toFixed(2)} GDS</p>
          <p><b>Date :</b> ${escapeHtml(date)}</p>
          <p><b>Statut :</b> En attente de vérification</p>
          <hr />
          <p>Merci d'avoir choisi JTN BOX STORE.</p>
          <p>Support : christjustind@gmail.com</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "L'envoi de l'e-mail a échoué." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "E-mail envoyé.",
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}
