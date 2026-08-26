# Publication GitHub Pages

## Diagnostic initial

Le 26 août 2026, `https://asantetg0154.github.io/SIG-CDEJ/` servait une page Jekyll GitHub Pages minimale intitulée « SIG-CDEJ ». Cette page ne contenait ni point de montage React ni scripts produits par Vite ; elle chargeait seulement les ressources Jekyll `assets/css/style.css` et Anchor.js. Le contenu du dépôt à la racine était donc publié à la place de l’application construite.

La première prévisualisation Vite a chargé le document HTML avec le bon titre, mais le contenu React restait vide : le serveur de prévisualisation répondait avec `index.html` aux ressources préfixées par `/SIG-CDEJ/`. Ce comportement est propre à ce serveur local et ne reproduit pas le montage de GitHub Pages. Une seconde vérification avec un serveur statique monté sous `/SIG-CDEJ/` a confirmé le chargement des scripts, feuilles de style, manifeste et du rendu complet de la vitrine.

Après le succès du workflow de publication, la première requête vers l’URL publique a encore renvoyé la page Jekyll historique. Cette réponse est cohérente avec un délai de propagation du CDN GitHub Pages ; la vérification finale doit donc être répétée après propagation avant de conclure que le déploiement public est à jour.

La vérification finale, après réussite du workflow de déploiement corrigé, a confirmé que `https://asantetg0154.github.io/SIG-CDEJ/` sert bien la vitrine SIG-CDEJ, ses ressources sous `/SIG-CDEJ/` et les protections de présentation statique annoncées.

## Correction appliquée

Le workflow GitHub Actions placé dans `.github/workflows/deploy-pages.yml` construit le client Vite avec le préfixe `/SIG-CDEJ/` puis publie exclusivement `dist/public` sur GitHub Pages. Le script de build désactive le traitement Jekyll au moyen de `.nojekyll`, afin que les chemins de ressources soient conservés tels que générés par Vite. Il produit aussi un `404.html` identique à `index.html` : un lien profond sous `/SIG-CDEJ/` continue donc d’afficher la présentation statique lorsque GitHub Pages ne trouve pas de fichier correspondant.

## Limite importante

GitHub Pages est un hébergement **statique**. Il ne peut pas exécuter l’API Express, tRPC, Manus OAuth, les rappels Heartbeat, ni accéder à la base de données et au stockage sécurisé. La version publiée sur GitHub Pages est donc une vitrine statique de SIG-CDEJ ; les opérations authentifiées doivent continuer à être utilisées depuis un hébergement disposant du serveur Manus/Node et de ses services associés.
