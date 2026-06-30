# Explication des Diagrammes UML et de leur Implémentation

Ce document regroupe les explications de **tous** les diagrammes UML (Cas d'utilisation, tous les diagrammes de Séquence, Classes, Paquetages, Déploiement) et montre comment ils se traduisent concrètement dans le code de l'application (React.js, Node.js/Express, MongoDB, FastAPI).

---

## 1. Diagramme de Cas d'Utilisation Global (Wakalati)
Ce diagramme décrit ce que les utilisateurs peuvent faire dans le système.
*   **Acteurs (Client / Administrateur) :** Gérés au niveau de la base de données via un champ `role` (ex: `client`, `admin`). Ils sont protégés par un middleware d'authentification (`authMiddleware.js`) côté backend. Côté frontend (React), l'affichage s'adapte selon le rôle.
*   **S'authentifier (`<<include>>`) :** C'est le point d'entrée obligatoire pour toutes les actions. Géré par `LoginPage.tsx` (frontend) et `authController.js` (backend).
*   **Actions Client :** Déposer une réclamation, modifier son profil, modifier une réclamation, consulter le statut. Ces actions correspondent aux pages React `Complaints.tsx` et `Profile.tsx`, reliées aux routes API `complaintRoutes.js` et `userRoutes.js`.
*   **Actions Administrateur :** Traiter les réclamations, consulter les réclamations, consulter les statistiques, gérer les utilisateurs. Gérées par `AdminUsers.tsx`, le mode admin de `Complaints.tsx`, et le `statsController.js`.

---

## 2. Diagrammes de Séquence (Comportement)
Ces diagrammes détaillent les étapes chronologiques de chaque fonctionnalité.

### 2.1. S'authentifier
1. **Demander page :** L'utilisateur ouvre la page `/login` (`LoginPage.tsx`).
2. **Saisir identifiants :** Il saisit son email et mot de passe.
3. **Vérifier informations :** Le frontend envoie un `POST /api/auth/login`. Le backend (`authController.js`) cherche l'utilisateur dans MongoDB via `UserModel` et compare le mot de passe hashé avec `bcrypt`.
4. **Résultat :** En cas de succès, le backend renvoie un token JWT, stocké côté client, et redirige l'utilisateur. En cas d'échec, le frontend affiche l'erreur *"identifiants invalides"*.

### 2.2. Déposer réclamation (Client)
1. **Saisir informations :** L'utilisateur remplit le formulaire dans `Complaints.tsx` (titre, description, etc.).
2. **Soumettre :** Le frontend appelle `POST /api/complaints`.
3. **Valider et Enregistrer :** Le `complaintController.js` valide les champs obligatoires. Si valide, l'entrée est créée dans MongoDB (`ComplaintModel`).
4. **Résultat :** Un message de succès avec le numéro de réclamation s'affiche côté React, sinon un message d'erreur *"champs obligatoires manquants"* est renvoyé.

### 2.3. Modifier profil (Client)
1. **Demander page :** L'utilisateur ouvre son profil (`Profile.tsx`). Le frontend fait un `GET /api/users/profile` pour préremplir les données actuelles.
2. **Modifier et soumettre :** L'utilisateur modifie ses champs (nom, téléphone) et valide. Le frontend lance un `PUT /api/users/profile`.
3. **Résultat :** Le contrôleur met à jour la base de données et le composant React affiche *"profil mis à jour avec succès"*.

### 2.4. Modifier réclamation (Client)
1. **Vérifier statut :** Le système vérifie que le statut est bien "Nouveau" ou "En attente". 
2. **Refus :** Si la réclamation est déjà en cours de traitement, le backend bloque l'action (`PUT`) et le frontend affiche *"Modification impossible (réclamation en cours de traitement)"*.
3. **Succès :** Si c'est "Nouveau", le formulaire s'affiche avec les données actuelles. L'utilisateur modifie, le backend valide et enregistre, puis le frontend affiche *"modification confirmée"*.

### 2.5. Consulter statut réclamation (Client)
1. **Demander statut :** L'utilisateur se rend sur sa liste de réclamations (`Complaints.tsx`).
2. **Rechercher et afficher :** Le frontend appelle `GET /api/complaints`. Si des données existent, il affiche le statut actuel et la date de modification. Si la réclamation n'a pas encore été vue/traitée, il peut afficher *"aucune réponse disponible"*.

### 2.6. Consulter réclamation (Administrateur)
1. **Demander liste :** L'admin navigue sur son espace de gestion (`Complaints.tsx`).
2. **Filtrer :** Le frontend appelle `GET /api/complaints` avec des filtres spécifiques (ex: par date ou statut).
3. **Afficher détail :** L'admin clique sur une réclamation spécifique dans le tableau pour voir les détails (description complète, pièces jointes). Si la base est vide, *"aucune réclamation trouvée"* s'affiche.

### 2.7. Traiter réclamation (Administrateur)
1. **Saisir réponse :** Depuis la vue détaillée, l'admin rédige une réponse et change le statut (ex: de "En cours" à "Traité").
2. **Enregistrer :** Le frontend envoie `PUT /api/complaints/:id`. Le backend met à jour le `ComplaintModel`.
3. **Notifier le client :** Le backend déclenche automatiquement une notification (via email avec `sendEmail.js` ou WebSockets). Le frontend admin affiche *"réclamation traitée avec succès"*.

### 2.8. Consulter statistiques (Administrateur)
1. **Demander statistiques :** L'admin va sur le tableau de bord (`Home.tsx`).
2. **Calculer :** Le frontend appelle `GET /api/stats`. Le backend (`statsController.js`) effectue des agrégations MongoDB pour compter les réclamations par statut ou par mois.
3. **Afficher graphiques :** Les données JSON retournées sont utilisées pour générer des graphiques visuels (avec une librairie comme Chart.js). Si les compteurs sont à 0, *"aucune donnée pour cette période"* s'affiche.

### 2.9. Gérer utilisateurs (Administrateur)
1. **Lister :** La page `AdminUsers.tsx` charge tous les utilisateurs via `GET /api/users`.
2. **Créer :** Saisie des informations, `POST /api/users`, création du compte en BD, affichage *"utilisateur créé avec succès"*.
3. **Modifier :** Sélection d'un utilisateur, modification de ses droits, `PUT /api/users/:id`.
4. **Désactiver :** Demande de désactivation, le backend passe le champ actif à false, et le système affiche *"utilisateur désactivé avec succès"*.

---

## 3. Diagrammes Structuraux et Architecturaux

### 3.1. Diagramme de Classes (Modélisation des données)
Ce diagramme correspond aux modèles de la base de données Mongoose (`backend/models/`).
*   **Utilisateurs (Client, Admin) :** Implémenté par le fichier `UserModel.js`. L'héritage Client/Admin est géré par l'attribut `role` (ex: `role: 'admin'`). La classe "Authentification" correspond aux fonctions internes du modèle (comme `user.matchPassword()`).
*   **Réclamation :** Implémenté par `ComplaintModel.js`. Il contient les champs `description`, `statut`, `dateCreation`, et une clé étrangère (ObjectId) liant la réclamation à l'utilisateur qui l'a créée.
*   **Pièce justificative :** Souvent un sous-document à l'intérieur du `ComplaintModel` (ex: un tableau `attachments`).
*   **Notification :** Implémenté soit par un `NotificationModel.js`, soit géré de manière transitoire lors du changement de statut (via email ou WebSocket).

### 3.2. Diagramme de Paquetages (Architecture N-Tiers)
Il montre l'organisation des différents modules du code :
*   **Interface :** Dossier `frontend/src/` (contenant `LoginForm`, `ProfileInterface`, `ComplaintForm`, etc. traduits en composants React).
*   **Controller :** Dossier `backend/controllers/` (ex: `authController.js`, `complaintController.js`) qui reçoit les requêtes du frontend et contient la logique.
*   **Service & Repository :** Dans Node.js, ces couches sont généralement fusionnées avec le Controller. Le Controller interroge directement les Modèles Mongoose (le Repository) pour lire/écrire en base.
*   **Model :** Dossier `backend/models/` (les schémas de données).
*   **Config :** Dossiers `config/`, middlewares, et fichiers `.env` gérant la sécurité et la connexion aux bases.

### 3.3. Diagramme de Déploiement (Infrastructure physique)
Il indique comment les différents serveurs communiquent :
*   **Client Tier :** L'application React compilée, exécutée localement sur le navigateur Web du client.
*   **Server Tier :** Il est composé de deux briques dans votre architecture :
    *   **API Express.js (Port 5000) :** C'est l'API backend principale développée en Node.js, qui traite le routage et la gestion des utilisateurs/réclamations.
    *   **Micro-service FastAPI (Port 8000) :** C'est le service secondaire codé en Python (`ai_service/app.py`), utilisé spécifiquement pour des tâches d'Intelligence Artificielle.
*   **Database Tier :** Le serveur MongoDB (Port 27017) stockant la data persistante.
*   **Cloud (HuggingFace Hub) :** Votre API Python FastAPI se connecte au cloud HuggingFace pour télécharger et exploiter le modèle de machine learning `CamemBERT` (SBERT) afin d'analyser le texte des réclamations.
