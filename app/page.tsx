
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#080808] text-white">

      {/* INTRO */}
      {showIntro && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black">
          <div className="animate-pulse">
            <Image
              src="/logo.jpg"
              alt="JTN BOX STORE"
              width={150}
              height={150}
              priority
              className="rounded-3xl"
            />
          </div>

          <h1 className="mt-8 text-3xl font-black tracking-widest">
            JTN <span className="text-red-600">BOX</span>
          </h1>

          <p className="mt-4 text-center text-sm tracking-widest text-yellow-500">
            Le divertissement entre dans une nouvelle ère
          </p>

          <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-gray-800">
            <div className="h-full w-full origin-left animate-[introbar_3.8s_ease-in-out_forwards] bg-red-600" />
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative flex min-h-[650px] flex-col items-center justify-center px-6 py-24 text-center">

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(180,0,0,0.18),_transparent_65%)]" />

        <div className="relative z-10 max-w-4xl">

          <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-5 py-2 text-xs font-bold tracking-[0.25em] text-yellow-500">
            BIENVENUE SUR JTN BOX STORE
          </span>

          <h1 className="mt-10 text-5xl font-black leading-tight sm:text-7xl">
            LE DIVERTISSEMENT
            <br />
            <span className="text-red-600">ENTRE DANS UNE</span>
            <br />
            NOUVELLE ÈRE
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-gray-400">
            Découvrez une nouvelle expérience de divertissement avec
            JTN BOX. Films, séries, animés et bien plus encore.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/abonnements"
              className="rounded-xl bg-red-600 px-8 py-4 font-black shadow-lg shadow-red-900/30 transition hover:bg-red-700"
            >
              DÉCOUVRIR LES OFFRES
            </Link>

          
          </div>

          <div className="mt-14 flex flex-wrap justify-center gap-3 text-xs font-bold tracking-widest text-gray-400">
            <span className="rounded-lg border border-white/10 px-5 py-3">
              FILMS
            </span>
            <span className="rounded-lg border border-white/10 px-5 py-3">
              SÉRIES
            </span>
            <span className="rounded-lg border border-white/10 px-5 py-3">
              ANIMÉS
            </span>
            <span className="rounded-lg border border-yellow-500/30 px-5 py-3 text-yellow-500">
              VIP
            </span>
          </div>
        </div>
      </section>

      {/* ABONNEMENTS */}
      <section className="px-6 py-20">

        <div className="mx-auto max-w-6xl">

          <div className="mb-14 text-center">
            <p className="text-sm font-bold tracking-[0.3em] text-yellow-500">
              NOS FORMULES
            </p>

            <h2 className="mt-4 text-4xl font-black">
              CHOISISSEZ VOTRE <span className="text-red-600">EXPÉRIENCE</span>
            </h2>

            <p className="mt-4 text-gray-400">
              Découvrez les offres disponibles sur JTN BOX STORE.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">

            {/* PREMIUM */}
            <div className="rounded-3xl border border-red-600/40 bg-gradient-to-b from-[#1c0808] to-[#0b0b0b] p-8 shadow-xl shadow-red-950/20">

              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-black">PREMIUM</h3>
                <span className="rounded-full bg-red-600/20 px-4 py-2 text-xs font-bold text-red-500">
                  PREMIUM
                </span>
              </div>

              <p className="text-gray-400">
                Profitez d'une expérience enrichie.
              </p>

              <div className="my-8">
                <span className="text-5xl font-black">7$</span>
                <span className="ml-2 text-gray-400">/ abonnement</span>
              </div>

              <ul className="space-y-4 text-gray-300">
                <li>✓ Accès à l'expérience Premium</li>
                <li>✓ Contenu et fonctionnalités Premium</li>
                <li>✓ Assistance utilisateur</li>
              </ul>

              <Link
                href="/abonnements"
                className="mt-10 block rounded-xl bg-red-600 py-4 text-center font-black transition hover:bg-red-700"
              >
                DÉCOUVRIR PREMIUM
              </Link>
            </div>

            {/* VIP */}
            <div className="rounded-3xl border border-yellow-500/40 bg-gradient-to-b from-[#1c1708] to-[#0b0b0b] p-8 shadow-xl shadow-yellow-950/20">

              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-black text-yellow-500">VIP</h3>
                <span className="rounded-full bg-yellow-500/10 px-4 py-2 text-xs font-bold text-yellow-500">
                  EXCLUSIF
                </span>
              </div>

              <p className="text-gray-400">
                Découvrez notre formule VIP.
              </p>

              <div className="my-8">
                <span className="text-5xl font-black">10$</span>
                <span className="ml-2 text-gray-400">/ abonnement</span>
              </div>

              <ul className="space-y-4 text-gray-300">
                <li>✓ Expérience VIP</li>
                <li>✓ Fonctionnalités exclusives</li>
                <li>✓ Assistance utilisateur</li>
              </ul>

              <Link
                href="/abonnements"
                className="mt-10 block rounded-xl border border-yellow-500 bg-yellow-500 py-4 text-center font-black text-black transition hover:bg-yellow-400"
              >
                DÉCOUVRIR VIP
              </Link>
            </div>

          </div>

          <div className="mt-12 text-center">
            <Link
              href="/abonnements"
              className="inline-block rounded-xl border border-white/20 px-8 py-4 font-bold transition hover:border-yellow-500 hover:text-yellow-500"
            >
              VOIR TOUS LES ABONNEMENTS
            </Link>
          </div>

        </div>
      </section>

      {/* AVANTAGES */}
      <section className="border-y border-white/10 bg-[#101010] px-6 py-20">

        <div className="mx-auto max-w-6xl">

          <div className="text-center">
            <p className="text-sm font-bold tracking-[0.3em] text-yellow-500">
              POURQUOI JTN BOX ?
            </p>

            <h2 className="mt-4 text-4xl font-black">
              UNE EXPÉRIENCE <span className="text-red-600">UNIQUE</span>
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-2xl border border-white/10 bg-black p-7">
              <div className="text-4xl">🎬</div>
              <h3 className="mt-5 text-xl font-bold">Divertissement</h3>
              <p className="mt-3 text-sm leading-7 text-gray-400">
                Une plateforme pensée pour réunir films, séries et animés.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-7">
              <div className="text-4xl">💎</div>
              <h3 className="mt-5 text-xl font-bold">Offres Premium et VIP</h3>
              <p className="mt-3 text-sm leading-7 text-gray-400">
                Plusieurs formules pour choisir votre expérience.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-7">
              <div className="text-4xl">🛡️</div>
              <h3 className="mt-5 text-xl font-bold">Votre compte</h3>
              <p className="mt-3 text-sm leading-7 text-gray-400">
                Retrouvez vos informations et vos commandes depuis votre espace.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black px-6 py-12">

        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 md:flex-row">

          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black">
              JTN <span className="text-red-600">BOX</span>
              <span className="ml-2 text-xs text-yellow-500">STORE</span>
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Le divertissement entre dans une nouvelle ère.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-400">
            <Link href="/" className="hover:text-yellow-500">
              Accueil
            </Link>

            <Link href="/abonnements" className="hover:text-yellow-500">
              Abonnements
            </Link>

            <Link href="/code-promo" className="hover:text-yellow-500">
              Code promo
            </Link>

            <Link href="/assistance" className="hover:text-yellow-500">
              Assistance
            </Link>
          </div>

        </div>

        <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-center text-xs text-gray-600">
          © 2026 JTN BOX STORE. Tous droits réservés.
        </div>

      </footer>

      <style jsx global>{`
        @keyframes introbar {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>

    </main>
  );
}
