# Configuration Base de Données pour Environnement Serverless

## Variables d'Environnement Requises

### 1. DATABASE_URL (Connection Pooling Optimisé)
```
DATABASE_URL="postgresql://username:password@host:port/database?pgbouncer=true&connection_limit=20&pool_timeout=30&connect_timeout=30"
```

### 2. DIRECT_URL (Connexion Directe)
```
DIRECT_URL="postgresql://username:password@host:port/database"
```

## Configuration Vercel

Dans le dashboard Vercel, ajouter ces variables d'environnement :

1. **DATABASE_URL** : URL avec pgbouncer et limites de connexion optimisées
2. **DIRECT_URL** : URL directe pour les migrations
3. **DATABASE_URL** doit inclure :
   - `pgbouncer=true` pour le pooling
   - `connection_limit=20` pour supporter plus de connexions simultanées
   - `pool_timeout=30` pour éviter les timeouts prématurés
   - `connect_timeout=30` pour permettre plus de temps pour établir les connexions

## Recommandations Supabase/Neon

### Supabase :
- Utiliser l'URL "Connection pooling" pour DATABASE_URL
- Utiliser l'URL "Direct connection" pour DIRECT_URL
- Configurer le pool avec les paramètres optimisés ci-dessus

### Neon :
- Activer le connection pooling dans les paramètres
- Utiliser l'endpoint poolé pour DATABASE_URL
- Augmenter les limites de connexion dans les paramètres du projet

## Configuration pour les Environnements de Test

Pour le développement local et les tests :
```
DATABASE_URL="postgresql://username:password@host:port/database?connection_limit=30&pool_timeout=60"
```

## Monitoring des Connexions

### Commandes de diagnostic :
```sql
-- Vérifier l'état des connexions PostgreSQL
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Compter les connexions par état
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- Identifier les requêtes bloquantes
SELECT * FROM pg_stat_activity WHERE wait_event_type IS NOT NULL;
```

## Test Local
```bash
npx prisma db pull
npx prisma generate
npm run dev
```

## Solutions d'Urgence

### Si les erreurs persistent :
1. **Redémarrer l'application** pour libérer les connexions bloquées
2. **Vérifier les logs de la base de données** pour identifier les goulots d'étranglement
3. **Augmenter temporairement les limites** :
   ```
   DATABASE_URL="...?connection_limit=50&pool_timeout=120"
   ```

## Monitoring
- Surveiller les logs Vercel pour les erreurs de connexion
- Vérifier les métriques de la base de données
- Ajuster les paramètres de pooling si nécessaire
- Configurer des alertes pour les erreurs de type "26000" (prepared statement) 