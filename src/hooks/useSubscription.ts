import { api } from "@/trpc/react";
import { 
  hasFeature, 
  canCreateRestaurant, 
  canScanQR, 
  getSoftLimitStatus,
  getFeatureStatus,
  isUserGrandfathered,
  type PlanFeatures 
} from "@/lib/subscription";

type Plan = "FREEMIUM" | "STARTER" | "GROWTH" | "BUSINESS" | "ENTERPRISE";

export function useSubscription() {
  const { data: subscription, isLoading: subscriptionLoading } = api.subscription.getCurrent.useQuery();
  const { data: usageStats, isLoading: usageLoading } = api.subscription.getUsageStats.useQuery();

  const isLoading = subscriptionLoading || usageLoading;

  // Pour l'instant, on considère tous les utilisateurs comme grandfathered (soft limits uniquement)
  const isGrandfathered = true; // Sera calculé via subscription.createdAt plus tard

  const checkFeature = (feature: keyof PlanFeatures) => {
    if (!subscription) return false;
    const status = getFeatureStatus(subscription.plan, feature, isGrandfathered);
    return status.hasAccess;
  };

  const getFeatureStatusDetailed = (feature: keyof PlanFeatures) => {
    if (!subscription) return { hasAccess: false, isLimited: true, shouldPromote: true };
    return getFeatureStatus(subscription.plan, feature, isGrandfathered);
  };

  const checkCanCreateRestaurant = () => {
    if (!subscription || !usageStats) return false;
    const status = getSoftLimitStatus(
      usageStats.restaurantCount, 
      subscription.maxRestaurants, 
      isGrandfathered
    );
    return !status.shouldBlock; // Toujours true pour les soft limits
  };

  const checkCanScanQR = () => {
    if (!subscription || !usageStats) return false;
    const status = getSoftLimitStatus(
      usageStats.scansThisMonth, 
      subscription.maxScansPerMonth, 
      isGrandfathered
    );
    return !status.shouldBlock; // Toujours true pour les soft limits
  };

  const getScansLimitStatus = () => {
    if (!subscription || !usageStats) return null;
    return getSoftLimitStatus(
      usageStats.scansThisMonth, 
      subscription.maxScansPerMonth, 
      isGrandfathered
    );
  };

  const getRestaurantsLimitStatus = () => {
    if (!subscription || !usageStats) return null;
    return getSoftLimitStatus(
      usageStats.restaurantCount, 
      subscription.maxRestaurants, 
      isGrandfathered
    );
  };

  const getRemainingScans = () => {
    if (!subscription || !usageStats) return 0;
    return Math.max(0, subscription.maxScansPerMonth - usageStats.scansThisMonth);
  };

  const getRemainingRestaurants = () => {
    if (!subscription || !usageStats) return 0;
    return Math.max(0, subscription.maxRestaurants - usageStats.restaurantCount);
  };

  const getUsagePercentage = (type: 'scans' | 'restaurants') => {
    if (!subscription || !usageStats) return 0;
    
    switch (type) {
      case 'scans':
        return Math.min(100, (usageStats.scansThisMonth / subscription.maxScansPerMonth) * 100);
      case 'restaurants':
        return Math.min(100, (usageStats.restaurantCount / subscription.maxRestaurants) * 100);
      default:
        return 0;
    }
  };

  return {
    subscription,
    usageStats,
    isLoading,
    isGrandfathered,
    checkFeature,
    getFeatureStatusDetailed,
    checkCanCreateRestaurant,
    checkCanScanQR,
    getScansLimitStatus,
    getRestaurantsLimitStatus,
    getRemainingScans,
    getRemainingRestaurants,
    getUsagePercentage,
  };
}

export function useFeatureGate(feature: keyof PlanFeatures) {
  const { checkFeature, subscription } = useSubscription();
  
  return {
    hasAccess: checkFeature(feature),
    currentPlan: subscription?.plan,
    isLoading: !subscription,
  };
}

export function usePlanLimits() {
  const { 
    subscription, 
    usageStats, 
    checkCanCreateRestaurant, 
    checkCanScanQR,
    getRemainingScans,
    getRemainingRestaurants,
    getUsagePercentage,
    isLoading 
  } = useSubscription();

  return {
    canCreateRestaurant: checkCanCreateRestaurant(),
    canScanQR: checkCanScanQR(),
    remainingScans: getRemainingScans(),
    remainingRestaurants: getRemainingRestaurants(),
    scansUsagePercentage: getUsagePercentage('scans'),
    restaurantsUsagePercentage: getUsagePercentage('restaurants'),
    currentPlan: subscription?.plan,
    isLoading,
  };
} 