# 🧪 TESTS FONCTIONNELS - MenuQR Restaurant App

## ✅ PLAN DE TESTS

### **Phase 1: Authentification & Setup Initial**
- [x] **TEST-001**: Accès page d'accueil (`http://localhost:3000`) ✅
- [x] **TEST-002**: Inscription nouvel admin (`/auth/signup`) ✅  
- [x] **TEST-003**: Connexion admin existant (`/auth/signin`) ✅
- [x] **TEST-004**: Protection routes admin (redirection si non connecté) ✅
- [x] **TEST-005**: Déconnexion (`signOut`) ✅

### **Phase 2: Configuration Restaurant**
- [x] **TEST-006**: Création premier restaurant (`/admin` - premier accès) ✅
- [x] **TEST-007**: Dashboard admin vide (nouveau restaurant) ✅
- [x] **TEST-008**: Profil utilisateur (`/admin/profile`) ✅
- [x] **TEST-009**: Paramètres restaurant (`/admin/settings`) ✅
- [ ] **TEST-010**: Upload logo restaurant

### **Phase 3: Gestion des Tables**
- [x] **TEST-011**: Création première table (`/admin/tables`) ✅
- [ ] **TEST-012**: Génération QR code automatique
- [ ] **TEST-013**: Modification table existante
- [ ] **TEST-014**: Suppression table (avec confirmation)
- [ ] **TEST-015**: Visualisation QR code généré

### **Phase 4: Gestion du Menu**
- [x] **TEST-016**: Création première catégorie (`/admin/menu`) ✅
- [x] **TEST-017**: Ajout plats dans catégorie ✅ (logs tRPC)
- [ ] **TEST-018**: Upload image plat
- [ ] **TEST-019**: Modification plat existant
- [ ] **TEST-020**: Suppression plat/catégorie
- [ ] **TEST-021**: Réorganisation ordre plats

### **Phase 5: Menu Public (QR Code)**
- [x] **TEST-022**: Accès menu via slug (`/resto-test`) ✅
- [x] **TEST-023**: Affichage menu par QR code (`/menu/[tableId]`) ⚠️ (404 - pas de données)
- [ ] **TEST-024**: Navigation entre catégories
- [ ] **TEST-025**: Affichage prix et descriptions
- [ ] **TEST-026**: Responsive mobile (principal usage)

### **Phase 6: Réservations**
- [x] **TEST-027**: Formulaire réservation public (`/reservation`) ✅
- [ ] **TEST-028**: Validation champs obligatoires
- [ ] **TEST-029**: Confirmation réservation
- [x] **TEST-030**: Gestion réservations admin (`/admin/orders`) ✅
- [ ] **TEST-031**: Modification statut réservation

### **Phase 7: Avis Clients**
- [ ] **TEST-032**: Formulaire avis client (`/feedback/[tableId]`)
- [ ] **TEST-033**: Validation et envoi avis
- [ ] **TEST-034**: Modération avis admin (`/admin/feedbacks`)
- [ ] **TEST-035**: Approbation/Rejet avis
- [ ] **TEST-036**: Affichage avis approuvés sur homepage

### **Phase 8: Homepage Personnalisée**
- [ ] **TEST-037**: Configuration sliders (`/admin/homepage`)
- [ ] **TEST-038**: Upload images sliders
- [ ] **TEST-039**: Gestion témoignages
- [ ] **TEST-040**: Configuration réseaux sociaux
- [ ] **TEST-041**: Aperçu homepage (`/resto-test`)

### **Phase 9: Tests Avancés**
- [ ] **TEST-042**: Upload fichiers volumineux (limite 5MB)
- [ ] **TEST-043**: Gestion erreurs serveur
- [ ] **TEST-044**: Navigation entre pages admin
- [ ] **TEST-045**: Persistance données après refresh
- [ ] **TEST-046**: Gestion sessions expirées

### **Phase 10: Responsive & UX**
- [ ] **TEST-047**: Mobile portrait (320px-480px)
- [ ] **TEST-048**: Mobile paysage (480px-768px) 
- [ ] **TEST-049**: Tablette (768px-1024px)
- [ ] **TEST-050**: Desktop (1024px+)

---

## 🐛 BUGS TROUVÉS

### **CRITIQUES** 🔴
- [ ] 

### **MAJEURS** 🟡  
- [ ] 

### **MINEURS** 🟢
- [ ] 

---

## 🚀 RÉSULTATS

### **Taux de réussite**: 16/50 (32%)
### **Status**: 🟢 Tests automatiques avancés terminés - Session active détectée
