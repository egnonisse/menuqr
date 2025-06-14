"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PendingApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // Si l'utilisateur est approuvé, rediriger vers l'admin
    if (session.user.isApproved && session.user.role === "ADMIN") {
      router.push("/admin");
      return;
    }
  }, [session, status, router]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isRejected = session.user.role === "REJECTED";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-yellow-100 mb-4">
            {isRejected ? (
              <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="h-12 w-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        </div>

        <div className="bg-white max-w-md w-full rounded-lg shadow-md p-6">
          {isRejected ? (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-900 mb-4">
                  Compte Rejeté
                </h2>
                <p className="text-gray-600 mb-6">
                  Votre demande d'inscription a été rejetée par notre équipe.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-red-800 mb-2">Raison du rejet :</h3>
                  <p className="text-red-700 text-sm">
                    Aucune raison spécifiée
                  </p>
                </div>

                <div className="text-left text-sm text-gray-600 mb-6">
                  <p className="mb-2">
                    <strong>Compte :</strong> {session.user.email}
                  </p>
                  <p className="mb-2">
                    <strong>Nom :</strong> {session.user.name}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Si vous pensez qu&apos;il y a une erreur, contactez notre support à{" "}
                    <a href="mailto:support@menuqr.com" className="text-indigo-600 hover:text-indigo-500">
                      support@menuqr.com
                    </a>
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Se déconnecter
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Validation en Cours
                </h2>
                <p className="text-gray-600 mb-6">
                  Votre compte est en cours de validation par notre équipe. Vous recevrez un email dès que votre compte sera approuvé.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">Informations de votre compte :</h3>
                  <div className="text-left text-sm text-blue-700">
                    <p className="mb-1">
                      <strong>Email :</strong> {session.user.email}
                    </p>
                    <p className="mb-1">
                      <strong>Nom :</strong> {session.user.name}
                    </p>
                    <p className="mb-1">
                      <strong>Statut :</strong> En attente d&apos;approbation
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-yellow-800">
                        <strong>Délai habituel :</strong> 24-48 heures ouvrables
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    En cas de question, contactez-nous à{" "}
                    <a href="mailto:support@menuqr.com" className="text-indigo-600 hover:text-indigo-500">
                      support@menuqr.com
                    </a>
                  </p>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Se déconnecter
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 