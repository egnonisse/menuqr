# 🧪 Plan de Test - MenuQR Demo

## **Tests à effectuer avant push Git**

### **📋 Checklist de Tests**

#### **1. Test de Démarrage (CRITIQUE)**
- [ ] **App démarre** : `npm run dev` sans erreurs
- [ ] **Page d'accueil** : `http://localhost:3000` → OK
- [ ] **Pas d'erreurs console** dans les dev tools

#### **2. Test Page Démo (NOUVEAU)**
- [ ] **Page démo accessible** : `http://localhost:3000/demo`
- [ ] **Statistiques affichées** : 2 restaurants, X plats, Y tables, Z avis
- [ ] **Restaurants listés** : Le Bistrot Parisien + Pizza Roma
- [ ] **Comptes de démo affichés** : demo@menuqr.fr + test@menuqr.fr
- [ ] **Boutons fonctionnels** : "Voir le menu", "Simuler scan QR"

#### **3. Test Restaurants de Démo (CRITIQUE)**
- [ ] **Bistrot Parisien** : `http://localhost:3000/bistrot-parisien-demo`
  - Menu affiché avec catégories (Entrées, Plats, Desserts)
  - Prix affichés correctement
  - Responsive mobile
  - Avis clients visibles
  
- [ ] **Pizza Roma** : `http://localhost:3000/pizza-roma-demo`  
  - Menu affiché avec catégories (Pizzas, Pâtes)
  - Prix affichés correctement
  - Responsive mobile
  - Avis clients visibles

#### **4. Test Connexion Admin (CRITIQUE)**
- [ ] **Page de connexion** : `http://localhost:3000/auth/signin`
- [ ] **Login démo 1** : demo@menuqr.fr / demo123
  - Redirection vers dashboard
  - Restaurant "Le Bistrot Parisien" visible
  - Menu éditable
  - Tables avec QR codes générés
  
- [ ] **Login démo 2** : test@menuqr.fr / test123
  - Redirection vers dashboard  
  - Restaurant "Pizza Roma" visible
  - Menu éditable
  - Tables avec QR codes générés

#### **5. Test API Demo (TECHNIQUE)**
- [ ] **Endpoints fonctionnels** (via page démo) :
  - Statistiques chargées
  - Liste des restaurants
  - Comptes de démo
  - Simulation QR scan

#### **6. Test Mobile (UX)**
- [ ] **Responsive design** :
  - Page démo sur mobile
  - Menus restaurants sur mobile
  - Navigation fluide
  - Boutons accessibles

### **⚠️ Erreurs Critiques à Vérifier**

#### **Erreurs qui bloquent le push :**
- **404 sur pages de démo** → STOP
- **Erreurs de compilation** → STOP  
- **Connexion admin impossible** → STOP
- **Données de démo manquantes** → STOP

#### **Erreurs acceptables :**
- **Warnings TypeScript mineurs** → OK
- **Erreurs de style CSS** → OK si fonctionnel
- **Tests unitaires échoués** → OK pour demo

### **🎯 Validation Rapide (5 minutes)**

**Test Minimal avant Push :**

1. ✅ `http://localhost:3000/demo` → Page charge
2. ✅ `http://localhost:3000/bistrot-parisien-demo` → Menu visible  
3. ✅ `http://localhost:3000/auth/signin` → Login possible avec demo@menuqr.fr
4. ✅ Dashboard admin accessible après login

**Si ces 4 points passent → PUSH OK ✅**

### **🔧 Réparations Rapides**

#### **Si page démo plante :**
```bash
npm run demo:reset
```

#### **Si login impossible :**
```bash
npm run demo:create
```

#### **Si serveur plante :**
```bash
rm -rf .next
npm run dev
```

### **📝 Rapport de Test**

**Date :** _________________  
**Testeur :** _________________

**Résultat des tests :**
- [ ] ✅ Tous les tests passent → **PUSH AUTORISÉ**
- [ ] ⚠️ Tests partiels → **CORRECTIONS NÉCESSAIRES**  
- [ ] ❌ Tests échoués → **PUSH BLOQUÉ**

**Commentaires :**
_________________________________
_________________________________
_________________________________

---

## **🚀 Commandes Post-Test**

Si tous les tests passent :

```bash
# Stagé les changements
git add .

# Commit avec message descriptif
git commit -m "feat: Add complete demo system for client presentations

- Add demo page at /demo with statistics and demo accounts
- Create 2 demo restaurants with realistic data (Bistrot Parisien, Pizza Roma)
- Add demo API router with simulation capabilities
- Include comprehensive demo guide and test plan
- Enable QR code simulation for presentations"

# Push vers GitHub
git push origin main
```

**Le système de démo est prêt pour les présentations clients ! 🎉** 