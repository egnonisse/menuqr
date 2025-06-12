# Guide de Résolution des Problèmes de Base de Données

## 🚨 Erreurs Critiques Identifiées

### 1. **Saturation du Pool de Connexions**

**Symptômes :**
```bash
❌ Error [PrismaClientInitializationError]: Timed out fetching a new connection from the connection pool
(Current connection pool timeout: 10, connection limit: 5)
```

**Solution Immédiate :**
```bash
# 1. Modifier la DATABASE_URL avec des limites plus élevées
DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=30&pool_timeout=60&connect_timeout=30"

# 2. Redémarrer l'application
npm run dev  # ou redémarrer sur Vercel
```

### 2. **Erreurs de Requêtes Préparées**

**Symptômes :**
```bash
❌ ConnectorError(QueryError(PostgresError {
  code: "26000",
  message: "prepared statement \"s102\" does not exist"
}))
```

**Solution :**
- Le middleware Prisma implémenté gère automatiquement ces erreurs
- En cas de persistance : `npm run db:cleanup` pour nettoyer les connexions

## 🔧 Outils de Diagnostic

### Scripts Disponibles

```bash
# Vérifier l'état de santé de la DB
npm run db:health

# Monitoring en temps réel (1 minute)
npm run db:monitor

# Nettoyer les connexions bloquées
npm run db:cleanup
```

### Requêtes SQL de Diagnostic

```sql
-- Vérifier les connexions actives
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Compter les connexions par état
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- Identifier les connexions Prisma
SELECT * FROM pg_stat_activity WHERE application_name LIKE '%prisma%';

-- Vérifier les verrous (locks)
SELECT * FROM pg_locks WHERE NOT granted;
```

## ⚡ Solutions d'Urgence

### 1. **Redémarrage Complet**

```bash
# Local
npm run db:cleanup
npm run dev

# Production (Vercel)
# Redéployer depuis le dashboard Vercel
```

### 2. **Configuration Temporaire de Crise**

Si les erreurs persistent, appliquer temporairement :

```bash
DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=50&pool_timeout=120&connect_timeout=60"
```

### 3. **Diagnostic Approfondi**

```bash
# 1. Lancer le monitoring
npm run db:monitor

# 2. Analyser le rapport généré
cat db-monitoring-report.json

# 3. Appliquer les recommandations du rapport
```

## 📊 Interprétation des Métriques

### Seuils d'Alerte

- **Latence moyenne > 1000ms** : Problème de performance
- **Taux d'échec > 10%** : Instabilité critique
- **Timeouts > 0** : Pool de connexions insuffisant
- **Erreurs prepared statement > 0** : Problème de gestion des connexions

### Actions Correctives

| Métrique | Seuil | Action |
|----------|-------|--------|
| Latence | >1s | Vérifier la performance DB |
| Timeouts | >0 | Augmenter connection_limit |
| Échecs | >10% | Redémarrer + nettoyer |
| Prepared statements | >0 | Vérifier middleware Prisma |

## 🏥 Maintenance Préventive

### Surveillance Continue

```bash
# Monitoring quotidien
npm run db:monitor

# Vérification de santé
npm run db:health
```

### Optimisations Recommandées

1. **Configuration Prisma optimisée** ✅ (implémentée)
2. **Middleware de gestion d'erreurs** ✅ (implémenté)
3. **React Query optimisé** ✅ (implémenté)
4. **Pool de connexions dimensionné** ✅ (documenté)

## 🚀 Checklist de Déploiement

Avant chaque déploiement :

- [ ] Vérifier DATABASE_URL avec limites optimisées
- [ ] Tester `npm run db:health`
- [ ] Lancer `npm run db:monitor` pendant 1 minute
- [ ] Vérifier aucune erreur critique dans les logs
- [ ] Confirmer latence < 500ms en moyenne

## 📞 Support d'Urgence

### En cas de panne critique :

1. **Diagnostic rapide :**
   ```bash
   npm run db:health
   ```

2. **Redémarrage d'urgence :**
   ```bash
   npm run db:cleanup
   ```

3. **Monitoring post-incident :**
   ```bash
   npm run db:monitor
   ```

4. **Configuration de crise :**
   - Augmenter connection_limit à 100
   - Augmenter pool_timeout à 300
   - Redéployer immédiatement

### Contacts et Ressources

- **Logs Vercel :** `https://vercel.com/[team]/[project]/functions`
- **Monitoring DB :** Selon le provider (Supabase/Neon/etc.)
- **Documentation Prisma :** `https://www.prisma.io/docs/concepts/components/prisma-client/connection-pool`

---

*Ce document est mis à jour automatiquement avec les dernières optimisations implementées.* 