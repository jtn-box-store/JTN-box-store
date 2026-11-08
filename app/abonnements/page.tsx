
import Link from "next/link";

const plans = [
  {
    name: "1 MOIS",
    description: "Accès pendant 1 mois",
    price: "3 $",
    features: [
      "Accès pendant 1 mois",
    ],
  },
  {
    name: "2 MOIS",
    description: "Accès pendant 2 mois",
    price: "4,99 $",
    features: [
      "Accès pendant 2 mois",
    ],
  },
  {
    name: "3 MOIS",
    description: "Accès pendant 3 mois",
    price: "6 $",
    features: [
      "Accès pendant 3 mois",
    ],
  },
  {
    name: "STANDARD AVEC PUB",
    description: "Forfait Standard avec publicité",
    price: "6,99 $",
    features: [
      "Qualité vidéo : 144p, 320p et 480p",
      "Jusqu'à 2 appareils",
      "Publicités pendant le visionnage",
    ],
  },
  {
    name: "STANDARD SANS PUB",
    description: "Forfait Standard sans publicité",
    price: "8 $",
    features: [
      "Qualité vidéo jusqu'à Full HD 1080p",
      "Accès au catalogue complet",
      "Sans publicité",
    ],
  },
  {
    name: "PREMIUM",
    description: "Forfait Premium",
    price: "9 $",
    features: [
      "Qualité vidéo jusqu'à 4K Ultra HD",
      "3 appareils simultanément",
      "Programmes différents sur les appareils",
      "Sans publicité",
      "Accès au catalogue mondial",
      "Badge Premium",
    ],
  },
  {
    name: "VIP",
    description: "Forfait VIP",
    price: "11 $",
    features: [
      "Badge VIP",
      "Accès à tous les contenus",
      "Accès à toutes les fonctionnalités VIP",
    ],
  },
];

export default function AbonnementsPage() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">

        <div className="mb-12 text-center">
          <p className="text-sm font-black tracking-[0.4em] text-yellow-500">
            JTN BOX
          </p>

          <h1 className="mt-4 text-3xl font-black uppercase sm:text-5xl">
            NOS ABONNEMENTS
          </h1>

          <p className="mt-4 text-gray-400">
            Choisis le forfait qui te convient.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-3xl border border-yellow-600/40 bg-[#111111] p-7 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-yellow-400"
            >

              <div>
                <p className="text-xs font-black tracking-[0.3em] text-yellow-500">
                  JTN BOX
                </p>

                <h2 className="mt-4 text-2xl font-black uppercase">
                  {plan.name}
                </h2>

                <p className="mt-3 text-sm text-gray-400">
                  {plan.description}
                </p>

                <div className="mt-6">
                  <p className="text-sm font-bold text-yellow-500">
                    AVANTAGES DU FORFAIT
                  </p>

                  <ul className="mt-4 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-gray-300"
                      >
                        <span className="font-black text-yellow-500">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-7 mt-auto pt-8">
                <p className="text-sm font-semibold text-gray-500">
                  Prix de l'abonnement
                </p>

                <p className="mt-2 text-4xl font-black text-yellow-500">
                  {plan.price}
                </p>
              </div>

              <Link
                href={`/verification?plan=${encodeURIComponent(plan.name)}`}
                className="block w-full rounded-full bg-red-600 py-4 text-center font-bold transition hover:bg-red-700"
              >
                Choisir {plan.name}
              </Link>

            </div>
          ))}

        </div>

        <div className="mt-12 text-center">
          <p className="text-xs tracking-wider text-gray-600">
            © JTN BOX — TOUS DROITS RÉSERVÉS
          </p>
        </div>

      </div>
    </main>
  );
}
