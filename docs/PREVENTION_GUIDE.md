# Guide de Prévention des Erreurs - MenuQR

## 🎯 Objectif
Éviter les erreurs critiques de base de données et maintenir la stabilité du système.

## 🚨 Erreurs Critiques à Surveiller

### 1. Erreur PostgreSQL 42P05 (Prepared Statements)
**Symptôme** : `prepared statement "s0" already exists`

**Prévention** :
- ✅ Utiliser `previewFeatures = ["noPreparedStatements"]` dans schema.prisma
- ✅ Ajouter `pg_prepared_statements=false` dans DATABASE_URL
- ✅ Limiter le pool de connexions (`connection_limit=50`)

### 2. Erreur Prisma P2024 (Connection Pool Timeout)
**Symptôme** : `Timed out fetching a new connection from the connection pool`

**Prévention** :
- ✅ Configurer des timeouts appropriés (`pool_timeout=30`)
- ✅ Utiliser `withRetry()` pour les opérations critiques
- ✅ Monitorer les connexions actives

## 🛠️ Outils de Monitoring

### Health Check API
```bash
curl https://votre-app.vercel.app/api/health
```

### Métriques à surveiller
- Temps de réponse DB < 5s
- Taux d'erreur < 1%
- Connexions actives < limite du pool

## 📋 Checklist Avant Déploiement

### Base de Données
- [ ] Variables d'environnement configurées
- [ ] Pool de connexions optimisé
- [ ] Prepared statements désactivés si nécessaire
- [ ] Tests de charge passés

### Monitoring
- [ ] Health check fonctionnel
- [ ] Logs structurés activés
- [ ] Alertes configurées
- [ ] Métriques de performance trackées

### Tests
- [ ] Tests de connexion DB
- [ ] Tests de concurrence
- [ ] Tests de timeout
- [ ] Tests de récupération d'erreur

## 🔧 Configuration Recommandée

### DATABASE_URL
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?pg_prepared_statements=false&connection_limit=50&pool_timeout=30&connect_timeout=60"
```

### Prisma Schema
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  previewFeatures = ["noPreparedStatements"]
}
```

### Vercel Functions
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

## 🚀 Actions Préventives

### Quotidien
- Vérifier `/api/health`
- Surveiller les logs d'erreur
- Contrôler les métriques de performance

### Hebdomadaire
- Analyser les tendances de performance
- Réviser les alertes
- Mettre à jour les dépendances

### Mensuel
- Audit complet de sécurité
- Optimisation des requêtes
- Révision de la configuration

## 📞 Escalade des Problèmes

### Niveau 1 - Warning
- Temps de réponse > 5s
- **Action** : Surveiller de près

### Niveau 2 - Critical
- Erreurs de connexion
- **Action** : Investigation immédiate

### Niveau 3 - Emergency
- Service indisponible
- **Action** : Rollback + correction urgente

## 🔗 Ressources Utiles

- [Documentation Prisma](https://www.prisma.io/docs/)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Vercel Functions Limits](https://vercel.com/docs/functions/serverless-functions/runtimes#limits)

---
*Dernière mise à jour : $(date)* 