# Décisions techniques et interprétations

Ce document recense les choix réalisés là où la spécification laissait une marge d'interprétation, ainsi que les écarts assumés. Chaque décision privilégie la solution la plus simple, cohérente avec les règles `RG-01` à `RG-14` et avec le périmètre fonctionnel.

## 1. Versions et outillage

| Élément | Choix | Raison |
| --- | --- | --- |
| Java | 21 | Exigé par la spécification |
| Spring Boot | 3.5.x | Dernière branche compatible Java 21 |
| Angular | 22.x | « Angular latest » au moment du développement |
| PostgreSQL | 16 | Exigé |
| JWT | JJWT 0.12.6 | API moderne, support HS512 |
| OpenAPI | springdoc 2.8.x | Swagger UI compatible Spring Boot 3.5 |
| Build backend | Maven | Exigé |
| Tests | JUnit 5, Mockito, Testcontainers | Exigé, pas de H2 |

## 2. Architecture et conventions

- **Architecture en couches** : `controller → service → repository`. Les contrôleurs ne contiennent pas de logique métier ; les entités JPA ne sont jamais exposées.
- **DTO en `record`** : immuables, explicites, sans setters. Les conversions sont centralisées dans des fabriques `from(...)`.
- **Nommage** : le domaine et les messages utilisateur sont en français ; le code technique (classes, méthodes, colonnes de jointure, logs) reste en anglais ou en français technique cohérent avec le reste du projet.
- **Montants** : `BigDecimal` partout, `NUMERIC(18,0)` en base, arrondi `HALF_UP` à l'unité FCFA. Aucun `double` pour les montants.
- **Dates** : dates métier en `LocalDate` (UTC), horodatages en `Instant`/`TIMESTAMPTZ` avec `hibernate.jdbc.time_zone=UTC`.

## 3. Filtrage par agence et rôles

- `ADMIN` et `DIRECTEUR` sont des **rôles globaux** : ils peuvent lire le consolidé ou filtrer sur une agence via `agenceId`.
- Les autres rôles (`AGENT_CREDIT`, `CAISSIER`, `COMPTABLE`) sont **contraints à l'agence du JWT**. Le paramètre `agenceId` éventuel est ignoré pour les lectures et rejeté/écrasé pour les écritures.
- Une ressource appartenant à une autre agence renvoie **404** (`RESSOURCE_INTROUVABLE`) plutôt que 403 : cela évite de divulguer l'existence d'un client, d'un compte ou d'un crédit. La spécification accepte 403 ou 404.
- Les routes de **lecture des référentiels** (`/agences`, `/produits-credit`, `/comptabilite/comptes`) sont accessibles à tout utilisateur authentifié, alors que la spécification réserve le CRUD à `ADMIN`. Raison : les écrans Angular ont besoin de ces listes pour les menus, filtres et formulaires. Les opérations d'écriture restent strictement réservées à `ADMIN` (ou aux rôles indiqués pour la comptabilité). Le CRUD `/utilisateurs` reste entièrement réservé à `ADMIN`, conformément à la spécification.
- La liste et le détail des crédits (`GET /credits`, `GET /credits/{id}`) sont ouverts à tout utilisateur authentifié, avec filtrage d'agence. La spécification ouvre déjà l'échéancier à « tous » ; cette ouverture est nécessaire au menu Crédits partagé.

## 4. Crédit

### 4.1 Frais de dossier

Les frais sont calculés **au moment du décaissement** à partir du `fraisDossierPct` courant du produit. Il n'existe pas de colonne de snapshot dans le modèle imposé. Conséquence assumée : si le taux de frais du produit change entre la demande et le décaissement, le montant appliqué est le taux courant. Le taux d'intérêt, lui, est bien copié sur le crédit à la demande (`RG-08`).

### 4.2 Limite de crédits en cours

La spécification mentionne une limite mais ne fournit pas de paramètre. La valeur par défaut est **2 crédits `DECAISSE` simultanés par client**, configurable via `sfd.credit.max-credits-decaisse`. Le contrôle s'applique à la création de la demande.

### 4.3 Séparation des tâches

L'agent qui a créé la demande ne peut pas l'approuver, y compris s'il est `ADMIN` ou `DIRECTEUR`. Le contrôle est fait sur l'identifiant de l'agent enregistré sur le crédit.

### 4.4 Imputation des remboursements

Les échéances sont traitées de la plus ancienne à la plus récente. Pour chaque échéance, les **intérêts sont payés avant le capital**. Ce choix est cohérent avec la pratique bancaire et avec le test unitaire d'imputation partielle sur trois échéances. Un remboursement partiel laisse l'échéance en `PARTIEL`.

### 4.5 Statut du crédit

Le statut reste `DECAISSE` tant que toutes les échéances ne sont pas soldées, puis passe à `SOLDE`. Aucun statut `IMPAYE` n'est introduit, conformément au modèle fourni.

## 5. Comptabilité et extourne

