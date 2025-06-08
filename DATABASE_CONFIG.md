# Configuration Base de Données pour Environnement Serverless

## Variables d'Environnement Requises

### 1. DATABASE_URL (Connection Pooling)
```
DATABASE_URL="postgresql://username:password@host:port/database?pgbouncer=true&connection_limit=1&pool_timeout=0"
```

### 2. DIRECT_URL (Connexion Directe)
```
DIRECT_URL="postgresql://username:password@host:port/database"
```

## Configuration Vercel

Dans le dashboard Vercel, ajouter ces variables d'environnement :

1. **DATABASE_URL** : URL avec pgbouncer et limites de connexion
2. **DIRECT_URL** : URL directe pour les migrations
3. **DATABASE_URL** doit inclure :
   - `pgbouncer=true` pour le pooling
   - `connection_limit=1` pour limiter les connexions par instance serverless
   - `pool_timeout=0` pour éviter les timeouts

## Recommandations Supabase/Neon

### Supabase :
- Utiliser l'URL "Connection pooling" pour DATABASE_URL
- Utiliser l'URL "Direct connection" pour DIRECT_URL

### Neon :
- Activer le connection pooling dans les paramètres
- Utiliser l'endpoint poolé pour DATABASE_URL

## Test Local
```bash
npx prisma db pull
npx prisma generate
npm run dev
```

## Monitoring
- Surveiller les logs Vercel pour les erreurs de connexion
- Vérifier les métriques de la base de données
- Ajuster les paramètres de pooling si nécessaire 