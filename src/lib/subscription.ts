type Plan = "FREEMIUM" | "STARTER" | "GROWTH" | "BUSINESS" | "ENTERPRISE";

export interface PlanFeatures {
  qrMenu: boolean;
  basicHomepage: boolean;
  reservation: boolean;
  tableOrdering: boolean;
  customerReviews: boolean;
  basicStats: boolean;
  advancedDashboard: boolean;
  customization: boolean;
  multiSite: boolean;
  api: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
  dedicatedDeployment?: boolean;
  onboarding?: boolean;
}

export interface PlanDetails {
  name: string;
  price: number | null;
  maxRestaurants: number;
  maxScansPerMonth: number;
  features: PlanFeatures;
  stripePriceId?: string;
  description: string;
  highlights: string[];
}

// Date de lancement du système de tarification (pour grandfathering)
export const PRICING_LAUNCH_DATE = new Date('2024-12-01');

// Seuils pour les notifications soft
export const SOFT_LIMIT_THRESHOLDS = {
  WARNING: 0.8, // 80% - Première alerte
  URGENT: 0.95,  // 95% - Alerte urgente
  CRITICAL: 1.0, // 100% - Limite atteinte (mais pas bloqué)
};

export const PLAN_DETAILS: Record<Plan, PlanDetails> = {
  FREEMIUM: {
    name: "Freemium",
    price: 0,
    maxRestaurants: 1,
    maxScansPerMonth: 50,
    stripePriceId: undefined,
    description: "Parfait pour découvrir MenuQR",
    highlights: [
      "Menu QR illimité",
      "Page d'accueil basique",
      "Formulaire de réservation",
      "50 scans/mois",
    ],
    features: {
      qrMenu: true,
      basicHomepage: true,
      reservation: true,
      tableOrdering: false,
      customerReviews: false,
      basicStats: false,
      advancedDashboard: false,
      customization: false,
      multiSite: false,
      api: false,
      prioritySupport: false,
      whiteLabel: false,
    },
  },
  STARTER: {
    name: "Starter",
    price: 15,
    maxRestaurants: 1,
    maxScansPerMonth: 1000,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    description: "Idéal pour les petits restaurants",
    highlights: [
      "Tout du Freemium",
      "Commande à table",
      "Avis clients",
      "Statistiques basiques",
      "Support email",
    ],
    features: {
      qrMenu: true,
      basicHomepage: true,
      reservation: true,
      tableOrdering: true,
      customerReviews: true,
      basicStats: true,
      advancedDashboard: false,
      customization: false,
      multiSite: false,
      api: false,
      prioritySupport: false,
      whiteLabel: false,
    },
  },
  GROWTH: {
    name: "Growth",
    price: 39,
    maxRestaurants: 3,
    maxScansPerMonth: 5000,
    stripePriceId: process.env.STRIPE_GROWTH_PRICE_ID,
    description: "Pour les restaurants en développement",
    highlights: [
      "Tout du Starter",
      "Jusqu'à 3 restaurants",
      "Tableaux de bord avancés",
      "Personnalisation mini-site",
      "Support chat",
    ],
    features: {
      qrMenu: true,
      basicHomepage: true,
      reservation: true,
      tableOrdering: true,
      customerReviews: true,
      basicStats: true,
      advancedDashboard: true,
      customization: true,
      multiSite: false,
      api: false,
      prioritySupport: false,
      whiteLabel: false,
    },
  },
  BUSINESS: {
    name: "Business",
    price: 79,
    maxRestaurants: 10,
    maxScansPerMonth: 20000,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    description: "Pour les chaînes et groupes",
    highlights: [
      "Tout du Growth",
      "Jusqu'à 10 restaurants",
      "Multi-sites",
      "API & intégrations",
      "Export CSV/PDF",
      "Support prioritaire",
    ],
    features: {
      qrMenu: true,
      basicHomepage: true,
      reservation: true,
      tableOrdering: true,
      customerReviews: true,
      basicStats: true,
      advancedDashboard: true,
      customization: true,
      multiSite: true,
      api: true,
      prioritySupport: true,
      whiteLabel: false,
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: null,
    maxRestaurants: 999,
    maxScansPerMonth: 999999,
    stripePriceId: undefined,
    description: "Solution sur-mesure pour les grands comptes",
    highlights: [
      "Tout du Business",
      "Restaurants illimités",
      "White-label branding",
      "Déploiement dédié & SLA",
      "On-boarding et formation",
      "Intégrations sur-mesure",
    ],
    features: {
      qrMenu: true,
      basicHomepage: true,
      reservation: true,
      tableOrdering: true,
      customerReviews: true,
      basicStats: true,
      advancedDashboard: true,
      customization: true,
      multiSite: true,
      api: true,
      prioritySupport: true,
      whiteLabel: true,
      dedicatedDeployment: true,
      onboarding: true,
    },
  },
};

export function hasFeature(plan: Plan, feature: keyof PlanFeatures): boolean {
  return PLAN_DETAILS[plan].features[feature] ?? false;
}

export function canCreateRestaurant(plan: Plan, currentCount: number): boolean {
  return currentCount < PLAN_DETAILS[plan].maxRestaurants;
}

export function canScanQR(plan: Plan, currentScans: number): boolean {
  return currentScans < PLAN_DETAILS[plan].maxScansPerMonth;
}

// Nouvelles fonctions pour soft limits
export function isUserGrandfathered(userCreatedAt: Date): boolean {
  return userCreatedAt < PRICING_LAUNCH_DATE;
}

export function getSoftLimitStatus(
  current: number, 
  limit: number, 
  isGrandfathered: boolean = false
): {
  level: 'normal' | 'warning' | 'urgent' | 'critical';
  percentage: number;
  shouldBlock: boolean;
  shouldNotify: boolean;
  message?: string;
} {
  const percentage = current / limit;
  
  // Utilisateurs grandfathered ne sont jamais bloqués
  if (isGrandfathered) {
    if (percentage >= SOFT_LIMIT_THRESHOLDS.URGENT) {
      return {
        level: 'warning',
        percentage,
        shouldBlock: false,
        shouldNotify: true,
        message: 'Découvrez nos nouveaux plans pour encore plus de fonctionnalités !',
      };
    }
    return { level: 'normal', percentage, shouldBlock: false, shouldNotify: false };
  }

  // Pour les nouveaux utilisateurs : soft limits uniquement
  if (percentage >= SOFT_LIMIT_THRESHOLDS.CRITICAL) {
    return {
      level: 'critical',
      percentage,
      shouldBlock: false, // Pas de blocage dur pour l'instant
      shouldNotify: true,
      message: 'Limite atteinte ! Upgradez pour continuer sans restrictions.',
    };
  }
  
  if (percentage >= SOFT_LIMIT_THRESHOLDS.URGENT) {
    return {
      level: 'urgent',
      percentage,
      shouldBlock: false,
      shouldNotify: true,
      message: 'Attention : vous approchez de votre limite mensuelle.',
    };
  }
  
  if (percentage >= SOFT_LIMIT_THRESHOLDS.WARNING) {
    return {
      level: 'warning',
      percentage,
      shouldBlock: false,
      shouldNotify: true,
      message: 'Pensez à upgrader votre plan pour plus de fonctionnalités.',
    };
  }

  return { level: 'normal', percentage, shouldBlock: false, shouldNotify: false };
}

export function getFeatureStatus(
  plan: Plan, 
  feature: keyof PlanFeatures,
  isGrandfathered: boolean = false
): {
  hasAccess: boolean;
  isLimited: boolean;
  shouldPromote: boolean;
  message?: string;
} {
  const hasNativeAccess = hasFeature(plan, feature);
  
  // Utilisateurs grandfathered ont accès à tout
  if (isGrandfathered) {
    return {
      hasAccess: true,
      isLimited: false,
      shouldPromote: !hasNativeAccess,
      message: hasNativeAccess ? undefined : 'Découvrez nos nouveaux plans !',
    };
  }

  // Nouveaux utilisateurs : accès selon le plan mais avec promotion
  return {
    hasAccess: hasNativeAccess,
    isLimited: !hasNativeAccess,
    shouldPromote: !hasNativeAccess,
    message: hasNativeAccess ? undefined : `Fonctionnalité disponible avec ${getUpgradeRecommendation(plan, feature) || 'un plan supérieur'}`,
  };
}

export function getUpgradeRecommendation(
  currentPlan: Plan,
  requiredFeature?: keyof PlanFeatures,
): Plan | null {
  const plans: Plan[] = ["FREEMIUM", "STARTER", "GROWTH", "BUSINESS", "ENTERPRISE"];
  const currentIndex = plans.indexOf(currentPlan);

  for (let i = currentIndex + 1; i < plans.length; i++) {
    const plan = plans[i];
    if (!plan) continue;

    if (!requiredFeature || hasFeature(plan, requiredFeature)) {
      return plan;
    }
  }

  return null;
}

export function formatPrice(price: number | null): string {
  if (price === null) return "Sur devis";
  if (price === 0) return "Gratuit";
  return `${price}€/mois`;
}

export function getPlanBadgeColor(plan: Plan): string {
  switch (plan) {
    case "FREEMIUM":
      return "bg-gray-100 text-gray-800";
    case "STARTER":
      return "bg-blue-100 text-blue-800";
    case "GROWTH":
      return "bg-green-100 text-green-800";
    case "BUSINESS":
      return "bg-purple-100 text-purple-800";
    case "ENTERPRISE":
      return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Utilitaire pour les niveaux de notifications
export function getNotificationColor(level: string): string {
  switch (level) {
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'urgent':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'critical':
      return 'bg-red-50 border-red-200 text-red-800';
    default:
      return 'bg-blue-50 border-blue-200 text-blue-800';
  }
} 