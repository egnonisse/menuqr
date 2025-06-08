"use client";

import { useState } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon as CrownIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { PLAN_DETAILS, formatPrice, getPlanBadgeColor } from "@/lib/subscription";
import { useSubscription } from "@/hooks/useSubscription";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const { subscription, isLoading } = useSubscription();

  const plans = Object.entries(PLAN_DETAILS);

  const handleUpgrade = (planName: string) => {
    // TODO: Implémenter l'upgrade via Stripe
    console.log(`Upgrade to ${planName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre plan MenuQR
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            De la découverte à l'Enterprise, trouvez la solution parfaite pour votre restaurant
          </p>
          
          {/* Toggle Billing Period */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={billingPeriod === "monthly" ? "font-semibold" : "text-gray-500"}>
              Mensuel
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-orange-600"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  billingPeriod === "yearly" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={billingPeriod === "yearly" ? "font-semibold" : "text-gray-500"}>
              Annuel
              <span className="ml-1 text-green-600 text-sm font-bold">(-15%)</span>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
          {plans.map(([planKey, plan]) => {
            const isCurrentPlan = subscription?.plan === planKey;
            const isEnterprise = planKey === "ENTERPRISE";
            const isPopular = planKey === "GROWTH";
            
            const monthlyPrice = plan.price;
            const yearlyPrice = monthlyPrice ? Math.round(monthlyPrice * 12 * 0.85) : null;
            const displayPrice = billingPeriod === "yearly" ? yearlyPrice : monthlyPrice;

            return (
              <div
                key={planKey}
                className={`relative rounded-2xl border-2 p-8 ${
                  isPopular
                    ? "border-orange-500 shadow-xl scale-105"
                    : "border-gray-200 shadow-lg"
                } ${isCurrentPlan ? "ring-2 ring-blue-500" : ""} bg-white`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Populaire
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Plan actuel
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-2">
                    {isEnterprise && <CrownIcon className="h-6 w-6 text-yellow-500 mr-2" />}
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  {/* Price */}
                  <div className="mb-4">
                    {plan.price === null ? (
                      <div className="text-2xl font-bold text-gray-900">Sur devis</div>
                    ) : plan.price === 0 ? (
                      <div className="text-2xl font-bold text-gray-900">Gratuit</div>
                    ) : (
                      <div>
                        <div className="text-3xl font-bold text-gray-900">
                          {displayPrice}€
                        </div>
                        <div className="text-sm text-gray-500">
                          /{billingPeriod === "yearly" ? "an" : "mois"}
                        </div>
                        {billingPeriod === "yearly" && monthlyPrice && (
                          <div className="text-xs text-green-600">
                            Soit {Math.round(displayPrice! / 12)}€/mois
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>{plan.maxRestaurants === 999 ? "∞" : plan.maxRestaurants} restaurant{plan.maxRestaurants > 1 ? "s" : ""}</div>
                    <div>{plan.maxScansPerMonth === 999999 ? "∞" : plan.maxScansPerMonth.toLocaleString()} scans/mois</div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {plan.highlights.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="mt-auto">
                  {isCurrentPlan ? (
                    <Button
                      disabled
                      className="w-full bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Plan actuel
                    </Button>
                  ) : isEnterprise ? (
                    <Button
                      onClick={() => window.open("mailto:contact@menuqr.fr?subject=Devis Enterprise", "_blank")}
                      className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
                    >
                      Demander un devis
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(planKey)}
                      className={`w-full ${
                        isPopular
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                    >
                      {plan.price === 0 ? "Commencer gratuitement" : "Choisir ce plan"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Questions fréquentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. 
                Les changements sont effectifs immédiatement.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">
                Que se passe-t-il si je dépasse mes limites ?
              </h3>
              <p className="text-gray-600">
                Nous vous enverrons une notification pour vous proposer un upgrade. 
                Vos services continueront de fonctionner normalement.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">
                Y a-t-il une période d'essai ?
              </h3>
              <p className="text-gray-600">
                Le plan Freemium vous permet de tester toutes les fonctionnalités de base 
                gratuitement, sans limite de temps.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">
                Comment fonctionne le support ?
              </h3>
              <p className="text-gray-600">
                Support par email pour tous les plans, chat en direct pour Growth+, 
                et support prioritaire pour Business et Enterprise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 