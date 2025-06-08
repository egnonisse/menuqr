"use client";

import { usePlanLimits, useSubscription } from "@/hooks/useSubscription";
import { PLAN_DETAILS, formatPrice, getPlanBadgeColor } from "@/lib/subscription";
import { ArrowUpIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { SoftLimitNotification } from "./SoftLimitNotification";
import Link from "next/link";

export function PlanLimitsCard() {
  const {
    currentPlan,
    remainingScans,
    remainingRestaurants,
    scansUsagePercentage,
    restaurantsUsagePercentage,
    isLoading,
  } = usePlanLimits();

  const {
    getScansLimitStatus,
    getRestaurantsLimitStatus,
    isGrandfathered,
  } = useSubscription();

  if (isLoading || !currentPlan) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const planDetails = PLAN_DETAILS[currentPlan];
  const scansStatus = getScansLimitStatus();
  const restaurantsStatus = getRestaurantsLimitStatus();
  const hasNotifications = (scansStatus?.shouldNotify || restaurantsStatus?.shouldNotify);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Plan actuel</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(currentPlan)}`}>
              {planDetails.name}
            </span>
            <span className="text-sm text-gray-500">
              {formatPrice(planDetails.price)}
            </span>
            {isGrandfathered && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✨ Grandfathered
              </span>
            )}
          </div>
        </div>
        
        {hasNotifications ? (
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
        ) : (
          <CheckCircleIcon className="h-6 w-6 text-green-500" />
        )}
      </div>

      {/* Soft Limit Notifications */}
      {hasNotifications && (
        <div className="mb-6 space-y-3">
          {scansStatus?.shouldNotify && scansStatus.message && (
            <SoftLimitNotification
              level={scansStatus.level}
              message={scansStatus.message}
              percentage={scansStatus.percentage * 100}
              type="scans"
              className="text-xs"
              showUpgrade={!isGrandfathered}
            />
          )}
          {restaurantsStatus?.shouldNotify && restaurantsStatus.message && (
            <SoftLimitNotification
              level={restaurantsStatus.level}
              message={restaurantsStatus.message}
              percentage={restaurantsStatus.percentage * 100}
              type="restaurants"
              className="text-xs"
              showUpgrade={!isGrandfathered}
            />
          )}
        </div>
      )}

      {/* Usage Stats */}
      <div className="space-y-6">
        {/* Scans QR */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Scans QR ce mois</span>
            <span className="text-sm text-gray-600">
              {remainingScans} restants
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                scansUsagePercentage > 90
                  ? "bg-red-500"
                  : scansUsagePercentage > 80
                  ? "bg-amber-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(100, scansUsagePercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{Math.round((planDetails.maxScansPerMonth * scansUsagePercentage) / 100)} utilisés</span>
            <span>{planDetails.maxScansPerMonth === 999999 ? "∞" : planDetails.maxScansPerMonth.toLocaleString()} max</span>
          </div>
        </div>

        {/* Restaurants */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Restaurants</span>
            <span className="text-sm text-gray-600">
              {remainingRestaurants} restants
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                restaurantsUsagePercentage > 90
                  ? "bg-red-500"
                  : restaurantsUsagePercentage > 80
                  ? "bg-amber-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(100, restaurantsUsagePercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{Math.round((planDetails.maxRestaurants * restaurantsUsagePercentage) / 100)} utilisés</span>
            <span>{planDetails.maxRestaurants === 999 ? "∞" : planDetails.maxRestaurants} max</span>
          </div>
        </div>
      </div>

      {/* Fonctionnalités clés */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Fonctionnalités incluses</h4>
        <div className="grid grid-cols-2 gap-2">
          {planDetails.highlights.slice(0, 4).map((feature, index) => (
            <div key={index} className="flex items-center text-xs text-gray-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
        {currentPlan !== "ENTERPRISE" && (
          <Link href="/pricing">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
              <ArrowUpIcon className="h-4 w-4 mr-2" />
              Upgrader mon plan
            </Button>
          </Link>
        )}
        
        <Link href="/admin/billing">
          <Button variant="outline" className="w-full">
            Gérer ma facturation
          </Button>
        </Link>
      </div>

      {/* Info message pour les utilisateurs grandfathered */}
      {isGrandfathered && !hasNotifications && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
            <div className="text-sm">
              <p className="text-green-800 font-medium">Compte privilégié</p>
              <p className="text-green-700 mt-1">
                Vous bénéficiez de l'accès complet sans restrictions pendant la transition.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 