- Le service comptable vérifie l'équilibre **avant** toute insertion. Une écriture déséquilibrée lève `ECRITURE_DESEQUILIBREE` et provoque le rollback complet de l'opération (`RG-12`, `RG-13`).
- Les écritures et leurs lignes sont immuables. Des triggers PostgreSQL rejettent `UPDATE` et `DELETE` sur `ligne_ecriture`.
- L'extourne génère une **nouvelle écriture inverse** avec `extourne_de` renseigné. Elle ne modifie pas l'écriture d'origine.
- Une écriture ne peut être extournée qu'une seule fois (`existsByExtourneDeId`).
- Une extourne ne peut pas être elle-même extournée : le service vérifie que l'écriture cible n'a pas déjà `extourne_de`.
- **L'extourne corrige uniquement la comptabilité.** Elle ne réécrit ni le solde du compte d'épargne, ni l'opération d'origine, ni l'échéancier. La spécification ne demande pas de logique de compensation des soldes, et une telle logique serait ambiguë pour les crédits déjà remboursés.
- La date comptable de l'extourne est la **date du jour**, et non la date de l'écriture d'origine.

## 6. Épargne et opérations

- Un compte doit être `ACTIF` pour un dépôt, un retrait, un décaissement ou un remboursement.
- Le solde est chargé avec un verrou pessimiste (`PESSIMISTIC_WRITE`) avant toute modification.
- Les montants sont strictement positifs et entiers (`@Digits(integer = 15, fraction = 0)`).
- Aucun endpoint de clôture ou de blocage de compte n'est exposé : les statuts `BLOQUE` et `CLOTURE` existent dans le modèle mais leur gestion administrative est hors périmètre.
- Les frais d'épargne et les intérêts créditeurs sont hors périmètre, donc aucune écriture `CHARGE`/`PRODUIT` d'épargne n'est générée.

## 7. Numérotation et séquences

Les séquences sont créées dans `V2__immutabilite_index.sql` :

| Objet | Format | Exemple |
| --- | --- | --- |
| Client | `CL-{codeAgence}-{6 chiffres}` | `CL-AG001-000001` |
| Compte d'épargne | `EP-{codeAgence}-{6 chiffres}` | `EP-AG001-000001` |
| Crédit | `CR-{codeAgence}-{6 chiffres}` | `CR-AG001-000001` |
| Opération | `OP-{YYYYMMDD}-{6 chiffres}` | `OP-20261022-000001` |

Les séquences PostgreSQL sont globales, pas par agence ; le code agence fait partie de la référence. Cela garantit l'unicité sans table de compteurs supplémentaire.

## 8. Sécurité et session

- Access token 15 minutes, refresh token 7 jours, claims `sub`, `role`, `agenceId`, `doitChangerMotDePasse`, `type`.
- BCrypt avec le `PasswordEncoder` de Spring Security.
- **Création d'utilisateur** : l'administrateur ne fournit jamais de mot de passe. Le backend génère un mot de passe temporaire de 14 caractères (`SecureRandom`, minuscule, majuscule, chiffre et caractère spécial), stocke uniquement son hash BCrypt et marque le compte `doitChangerMotDePasse=true`. Le mot de passe en clair n'est jamais renvoyé par l'API.
- **Envoi de l'e-mail** : Spring Mail est utilisé avec un serveur SMTP configurable. Mailpit sert de boîte de test dans Docker Compose. En l'absence de SMTP, `MAIL_MODE=journal` écrit le message dans les logs du backend : ce mode est réservé au développement.
- Si l'envoi SMTP échoue en mode `smtp`, la création du compte est annulée (rollback) afin de ne pas laisser un compte sans mot de passe communiqué.
- **Premier login** : le JWT porte le flag `doitChangerMotDePasse`. Un filtre serveur bloque tous les appels API autres que le changement de mot de passe et le rafraîchissement. Côté Angular, un guard redirige vers `/mot-de-passe`. Le changement exige le mot de passe temporaire actuel, puis renvoie immédiatement de nouveaux jetons avec le flag à `false`.
- **Changement volontaire** : après le premier login, chaque utilisateur peut modifier son mot de passe depuis `/mon-compte`. L'écran réutilise `POST /api/auth/mot-de-passe` avec vérification du mot de passe actuel et renvoie de nouveaux jetons ; aucun endpoint de profil séparé n'est nécessaire, les informations affichées provenant du signal de session.
- Le refresh est **stateless** : un refresh valide émet un nouveau couple de jetons. Il n'y a ni rotation obligatoire, ni liste de révocation, ni stockage serveur. La déconnexion supprime les jetons du `localStorage`.
- Les jetons sont stockés dans `localStorage` pour simplifier la démo. En production, un stockage en cookie `HttpOnly`/`Secure` serait préférable ; ce choix est documenté comme limite.
- CORS autorise `http://localhost:4200`, `http://127.0.0.1:4200`, `http://localhost:8081` et `http://127.0.0.1:8081`. Les origines sont volontairement limitées au développement local ; un déploiement sur un domaine doit les adapter.
- Les erreurs d'authentification et d'autorisation sont écrites manuellement en `ProblemDetail` pour conserver un `code` stable (`NON_AUTHENTIFIE`, `ACCES_REFUSE`).

