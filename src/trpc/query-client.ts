import {
	QueryClient,
	defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				// Augmenter staleTime pour réduire les refetch automatiques
				staleTime: 5 * 60 * 1000, // 5 minutes
				// Configuration des retries pour éviter la surcharge du pool
				retry: (failureCount, error: any) => {
					// Ne pas retry les erreurs de pool de connexions
					if (error?.message?.includes('Timed out fetching a new connection')) {
						return failureCount < 2; // Limiter à 2 tentatives max
					}
					// Ne pas retry les erreurs de prepared statements immédiatement
					if (error?.code === '26000' || error?.message?.includes('prepared statement')) {
						return failureCount < 1; // Une seule tentative
					}
					// Retry normal pour les autres erreurs
					return failureCount < 3;
				},
				retryDelay: (attemptIndex) => {
					// Délai progressif plus long pour éviter de surcharger la DB
					return Math.min(1000 * 2 ** attemptIndex, 30000);
				},
			},
			mutations: {
				// Configuration des mutations pour une meilleure gestion d'erreurs
				retry: (failureCount, error: any) => {
					// Ne jamais retry les mutations en cas d'erreur de connexion
					if (error?.message?.includes('Timed out fetching a new connection') ||
						error?.code === '26000' ||
						error?.message?.includes('prepared statement')) {
						return false; // Pas de retry pour éviter la double mutation
					}
					return failureCount < 1; // Une seule tentative pour les autres erreurs
				},
			},
			dehydrate: {
				serializeData: SuperJSON.serialize,
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) ||
					query.state.status === "pending",
			},
			hydrate: {
				deserializeData: SuperJSON.deserialize,
			},
		},
	});
