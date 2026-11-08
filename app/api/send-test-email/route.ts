
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Connexion requise." },
        { status: 401 }
      );
    }

    const token = authorization.slice(7);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const { data, error } = await supabase.auth.getUser(token);

    if (error || data.user?.email !== "christjustind@gmail.com") {
      return NextResponse.json(
        { error: "Compte non autorisé." },
        { status: 403 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé Resend non configurée." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JTN BOX STORE <onboarding@resend.dev>",
        to: ["christjustind@gmail.com"],
        subject: "TEST - JTN BOX STORE",
        html: `
          <div style="font-family:Arial,sans-serif;padding:25px">
            <h1 style="color:#d4a017">JTN BOX STORE</h1>
            <h2>Test d'envoi réussi !</h2>
            <p>Ceci est un e-mail de test.</p>
            <p>Aucune commande n'a été créée.</p>
            <p>Aucun abonnement n'a été activé.</p>
          </div>
        `,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || "Erreur Resend." },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "E-mail de test envoyé.",
    });
  } catch (error) {
    console.error("Erreur e-mail test :", error);

    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