## 9. Erreurs

- Format RFC 7807 via `ProblemDetail`.
- Codes métier stables et explicites : `SOLDE_INSUFFISANT`, `SURPAIEMENT`, `CREDIT_NON_DECAISSE`, `TRANSITION_INTERDITE`, `AUTO_APPROBATION_INTERDITE`, `ECRITURE_DESEQUILIBREE`, etc.
- Les erreurs de validation renvoient `VALIDATION_ECHEC` avec le détail des champs.
- Les erreurs inattendues renvoient `ERREUR_INTERNE` sans exposer la stack trace (`server.error.include-message=never`).

## 10. Frontend

- Composants **standalone**, Signals pour l'état local, `ReactiveFormsModule` pour les formulaires.
- Routes **lazy-loaded** par écran.
- Interceptor JWT : ajout du Bearer, tentative de refresh sur 401, rejeu unique de la requête, purge de session en cas d'échec.
- Guards : `authGuard` pour l'espace authentifié, `roleGuard` pour les routes sensibles.
- Menu filtré par rôle ; les routes non autorisées ne sont pas affichées.
- Pipe `fcfa` dédié, séparateur de milliers français.
- Les exports CSV (balance, grand livre) sont générés **côté navigateur** à partir des données déjà chargées. Aucun endpoint d'export n'est ajouté.
- Le formulaire d'administration permet le CRUD des agences, utilisateurs, produits et comptes comptables. La suppression d'un utilisateur correspond à une **désactivation** côté backend ; le libellé de l'interface l'indique.
- L'interface n'affiche pas les actions non autorisées pour le rôle courant, mais la sécurité réelle reste côté backend.
- Les graphiques du tableau de bord sont dessinés en SVG/CSS natif, sans dépendance externe (pas de Chart.js/ECharts). Cela garde le bundle léger et évite une bibliothèque supplémentaire à maintenir.
- Le tableau de bord charge ses agrégats en une seule requête API ; les séries mensuelles sont complétées à zéro pour les mois sans opération.
- Le shell est responsive via `BreakpointObserver` : barre latérale en mode `over` sous 900 px, fermeture après navigation. Les tableaux défilent horizontalement dans un conteneur `.table-scroll` plutôt que de casser la mise en page.

## 11. Base de données et tests

- `ddl-auto=validate` : le schéma est la propriété de Flyway, jamais d'Hibernate.
- `client.sexe` et `ligne_ecriture.sens` sont des `CHAR(1)`. Hibernate 6 les mappe par défaut en `VARCHAR`, ce qui ferait échouer la validation ; l'annotation `@JdbcTypeCode(SqlTypes.CHAR)` aligne le mapping sur le schéma.
- Les tests d'intégration utilisent **Testcontainers PostgreSQL**, jamais H2.
- L'annotation `@Testcontainers(disabledWithoutDocker = true)` permet aux tests unitaires de tourner sur une machine sans Docker ; les tests d'intégration sont alors ignorés. Dans un environnement avec Docker, ils s'exécutent normalement.
- Les données de démonstration sont dans `V3__seed.sql`. Le mot de passe BCrypt commun est `Sfd@2026!`.
- `V4__mot_de_passe_premier_login.sql` ajoute `doit_changer_mot_de_passe BOOLEAN NOT NULL DEFAULT FALSE` ; les comptes existants restent donc inchangés, tandis que toute création via l'API active le flag.
- `V3` crée cinq utilisateurs (un par rôle), deux agences, cinq comptes comptables et trois produits. Les clients et comptes de démonstration ne sont pas seedés : ils sont créés via l'interface ou `docs/demo.http`.

## 12. Recherche client

La recherche accepte `q` vide. Le service normalise `null` en chaîne vide et la requête utilise `:q = ''` plutôt que `:q is null`. Cela évite l'erreur PostgreSQL `lower(bytea)` provoquée par l'inférence de type d'un paramètre nul dans `lower(concat('%', :q, '%'))`, tout en conservant le comportement « aucun filtre » pour une recherche vide.

## 13. Pagination

- Paramètres standard Spring : `page`, `size`, `sort`.
- Réponse : `{contenu, page, taille, total}`.
- Le frontend envoie `size` au backend et lit `taille` dans la réponse ; le relevé d'épargne utilise les paramètres `page` et `taille` attendus par son endpoint spécifique.
- Taille maximale configurée : 100.

## 14. Hors périmètre confirmé

Ne sont pas implémentés, conformément à la spécification :

- mobile money et intégrations externes ;
- frais et intérêts sur l'épargne ;
- clôture annuelle et opérations de fin d'exercice ;
- rapports réglementaires BCEAO ;
- groupes solidaires ;
- import/export de masse (les exports CSV de consultation restent disponibles) ;
- gestion des garanties, des cautions et des contentieux.
