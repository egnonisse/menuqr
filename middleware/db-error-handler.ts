import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  try {
    return NextResponse.next()
  } catch (error: any) {
    // Gestion spécifique des erreurs PostgreSQL
    if (error.code === '42P05') {
      console.error('Erreur de prepared statement:', error)
      // Nettoyage de la session si nécessaire
      return NextResponse.json(
        { error: 'Erreur de connexion à la base de données' },
        { status: 503 }
      )
    }

    // Gestion des erreurs de timeout Prisma
    if (error.code === 'P2024') {
      console.error('Timeout du pool de connexions:', error)
      return NextResponse.json(
        { error: 'Service temporairement indisponible, veuillez réessayer' },
        { status: 503 }
      )
    }

    // Autres erreurs Prisma
    if (error.code?.startsWith('P')) {
      console.error('Erreur Prisma:', error.code, error.message)
      return NextResponse.json(
        { error: 'Erreur de base de données' },
        { status: 500 }
      )
    }

    // Autres erreurs de base de données PostgreSQL
    if (error.code?.startsWith('42')) {
      console.error('Erreur PostgreSQL:', error)
      return NextResponse.json(
        { error: 'Erreur de base de données' },
        { status: 500 }
      )
    }

    // Erreurs non gérées
    console.error('Erreur non gérée:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export const config = {
  matcher: '/api/:path*',
} 