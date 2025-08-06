# Discord Poll Bot Template

Un template pour un bot Discord qui envoie automatiquement un sondage chaque lundi à 7h 🎯

## Fonctionnalités

- Sondage pour les entraînements du mercredi & vendredi  
- Boutons interactifs : ✅ OUI / ❌ NON  
- Comptabilise les votes et permet de changer de choix  
- Ping un rôle spécifique au début du sondage  
- Hébergement via Railway (variables d’environnement)  
- Version prête à déployer en moins de 5 minutes

## 📦 Installation

1. Fork ou clone ce repo  
2. Crée un dépôt sur GitHub et ajoute les fichiers  
3. Connecte-le à Railway via le dashboard  

## ⚙️ Variables (Railway ou `.env`)
TOKEN=...
CLIENT_ID=...
GUILD_ID=...
ROLE_ID=...
CHANNEL_ID=...

shell
Copier
Modifier

## 🚀 Démarrage

npm install
npm start

markdown
Copier
Modifier

Le bot envoie le sondage chaque lundi matin.

## Pour tester maintenant

- Exécute `sendWeeklyPoll()` manuellement sur Node.js
