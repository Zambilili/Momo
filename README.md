# Momo Tech : site vitrine

> « Votre technologie, notre expertise. »
> Réparation, maintenance et assistance informatique au Bénin.

Site statique en **HTML5 + CSS3 + JavaScript moderne + Three.js (WebGL)**.
Aucun framework, aucune étape de compilation, aucun serveur applicatif.

---

## 1. Lancer le site en local

Les modules JavaScript (3D) exigent d'ouvrir le site via un petit serveur web
(un double-clic sur `index.html` affiche le site mais **sans la 3D** : l'illustration de secours s'affiche).

Avec Python (déjà installé sur la plupart des ordinateurs) :

```bash
cd momo-tech
python -m http.server 8000
```

Puis ouvrez <http://localhost:8000>.

Alternatives : `npx serve .` (Node.js) ou l'extension « Live Server » de VS Code.

---

## 2. Publier sur GitHub

```bash
cd momo-tech
git init
git add .
git commit -m "Site vitrine Momo Tech"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/momo-tech.git
git push -u origin main
```

(Créez d'abord le dépôt vide `momo-tech` sur github.com.)

## 3a. Déployer sur GitHub Pages (gratuit)

1. Sur GitHub : **Settings → Pages**.
2. *Source* : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Enregistrez. Le site sera disponible à `https://VOTRE-COMPTE.github.io/momo-tech/` après 1 à 2 minutes.

Le fichier `.nojekyll` est déjà présent et `404.html` sert de page d'erreur.

## 3b. Déployer sur Render (gratuit)

1. Sur <https://render.com> : **New → Static Site**, connectez le dépôt GitHub.
2. *Build Command* : laisser vide. *Publish Directory* : `.`
3. Créez le service. Le fichier `render.yaml` (Blueprint) contient déjà cette configuration
   et quelques en-têtes de sécurité.

---

## 4. Fichiers et rôle

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique : navigation, hero 3D, services, pourquoi nous choisir, méthode, à propos, FAQ, contact, pied de page. SEO, données structurées (LocalBusiness), sprite d'icônes SVG. |
| `css/style.css` | Tout le design : palette, typographie, cartes, effets lumineux, responsive, `prefers-reduced-motion`. |
| `js/main.js` | Script principal (sans dépendance) : en-tête compact, menu mobile, apparitions au défilement, progression de la méthode, formulaire → WhatsApp, chargement différé de la 3D, détection WebGL. |
| `js/animations3d.js` | Scène 3D principale : portable dont l'écran s'ouvre et lance un diagnostic animé, carte mère, circuits lumineux, processeur, mémoire, SSD, particules, interactions souris/glisser/défilement, adaptation de la qualité. |
| `js/services3d.js` | Les 7 illustrations 3D des services, rendues par un seul contexte WebGL partagé, chargées seulement à l'approche de la section. |
| `js/scene-kit.js` | Briques 3D communes : matériaux, éclairage, portable, engrenage, bouclier, détection des capacités de l'appareil. |
| `js/vendor/three.module.min.js`, `three.core.min.js` | Three.js r185 hébergé localement (aucun CDN). |
| `js/vendor/addons/` | `RoomEnvironment.js` (reflets) et `RoundedBoxGeometry.js` (formes arrondies), issus de Three.js. |
| `js/vendor/LICENSE-three.txt` | Licence MIT de Three.js. |
| `assets/images/hero-fallback.svg` | Illustration affichée si WebGL est indisponible (ou pendant le chargement). |
| `assets/images/favicon.svg`, `apple-touch-icon.png` | Icônes du site. |
| `assets/images/og-image.jpg` | Image d'aperçu pour le partage sur les réseaux / WhatsApp. |
| `assets/models/README.md` | Note : tous les modèles 3D sont procéduraux (aucune licence tierce). |
| `mentions-legales.html`, `confidentialite.html` | Pages légales. |
| `404.html` | Page d'erreur. |
| `site.webmanifest`, `robots.txt` | Métadonnées pour navigateurs et moteurs de recherche. |
| `render.yaml`, `.nojekyll` | Configuration de déploiement Render / GitHub Pages. |

## 5. Ressources et licences

- **Three.js** r185 : licence MIT (`js/vendor/LICENSE-three.txt`).
- **Modèles 3D** : créés par code pour ce projet, aucune ressource externe.
- **Polices** : Work Sans, IBM Plex Sans, IBM Plex Mono via Google Fonts (licence SIL Open Font License).
- **Icônes** : SVG dessinés pour ce projet.

## 6. WhatsApp

Numéro : **+229 01 97 65 07 41** → lien `https://wa.me/2290197650741` (sans « + », sans espaces).

Pour changer le numéro : remplacez `2290197650741` dans `index.html`, `mentions-legales.html`,
`confidentialite.html`, `404.html` et la constante `WA_NUMBER` en haut de `js/main.js`.

Messages préremplis (encodés avec `encodeURIComponent`) :

| Bouton | Message |
|---|---|
| Demander une intervention (menu) | Bonjour Momo Tech, je souhaite demander une intervention sur mon appareil. Voici le problème rencontré : |
| Demander un dépannage / Réparation | Bonjour Momo Tech, je souhaite demander une réparation informatique. Voici le problème rencontré : |
| Installation de systèmes | Bonjour Momo Tech, je souhaite obtenir des informations sur l'installation ou la réinstallation d'un système. |
| Maintenance | Bonjour Momo Tech, je souhaite faire entretenir ou optimiser mon ordinateur. |
| Logiciels et pilotes | Bonjour Momo Tech, je souhaite faire installer ou configurer un logiciel, un pilote ou un périphérique. |
| Sécurité | Bonjour Momo Tech, j'ai besoin d'aide pour la sécurité de mon ordinateur (logiciels malveillants, protection). |
| Données | Bonjour Momo Tech, j'ai besoin d'aide pour sauvegarder ou récupérer des données. |
| Diagnostic / Assistance | Bonjour Momo Tech, j'aimerais obtenir un diagnostic pour mon appareil. |
| Contact général, bouton flottant, pied de page | Bonjour Momo Tech, je souhaite obtenir des renseignements sur vos services. |

**Formulaire de contact** : il valide les champs puis ouvre WhatsApp avec un message
contenant nom, appareil, service et description. Aucune donnée n'est stockée ni envoyée à un serveur ;
le client envoie lui-même le message. Il n'y a donc aucune clé secrète dans le code.

## 7. Performance et compatibilité

- Qualité 3D adaptée à l'appareil (3 niveaux : résolution, nombre de particules, reflets),
  et baisse automatique si l'appareil n'atteint pas ~34 images/s.
- Animation en pause quand la scène n'est pas visible ou que l'onglet est caché.
- Illustrations des services chargées seulement à l'approche de la section, ~30 images/s,
  et fixes (animées au survol) sur appareils modestes.
- `prefers-reduced-motion` : scène 3D figée (rotation au glisser seulement), apparitions désactivées.
- Sans WebGL, sans support des import maps ou en cas de perte du contexte : illustration SVG de secours.
- Aucun fichier vidéo ni modèle lourd. Poids total ≈ 0,9 Mo (dont Three.js ≈ 750 Ko, mis en cache).

## 8. Tests effectués

- Affichage de toutes les sections sur écran de bureau (1536 × 864) et smartphone (390 × 844).
- Scène 3D principale et 7 illustrations 3D rendues sans erreur JavaScript (Chromium).
- Mode `prefers-reduced-motion` : contenu visible immédiatement, scène 3D statique.
- Menu hamburger : ouverture, fermeture (bouton, lien, touche Échap).
- Aucun débordement horizontal sur mobile (largeur de page = largeur d'écran).
- Formulaire : 4 erreurs affichées si vide ; une fois rempli, ouvre `wa.me/2290197650741`
  avec le message correctement encodé (accents, « & », retours à la ligne).
- Les 15 liens WhatsApp de la page pointent vers le bon numéro avec le bon message.
- Validation syntaxique de tous les fichiers JavaScript.

À tester de votre côté après mise en ligne : ouverture réelle de WhatsApp sur un téléphone Android
et un iPhone, et rendu sur un appareil d'entrée de gamme.

## 9. Points restant à configurer

1. **Mentions légales** : compléter responsable de publication, adresse, RCCM/IFU éventuel et hébergeur
   (champs marqués « à compléter »).
2. **Nom de domaine** : une fois connu, ajouter `<link rel="canonical">`, une URL absolue pour
   `og:image` et un `sitemap.xml` (puis la ligne `Sitemap:` dans `robots.txt`).
3. **Polices** (facultatif) : pour ne contacter aucun serveur tiers, téléchargez les polices
   et hébergez-les dans `assets/fonts/` (la politique de confidentialité mentionne Google Fonts).
4. Remplacer le logo typographique par un logo officiel si vous en avez un.
