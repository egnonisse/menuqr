import Link from "next/link";
import { auth } from "@/server/auth";

export default async function Home() {
	const session = await auth();

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
			<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
				<h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]">
					Menu<span className="text-[hsl(280,100%,70%)]">QR</span>
				</h1>
				<p className="text-xl text-center text-gray-300 max-w-2xl">
					Digitalisez votre restaurant avec des menus QR, réservations en ligne et gestion complète via back-office.
				</p>
				
				{/* Demo Button */}
				<div className="text-center">
					<Link
						href="/demo-restaurant"
						className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold no-underline transition hover:bg-purple-700"
					>
						👀 Voir la démo
					</Link>
				</div>
				
				{/* Features Section */}
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
					<div className="flex flex-col gap-4 rounded-xl bg-white/10 p-6 hover:bg-white/20 transition-colors">
						<div className="text-4xl mb-2">📱</div>
						<h3 className="font-bold text-xl">Menu Digital</h3>
						<p className="text-gray-300">
							Vos clients consultent le menu via QR code directement depuis leur table.
						</p>
					</div>
					
					<div className="flex flex-col gap-4 rounded-xl bg-white/10 p-6 hover:bg-white/20 transition-colors">
						<div className="text-4xl mb-2">📅</div>
						<h3 className="font-bold text-xl">Réservations</h3>
						<p className="text-gray-300">
							Système de réservation en ligne intégré avec gestion en temps réel.
						</p>
					</div>
					
					<div className="flex flex-col gap-4 rounded-xl bg-white/10 p-6 hover:bg-white/20 transition-colors">
						<div className="text-4xl mb-2">⭐</div>
						<h3 className="font-bold text-xl">Avis Clients</h3>
						<p className="text-gray-300">
							Collectez et gérez les retours de vos clients facilement.
						</p>
					</div>
					
					<div className="flex flex-col gap-4 rounded-xl bg-white/10 p-6 hover:bg-white/20 transition-colors">
						<div className="text-4xl mb-2">🎨</div>
						<h3 className="font-bold text-xl">Mini-Site</h3>
						<p className="text-gray-300">
							Page d'accueil personnalisable avec sliders et témoignages.
						</p>
					</div>
					
					<div className="flex flex-col gap-4 rounded-xl bg-white/10 p-6 hover:bg-white/20 transition-colors">
						<div className="text-4xl mb-2">🏪</div>
						<h3 className="font-bold text-xl">Back-Office</h3>
						<p className="text-gray-300">
							Interface d'administration complète pour gérer votre restaurant.
						</p>
					</div>
					
					<div className="flex flex-col gap-4 rounded-xl bg-white/10 p-6 hover:bg-white/20 transition-colors">
						<div className="text-4xl mb-2">📊</div>
						<h3 className="font-bold text-xl">Statistiques</h3>
						<p className="text-gray-300">
							Suivez les performances et analysez les données de votre restaurant.
						</p>
					</div>
				</div>
				
				<div className="flex flex-col items-center justify-center gap-4">
					{session ? (
						<div className="text-center">
							<p className="text-2xl text-white mb-4">
								Bienvenue, {session.user?.name} !
							</p>
							<div className="flex gap-4">
								<Link
									href="/admin"
									className="rounded-full bg-indigo-600 px-6 py-3 font-semibold no-underline transition hover:bg-indigo-700"
								>
									🏪 Dashboard Admin
								</Link>
								<Link
									href="/api/auth/signout"
									className="rounded-full bg-white/10 px-6 py-3 font-semibold no-underline transition hover:bg-white/20"
								>
									Se déconnecter
								</Link>
							</div>
						</div>
					) : (
						<div className="text-center">
							<h2 className="text-2xl font-bold mb-6">Prêt à commencer ?</h2>
							<div className="flex gap-4">
								<Link
									href="/auth/signup"
									className="rounded-full bg-indigo-600 px-6 py-3 font-semibold no-underline transition hover:bg-indigo-700"
								>
									🚀 Créer un compte
								</Link>
								<Link
									href="/auth/signin"
									className="rounded-full bg-white/10 px-6 py-3 font-semibold no-underline transition hover:bg-white/20"
								>
									Se connecter
								</Link>
							</div>
						</div>
					)}
				</div>


			</div>
		</main>
	);
}
