# Zeyscord

Clone Discord (chat, amis, MP, profil, boutique, serveurs…).

---

## 1. Lancer en local (sur ton PC)

```bash
npm install
npm start
```

Dans le terminal tu verras :
- `http://localhost:3000` → pour toi sur le PC
- `http://192.168.x.x:3000` → pour les amis **sur le même Wi-Fi**

---

## 2. Accès depuis n’importe quel appareil / Internet (recommandé)

### Option A – Tunnel gratuit (le plus simple, 30 secondes)

Ouvre un **deuxième** terminal dans le dossier du projet et lance :

```bash
npx localtunnel --port 3000
```

Tu obtiens un lien du type :
```
https://quelque-chose.loca.lt
```

**Partage ce lien** à tes amis. Ils peuvent l’ouvrir sur téléphone, PC, tablette… même hors de ton Wi-Fi.

> Astuce : la première fois localtunnel demande parfois un mot de passe (le code IP affiché). Sinon utilise Cloudflare Tunnel (plus stable) :

```bash
npx cloudflared tunnel --url http://localhost:3000
```

### Option B – Héberger gratuitement (lien permanent)

1. Crée un compte sur [https://render.com](https://render.com) (gratuit)
2. Clique **New → Web Service**
3. Connecte ton dépôt GitHub (ou upload le dossier)
4. Réglages :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance Type** : Free
5. Déploie → tu obtiens une URL permanente du type `https://zeyscord-xxxx.onrender.com`

Tout le monde peut y aller 24h/24.

---

## Connexion

Chacun choisit **son propre pseudo** (ex. Zeys, Alex, Marie…).

Le pseudo **Zeys** a les droits Owner (gestion des badges).

---

## Notes importantes

- Le serveur écoute déjà sur `0.0.0.0` → accessible sur le réseau local.
- Socket.io + CORS sont configurés pour accepter toutes les origines.
- Les données (messages, profils, serveurs) sont sauvegardées en fichiers JSON.
