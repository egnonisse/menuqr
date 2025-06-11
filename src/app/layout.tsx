import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { TRPCReactProvider } from "@/trpc/react";
import { SessionProviderWrapper } from "@/components/providers/session-provider";
import { auth } from "@/server/auth";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
	title: "MenuQR - Menus digitaux pour restaurants",
	description: "Application de menus digitaux avec QR codes pour restaurants",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth();

	return (
		<html lang="fr" className={`${geist.variable}`}>
			<body>
				<SessionProviderWrapper session={session}>
					<TRPCReactProvider>{children}</TRPCReactProvider>
				</SessionProviderWrapper>
				<Toaster />
				<Analytics />
			</body>
		</html>
	);
}
