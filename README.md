# EcoStrike - CS2 Economy Simulator 💰

![GitHub Pages](https://img.shields.io/badge/Status-Live%20Demo-brightgreen?style=for-the-badge&logo=github&logoColor=white)
![Frontend Tech](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript-blue?style=for-the-badge&logo=react)
![Build Tool](https://img.shields.io/badge/Build%20Tool-Vite-yellowgreen?style=for-the-badge&logo=vite)

---

<h2 align="left">
  <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHd2YjI5bTYxeGlneGo5aHNjcW03bHM2dWV6Y3Y2Mzl5N3d5bHg5NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l4C3O9hOk9AgW7Ypzq/giphy.gif" width="35px" height="25px"> 
  A propos du projet 
</h2>

**EcoStrike** est une app web conçue pour simuler l'économie des matchs de Counter-Strike 2 (CS2) en modes Compétitif et Premier.

<h2 align="left">
  <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHd2YjI5bTYxeGlneGo5aHNjcW03bHM2dWV6Y3Y2Mzl5N3d5bHg5NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l4C3O9hOk9AgW7Ypzq/giphy.gif" width="35px" height="25px"> 
  Démo
</h2>

Vous pouvez tester l'application directement : https://samuellct.github.io/EcoStrike/

<h2 align="left">
  <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHd2YjI5bTYxeGlneGo5aHNjcW03bHM2dWV6Y3Y2Mzl5N3d5bHg5NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l4C3O9hOk9AgW7Ypzq/giphy.gif" width="35px" height="25px"> 
  Fonctionnalités clés 
</h2>

### Simulation économique

L'app gère toute la modélisation de l'économie :
* **Récompenses de kill détaillées** (ajustées selon l'arme utilisée et le bonus pour l'équipe CT).
* **Gestion de la *loss streak*** : Calcul précis des gains de fin de manche, avec prise en compte du désamorçage et du plant de bombe (même en cas de défaite).
* **Gifting d'équipement** : Déduction des fonds de l'acheteur sans coût pour le receveur.

### Interface utilisateur claire

* **Manches et chronomètres** : Affichage visuel du temps de *freezetime* et de la durée de la manche.
* **Round history** : Suivi de l'historique des victoires/defaites pour une lecture rapide du loss streak en cours.
* **Prédiction économique** : Affichage du solde minimal garanti pour chaque joueur à la manche suivante.

### Gestion des modes de match

L'outil s'adapte automatiquement aux règles de score et d'économie du mode choisi :
* **Compétitif standard** : Victoire à 13, égalité à 12-12.
* **Mode Premier** : Victoire à 13, avec gestion des règles de prolongation spécifiques et reset de l'argent à 16000 $ en début de prolongation.
* Mi-temps : Reset de l'argent à $800 à la Manche 13.

