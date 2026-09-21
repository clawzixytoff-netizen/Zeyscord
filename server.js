const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');

const app = express();
app.use(cors());

// Stripe (optionnel : si STRIPE_SECRET_KEY est défini)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('[Stripe] Activé');
  } catch (e) {
    console.log('[Stripe] Package manquant ou erreur:', e.message);
  }
}

// Webhook Stripe AVANT express.json (besoin du body brut)
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(400).send('Stripe non configuré');
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.log('[Stripe webhook] Erreur signature:', err.message);
    return res.status(400).send('Webhook Error');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};
    console.log('[Stripe] Paiement OK:', meta.itemId, meta.username, meta.email);
    const pFile = path.join(__dirname, 'purchases.json');
    let purchases = {};
    try { if (fs.existsSync(pFile)) purchases = JSON.parse(fs.readFileSync(pFile, 'utf8')); } catch (e) {}
    const key = (meta.email || meta.username || 'unknown') + '|' + meta.itemId;
    purchases[key] = {
      itemId: meta.itemId,
      itemType: meta.itemType,
      itemName: meta.itemName,
      username: meta.username,
      email: meta.email,
      paidAt: new Date().toISOString(),
      sessionId: session.id,
      amount: session.amount_total
    };
    try { fs.writeFileSync(pFile, JSON.stringify(purchases, null, 2)); } catch (e) {}

    // Notifier si io/users déjà prêts
    try {
      if (typeof io !== 'undefined' && typeof users !== 'undefined') {
        for (const [sid, u] of users.entries()) {
          if ((meta.email && u.email === meta.email) || (meta.username && u.username === meta.username)) {
            io.to(sid).emit('purchaseUnlocked', {
              itemId: meta.itemId,
              itemType: meta.itemType,
              itemName: meta.itemName
            });
          }
        }
      }
    } catch (e) {}
  }
  res.json({ received: true });
});

app.use(express.json({ limit: '12mb' }));
const staticDir = fs.existsSync(path.join(__dirname, 'public'))
  ? path.join(__dirname, 'public')
  : path.join(__dirname, 'publique');
app.use(express.static(staticDir));

console.log('[Static]', staticDir);
// Alias dossiers FR -> EN (si renommés sur GitHub)
const pubRoot = staticDir;
if (fs.existsSync(path.join(pubRoot, 'décorations'))) {
  app.use('/decos', express.static(path.join(pubRoot, 'décorations')));
}
if (fs.existsSync(path.join(pubRoot, 'decorations'))) {
  app.use('/decos', express.static(path.join(pubRoot, 'decorations')));
}
if (fs.existsSync(path.join(pubRoot, 'effets'))) {
  app.use('/effects', express.static(path.join(pubRoot, 'effets')));
}



// Créer une session Stripe Checkout
app.post('/api/create-checkout', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe non configuré. Ajoute STRIPE_SECRET_KEY dans Render.' });
  }
  try {
    const { itemId, itemName, itemType, price, username, email } = req.body;
    if (!itemId || !price) return res.status(400).json({ error: 'Données manquantes' });

    const amountCents = Math.round(Number(price) * 100);
    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'https://zeyscord.onrender.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: itemName || itemId, description: 'Zeyscord - ' + (itemType || 'item') },
          unit_amount: amountCents
        },
        quantity: 1
      }],
      metadata: {
        itemId: String(itemId),
        itemType: String(itemType || ''),
        itemName: String(itemName || ''),
        username: String(username || ''),
        email: String(email || '')
      },
      success_url: origin + '/?paid=1&session_id={CHECKOUT_SESSION_ID}&item=' + encodeURIComponent(itemId) + '&type=' + encodeURIComponent(itemType || ''),
      cancel_url: origin + '/?paid=0'
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('[Stripe] create-checkout:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Confirmer un paiement via session Stripe (sans webhook)
app.get('/api/confirm-session', async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) return res.status(400).json({ paid: false, error: 'session_id manquant' });
  if (!stripe) return res.status(503).json({ paid: false, error: 'Stripe non configure' });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return res.json({ paid: false, error: 'Paiement non complete' });
    }
    const meta = session.metadata || {};
    const pFile = path.join(__dirname, 'purchases.json');
    let purchases = {};
    try { if (fs.existsSync(pFile)) purchases = JSON.parse(fs.readFileSync(pFile, 'utf8')); } catch (e) {}
    const key = (meta.email || meta.username || 'unknown') + '|' + meta.itemId;
    purchases[key] = {
      itemId: meta.itemId,
      itemType: meta.itemType,
      itemName: meta.itemName,
      username: meta.username,
      email: meta.email,
      paidAt: new Date().toISOString(),
      sessionId: session.id,
      amount: session.amount_total
    };
    try { fs.writeFileSync(pFile, JSON.stringify(purchases, null, 2)); } catch (e) {}
    res.json({
      paid: true,
      itemId: meta.itemId,
      itemType: meta.itemType,
      itemName: meta.itemName,
      username: meta.username,
      email: meta.email
    });
  } catch (e) {
    console.error('[Stripe] confirm-session:', e.message);
    res.status(500).json({ paid: false, error: e.message });
  }
});

// Vérifier un paiement (fichier local)
app.get('/api/check-purchase', (req, res) => {
  const { email, username, itemId } = req.query;
  const pFile = path.join(__dirname, 'purchases.json');
  let purchases = {};
  try { if (fs.existsSync(pFile)) purchases = JSON.parse(fs.readFileSync(pFile, 'utf8')); } catch (e) {}
  const key1 = (email || '') + '|' + itemId;
  const key2 = (username || '') + '|' + itemId;
  const found = purchases[key1] || purchases[key2];
  res.json({ paid: !!found, purchase: found || null });
});



const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 12e6 // 12 Mo pour GIF avatar/bannière en base64
});

const users = new Map();
const usersById = new Map();
const usernameToId = {}; // usernameLower -> stable userId
let friendRequests = {};
let friendships = {};
const savedProfiles = {};
const PROFILES_FILE = path.join(__dirname, 'profiles.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const GUILDS_FILE = path.join(__dirname, 'guilds.json');
const DMS_FILE = path.join(__dirname, 'dms.json');
const FRIENDS_FILE = path.join(__dirname, 'friends.json');
const PENDING_GIFTS_FILE = path.join(__dirname, 'pending-gifts.json');
function loadJSON(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {}
  return fallback;
}
function saveJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch (e) {}
}
function loadFriends() {
  try {
    const data = loadJSON(FRIENDS_FILE, null);
    if (data) {
      friendships = data.friendships || {};
      friendRequests = data.friendRequests || {};
      if (data.usernameToId) Object.assign(usernameToId, data.usernameToId);
      console.log('[Friends] Chargé:', Object.keys(friendships).length, 'users avec amis');
    }
  } catch (e) { console.log('[Friends] load error', e.message); }
}
function saveFriends() {
  try {
    saveJSON(FRIENDS_FILE, { friendships, friendRequests, usernameToId });
  } catch (e) { console.log('[Friends] save error', e.message); }
}
function stableUserId(email, username) {
  const key = (email && String(email).toLowerCase()) || ('name:' + String(username || '').toLowerCase());
  return 'u_' + crypto.createHash('sha256').update(key + '|zeyscord-uid').digest('hex').slice(0, 16);
}
function resolveFriendPublic(fid) {
  if (usersById.has(fid)) return publicUser(usersById.get(fid));
  // offline: chercher dans profiles via usernameToId inverse
  let uname = null;
  for (const [n, id] of Object.entries(usernameToId)) {
    if (id === fid) { uname = n; break; }
  }
  if (!uname) return { id: fid, username: 'Ami', avatarColor: '#5865f2', avatarUrl: null, badges: [], customStatus: '', avatarDeco: 'none', profileEffect: 'none', presenceStatus: 'offline' };
  const saved = savedProfiles[uname] || {};
  return {
    id: fid,
    username: saved.username || uname,
    avatarColor: saved.avatarColor || '#5865f2',
    avatarUrl: saved.avatarUrl || null,
    bannerUrl: saved.bannerUrl || null,
    badges: saved.badges || [],
    customStatus: saved.customStatus || '',
    avatarDeco: saved.avatarDeco || 'none',
    profileEffect: saved.profileEffect || 'none',
      wishlist: Array.isArray(saved.wishlist) ? saved.wishlist : [],
    primaryColor: saved.primaryColor || null,
    secondaryColor: saved.secondaryColor || null,
    presenceStatus: 'offline',
    isOwner: false,
    hasNitro: !!saved.hasNitro,
    createdAt: saved.createdAt || null
  };
}
loadFriends();
let pendingGifts = {};
function loadPendingGifts() {
  pendingGifts = loadJSON(PENDING_GIFTS_FILE, {});
}
function savePendingGifts() {
  saveJSON(PENDING_GIFTS_FILE, pendingGifts);
}
loadPendingGifts();
try {
  if (fs.existsSync(PROFILES_FILE)) Object.assign(savedProfiles, JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8')));
} catch (e) {}
function saveProfilesToDisk() {
  try { fs.writeFileSync(PROFILES_FILE, JSON.stringify(savedProfiles, null, 2)); } catch (e) {}
}

// ===== COMPTES (email / mdp / code) =====
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');
const OWNER_EMAIL = 'zeyscolo@gmail.com';
let accounts = loadJSON(ACCOUNTS_FILE, {}); // email -> { email, username, passwordHash, verified, code }
const pendingCodes = {}; // email -> code

function hashPass(pw) {
  return crypto.createHash('sha256').update(String(pw) + '|zeyscord').digest('hex');
}
function saveAccounts() { saveJSON(ACCOUNTS_FILE, accounts); }
function isOwnerEmail(email) {
  return email && email.toLowerCase() === OWNER_EMAIL;
}
function isOwnerUser(user) {
  if (!user) return false;
  if (user.email && isOwnerEmail(user.email)) return true;
  if (user.username && user.username.toLowerCase() === 'zeys') return true;
  return false;
}

app.post('/api/register', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const username = String(req.body.username || '').trim().slice(0, 32);
  const password = String(req.body.password || '');
  if (!email || !email.includes('@') || !username || password.length < 4) {
    return res.status(400).json({ error: 'E-mail, pseudo et mot de passe (4+ car.) requis' });
  }
  if (accounts[email] && accounts[email].verified) {
    return res.status(400).json({ error: 'Cet e-mail est déjà utilisé' });
  }
  const taken = Object.values(accounts).some(a => a.verified && a.username.toLowerCase() === username.toLowerCase());
  if (taken) return res.status(400).json({ error: 'Ce pseudo est déjà pris' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  accounts[email] = {
    email,
    username,
    passwordHash: hashPass(password),
    verified: false,
    code
  };
  pendingCodes[email] = code;
  saveAccounts();
  res.json({ ok: true, email, code, message: 'Entre ce code pour valider ton compte' });
});

app.post('/api/verify', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const acc = accounts[email];
  if (!acc) return res.status(400).json({ error: 'Compte introuvable' });
  if (acc.verified) return res.json({ ok: true, already: true });
  if (acc.code !== code && pendingCodes[email] !== code) {
    return res.status(400).json({ error: 'Code incorrect' });
  }
  acc.verified = true;
  delete acc.code;
  delete pendingCodes[email];
  saveAccounts();
  res.json({ ok: true, email: acc.email, username: acc.username });
});

app.post('/api/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const acc = accounts[email];
  if (!acc) return res.status(400).json({ error: 'E-mail ou mot de passe incorrect' });
  if (!acc.verified) return res.status(400).json({ error: 'Compte non vérifié. Valide le code d\'abord.' });
  if (acc.passwordHash !== hashPass(password)) {
    return res.status(400).json({ error: 'E-mail ou mot de passe incorrect' });
  }
  res.json({
    ok: true,
    email: acc.email,
    username: acc.username,
    isOwner: isOwnerEmail(acc.email) || acc.username.toLowerCase() === 'zeys'
  });
});





// Multi-server
const guilds = {
  zeyscord: {
    id: 'zeyscord',
    name: 'Zeyscord',
    icon: 'ZC',
    ownerId: null,
    categories: [
      { id: 'zeyscord_cat_text', name: 'Salons textuels' }
    ],
    channels: [
      { id: 'zeyscord_general', name: 'général', type: 'text', categoryId: 'zeyscord_cat_text' },
      { id: 'zeyscord_random', name: 'aléatoire', type: 'text', categoryId: 'zeyscord_cat_text' },
      { id: 'zeyscord_aide', name: 'aide', type: 'text', categoryId: 'zeyscord_cat_text' }
    ],
    roles: [
      { id: 'everyone', name: '@everyone', color: '#99aab5', position: 0 },
      { id: 'admin', name: 'Admin', color: '#e74c3c', position: 1 }
    ]
  }
};
const userBoosts = {}; // userId -> number of boosts used (max 2)

const _loadedMsgs = loadJSON(MESSAGES_FILE, null);
let messages = _loadedMsgs || {
  zeyscord_general: [],
  zeyscord_random: [],
  zeyscord_aide: []
};
const dmMessages = loadJSON(DMS_FILE, {});
function saveMessages() {
  saveJSON(MESSAGES_FILE, messages);
  saveJSON(DMS_FILE, dmMessages);
}
function saveGuilds() {
  saveJSON(GUILDS_FILE, guilds);
}


try {
  const savedGuilds = loadJSON(GUILDS_FILE, null);
  if (savedGuilds && typeof savedGuilds === 'object') {
    Object.assign(guilds, savedGuilds);
  }
} catch (e) {}

const AVAILABLE_BADGES = [
  { id: 'owner', name: 'App Owner' },
  { id: 'early_supporter', name: 'Early Supporter' },
  { id: 'bot_developer', name: 'Early Verified Bot Developer' },
  { id: 'hypesquad', name: 'HypeSquad Events' },
  { id: 'partner', name: 'Partner' },
  { id: 'moderator', name: 'Moderator Programs Alumni' },
  { id: 'bughunter', name: 'Bug Hunter' },
  { id: 'bughunter2', name: 'Bug Hunter Level 2' },
  { id: 'nitro', name: 'Discord Nitro' },
  { id: 'nitro1', name: 'Boost 1 Month' },
  { id: 'nitro18', name: 'Boost 18 Months' },
  { id: 'nitro15', name: 'Boost 15 Months' },
  { id: 'nitro9', name: 'Boost 9 Months' },
  { id: 'nitro2', name: 'Boost 2 Months' },
  { id: 'nitro3', name: 'Boost 3 Months' },
  { id: 'nitro6', name: 'Boost 6 Months' },
  { id: 'nitro12', name: 'Boost 12 Months' },
  { id: 'nitro24', name: 'Boost 24 Months' },
  { id: 'boost', name: 'Server Boost' },
  { id: 'staff', name: 'Discord Staff' },
  { id: 'verified', name: 'Active Developer' },
  { id: 'quest', name: 'Quêtes' },
  { id: 'orbs', name: 'Orbs' },
  { id: 'leaf', name: 'Feuilles' },
  { id: 'gift', name: 'Cadeau' },
  { id: 'gift_rainbow', name: 'Cadeau Arc-en-ciel' },
  { id: 'gift_gold', name: 'Cadeau Or' },
  { id: 'gift_blue', name: 'Cadeau Bleu' },
  { id: 'gift_teal', name: 'Cadeau Sarcelle' },
  { id: 'gift_pink', name: 'Cadeau Rose' },
  { id: 'certified', name: 'Certifié' },
  { id: 'nitro_bronze', name: 'Nitro Bronze' },
  { id: 'nitro_silver', name: 'Nitro Argent' },
  { id: 'nitro_gold', name: 'Nitro Or' },
  { id: 'nitro_platinum', name: 'Nitro Platine' },
  { id: 'nitro_diamond', name: 'Nitro Diamant' },
  { id: 'nitro_emerald', name: 'Nitro Émeraude' },
  { id: 'nitro_ruby', name: 'Nitro Rubis' },
  { id: 'nitro_opal', name: 'Nitro Opal' }
];

function generateId() { return Math.random().toString(36).substring(2, 10); }
function getRandomColor() {
  const colors = ['#ed4245','#57f287','#fee75c','#eb459e','#5865f2','#f47b67','#3ba55d','#faa81a'];
  return colors[Math.floor(Math.random() * colors.length)];
}
function isOwner(username) { return username && username.toLowerCase() === 'zeys'; }
// owner also by email zeyscolo@gmail.com via isOwnerUser
function dmKey(id1, id2) { return [id1, id2].sort().join('_'); }
function publicUser(u) {
  return {
    id: u.id, username: u.username, avatarColor: u.avatarColor,
    avatarUrl: u.avatarUrl, bannerUrl: u.bannerUrl,
    badges: u.badges || [], customStatus: u.customStatus || '',
    avatarDeco: u.avatarDeco || 'none', profileEffect: u.profileEffect || 'none',
    primaryColor: u.primaryColor || null,
    secondaryColor: u.secondaryColor || null,
    presenceStatus: u.presenceStatus || 'online',
    isOwner: !!u.isOwner, hasNitro: !!u.hasNitro, createdAt: u.createdAt || null,
    wishlist: Array.isArray(u.wishlist) ? u.wishlist : []
  };
}
function publicGuild(g) {
  return {
    id: g.id, name: g.name, icon: g.icon, iconUrl: g.iconUrl || null, ownerId: g.ownerId,
    channels: g.channels || [],
    categories: g.categories || [],
    roles: g.roles || [],
    boostCount: g.boostCount || 0
  };
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (payload) => {
    const username = (payload && typeof payload === 'object') ? payload.username : payload;
    const email = (payload && typeof payload === 'object') ? (payload.email || '') : '';
    const cleanName = (username || 'User' + Math.floor(Math.random() * 1000)).trim().substring(0, 32);
    const owner = isOwner(cleanName) || isOwnerEmail(email);
    const nameKey = cleanName.toLowerCase();
    const saved = savedProfiles[nameKey] || {};
    // ID stable : même compte = même id après reboot / redeploy
    let uid = (saved.userId) || (usernameToId[nameKey]) || stableUserId(email, cleanName);
    if (email) {
      // préférer id lié à l'email si dispo
      const emailId = stableUserId(email, cleanName);
      if (!saved.userId) uid = emailId;
    }
    usernameToId[nameKey] = uid;
    if (!savedProfiles[nameKey]) savedProfiles[nameKey] = {};
    savedProfiles[nameKey].userId = uid;
    savedProfiles[nameKey].username = cleanName;
    saveProfilesToDisk();
    saveFriends();

    const user = {
      id: uid,
      username: cleanName,
      avatarColor: saved.avatarColor || getRandomColor(),
      avatarUrl: saved.avatarUrl || null,
      bannerUrl: saved.bannerUrl || null,
      badges: saved.badges || (owner ? ['owner', 'nitro', 'nitro24', 'staff', 'early_supporter', 'hypesquad', 'partner', 'bughunter2'] : []),
      customStatus: saved.customStatus || '',
      avatarDeco: saved.avatarDeco || 'none',
      profileEffect: saved.profileEffect || 'none',
      primaryColor: saved.primaryColor || null,
      secondaryColor: saved.secondaryColor || null,
      presenceStatus: saved.presenceStatus || 'online',
      hasNitro: !!(saved.hasNitro || owner),
      createdAt: saved.createdAt || new Date().toISOString(),
      isOwner: owner,
      email: email || null,
      socketId: socket.id,
      currentGuild: 'zeyscord'
    };
    users.set(socket.id, user);
    usersById.set(user.id, user);
    if (saved.boostsUsed) userBoosts[user.id] = saved.boostsUsed;
    if (!friendships[user.id]) friendships[user.id] = [];
    if (!friendRequests[user.id]) friendRequests[user.id] = [];

    socket.join('zeyscord_general');
    socket.currentChannel = 'zeyscord_general';
    socket.userId = user.id;

    socket.emit('init', {
      user: publicUser(user),
      guilds: Object.values(guilds).map(publicGuild),
      currentGuild: 'zeyscord',
      channels: guilds.zeyscord.channels,
      messages: messages.zeyscord_general || [],
      onlineUsers: Array.from(users.values()).map(publicUser),
      availableBadges: AVAILABLE_BADGES,
      friends: (friendships[user.id] || []).map(fid => resolveFriendPublic(fid)),
      friendRequests: friendRequests[user.id] || []
    });
    io.emit('onlineUsers', Array.from(users.values()).map(publicUser));
    console.log(user.username + ' joined');
  });

  socket.on('joinGuild', (guildId) => {
    const guild = guilds[guildId];
    if (!guild) return;
    const user = users.get(socket.id);
    if (!user) return;
    user.currentGuild = guildId;
    if (socket.currentChannel) socket.leave(socket.currentChannel);
    const first = guild.channels[0];
    if (first) {
      socket.join(first.id);
      socket.currentChannel = first.id;
      socket.emit('guildJoined', {
        guild: publicGuild(guild),
        channels: guild.channels,
        messages: messages[first.id] || [],
        channelId: first.id
      });
    }
  });

  socket.on('createGuild', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    const name = (data.name || 'Mon serveur').trim().substring(0, 32);
    const id = 'g_' + generateId();
    const icon = (name[0] || 'S').toUpperCase();
    const chGeneral = id + '_general';
    const chRandom = id + '_random';
    const catId = id + '_cat_text';
    guilds[id] = {
      id,
      name,
      icon,
      ownerId: user.id,
      categories: [{ id: catId, name: 'Salons textuels' }],
      channels: [
        { id: chGeneral, name: 'général', type: 'text', categoryId: catId },
        { id: chRandom, name: 'discussion', type: 'text', categoryId: catId }
      ],
      roles: [
        { id: 'everyone', name: '@everyone', color: '#99aab5', position: 0 },
        { id: id + '_admin', name: 'Admin', color: '#e74c3c', position: 1 }
      ]
    };
    messages[chGeneral] = [];
    messages[chRandom] = [];
    saveGuilds();
    io.emit('guildCreated', publicGuild(guilds[id]));
    socket.emit('guildJoined', {
      guild: publicGuild(guilds[id]),
      channels: guilds[id].channels,
      messages: [],
      channelId: chGeneral
    });
    if (socket.currentChannel) socket.leave(socket.currentChannel);
    socket.join(chGeneral);
    socket.currentChannel = chGeneral;
    user.currentGuild = id;
  });

  socket.on('joinChannel', (channelId) => {
    if (socket.currentChannel) socket.leave(socket.currentChannel);
    socket.join(channelId);
    socket.currentChannel = channelId;
    socket.emit('channelMessages', { channelId, messages: messages[channelId] || [] });
  });

  socket.on('joinDM', (targetUserId) => {
    const me = users.get(socket.id);
    if (!me) return;
    const key = dmKey(me.id, targetUserId);
    if (socket.currentChannel) socket.leave(socket.currentChannel);
    socket.join('dm_' + key);
    socket.currentChannel = 'dm_' + key;
    socket.emit('dmMessages', { targetUserId, messages: dmMessages[key] || [] });
  });

  socket.on('sendMessage', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    if (data.dmTargetId) {
      const key = dmKey(user.id, data.dmTargetId);
      try {
        const sk = (user.username || '').toLowerCase();
        const sv = savedProfiles[sk] || {};
        if (sv.avatarUrl && !user.avatarUrl) user.avatarUrl = sv.avatarUrl;
        if (sv.avatarColor) user.avatarColor = sv.avatarColor;
        if (sv.avatarDeco) user.avatarDeco = sv.avatarDeco;
      } catch(e) {}
      const message = { id: generateId(), content: data.content, author: publicUser(user), timestamp: new Date().toISOString(), channelId: 'dm_' + key };
      if (!dmMessages[key]) dmMessages[key] = [];
      dmMessages[key].push(message);
      if (dmMessages[key].length > 100) dmMessages[key] = dmMessages[key].slice(-100);
      io.to('dm_' + key).emit('newMessage', message);
      saveMessages();
      for (const [sid, u] of users) {
        if (u.id === data.dmTargetId) io.to(sid).emit('dmNotification', { from: publicUser(user), message });
      }
      return;
    }
    const channelId = data.channelId || socket.currentChannel || 'zeyscord_general';
    try {
      const sk = (user.username || '').toLowerCase();
      const sv = savedProfiles[sk] || {};
      if (sv.avatarUrl && !user.avatarUrl) user.avatarUrl = sv.avatarUrl;
      if (sv.avatarColor) user.avatarColor = sv.avatarColor;
      if (sv.avatarDeco) user.avatarDeco = sv.avatarDeco;
    } catch(e) {}
    const message = { id: generateId(), content: data.content, author: publicUser(user), timestamp: new Date().toISOString(), channelId };
    if (!messages[channelId]) messages[channelId] = [];
    messages[channelId].push(message);
    if (messages[channelId].length > 100) messages[channelId] = messages[channelId].slice(-100);
    io.to(channelId).emit('newMessage', message);
    saveMessages();
  });

  socket.on('typing', (data) => {
    const user = users.get(socket.id);
    if (user) socket.to(data.channelId || socket.currentChannel).emit('userTyping', { username: user.username, channelId: data.channelId || socket.currentChannel });
  });

  socket.on('updateProfile', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    const oldKey = (user.username || '').toLowerCase();
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl || null;
    if (data.bannerUrl !== undefined) user.bannerUrl = data.bannerUrl || null;
    if (data.customStatus !== undefined) user.customStatus = (data.customStatus || '').substring(0, 128);
    if (data.username !== undefined && data.username.trim()) {
      user.username = data.username.trim().substring(0, 32);
    }
    if (data.avatarDeco !== undefined) user.avatarDeco = data.avatarDeco || 'none';
    if (data.profileEffect !== undefined) user.profileEffect = data.profileEffect || 'none';
    if (data.primaryColor !== undefined) user.primaryColor = data.primaryColor || null;
    if (data.secondaryColor !== undefined) user.secondaryColor = data.secondaryColor || null;
    if (data.presenceStatus !== undefined) {
      const ok = ['online','idle','dnd','invisible'];
      user.presenceStatus = ok.includes(data.presenceStatus) ? data.presenceStatus : 'online';
    }
    if (data.hasNitro !== undefined) user.hasNitro = !!data.hasNitro;
    if (data.wishlist !== undefined) user.wishlist = Array.isArray(data.wishlist) ? data.wishlist.slice(0, 50) : [];
    if (data.createdAt !== undefined) {
      if (!user.isOwner) { socket.emit('error', { message: 'Seul le propriétaire peut modifier la date de création' }); }
      else { user.createdAt = data.createdAt; }
    }
    if (user.hasNitro && !(user.badges || []).includes('nitro')) {
      user.badges = [...(user.badges || []), 'nitro'];
    }
    users.set(socket.id, user);
    usersById.set(user.id, user);
    const newKey = (user.username || '').toLowerCase();
    // Fusionner avec l'ancien profil + migrer la cle si pseudo change
    const prev = savedProfiles[oldKey] || savedProfiles[newKey] || {};
    savedProfiles[newKey] = Object.assign({}, prev, {
      avatarUrl: user.avatarUrl, bannerUrl: user.bannerUrl, customStatus: user.customStatus,
      avatarDeco: user.avatarDeco, profileEffect: user.profileEffect,
      wishlist: user.wishlist || [],
      primaryColor: user.primaryColor, secondaryColor: user.secondaryColor,
      presenceStatus: user.presenceStatus,
      badges: user.badges, hasNitro: user.hasNitro, createdAt: user.createdAt
    });
    if (oldKey && oldKey !== newKey && savedProfiles[oldKey]) {
      delete savedProfiles[oldKey];
    }
    saveProfilesToDisk();
    io.emit('userUpdated', publicUser(user));
    io.emit('onlineUsers', Array.from(users.values()).map(publicUser));
  });

  socket.on('setBadges', (data) => {
    const current = users.get(socket.id);
    if (!current || !current.isOwner) { socket.emit('error', { message: 'Seul le propriétaire peut gérer les badges' }); return; }
    let target = null;
    for (const u of users.values()) { if (u.id === data.userId) { target = u; break; } }
    if (!target) { socket.emit('error', { message: 'Utilisateur non trouvé' }); return; }
    target.badges = Array.isArray(data.badges) ? data.badges : [];
    usersById.set(target.id, target);
    const key = target.username.toLowerCase();
    if (!savedProfiles[key]) savedProfiles[key] = {};
    savedProfiles[key].badges = target.badges;
    savedProfiles[key].avatarUrl = target.avatarUrl;
    savedProfiles[key].bannerUrl = target.bannerUrl;
    savedProfiles[key].customStatus = target.customStatus;
    savedProfiles[key].avatarDeco = target.avatarDeco;
    savedProfiles[key].profileEffect = target.profileEffect;
    savedProfiles[key].hasNitro = target.hasNitro;
    saveProfilesToDisk();
    io.emit('userUpdated', publicUser(target));
    io.emit('onlineUsers', Array.from(users.values()).map(publicUser));
  });

  socket.on('sendFriendRequest', (targetUsername) => {
    const me = users.get(socket.id);
    if (!me) return;
    const tname = String(targetUsername || '').trim();
    if (!tname) { socket.emit('error', { message: 'Pseudo requis' }); return; }
    const tkey = tname.toLowerCase();
    if (tkey === me.username.toLowerCase()) { socket.emit('error', { message: "Tu ne peux pas t'ajouter toi-même" }); return; }

    // Chercher en ligne d'abord
    let target = null;
    for (const u of users.values()) {
      if (u.username.toLowerCase() === tkey) { target = u; break; }
    }
    // Sinon offline via profils / comptes
    let targetId = target ? target.id : (usernameToId[tkey] || null);
    if (!targetId && savedProfiles[tkey] && savedProfiles[tkey].userId) targetId = savedProfiles[tkey].userId;
    if (!targetId) {
      // créer un id stable pour ce pseudo (il pourra accepter plus tard)
      targetId = stableUserId('', tname);
      usernameToId[tkey] = targetId;
      if (!savedProfiles[tkey]) savedProfiles[tkey] = { username: tname, userId: targetId };
      else { savedProfiles[tkey].userId = targetId; savedProfiles[tkey].username = savedProfiles[tkey].username || tname; }
      saveProfilesToDisk();
    }

    if ((friendships[me.id] || []).includes(targetId)) { socket.emit('error', { message: 'Vous êtes déjà amis' }); return; }
    if (!friendRequests[targetId]) friendRequests[targetId] = [];
    if (friendRequests[targetId].some(r => r.fromId === me.id)) { socket.emit('error', { message: 'Demande déjà envoyée' }); return; }
    const req = { fromId: me.id, fromUsername: me.username, fromAvatar: me.avatarUrl, fromColor: me.avatarColor };
    friendRequests[targetId].push(req);
    saveFriends();
    for (const [sid, u] of users) { if (u.id === targetId) io.to(sid).emit('friendRequest', req); }
    socket.emit('friendRequestSent', { to: target ? target.username : tname });
  });

  socket.on('acceptFriendRequest', (fromId) => {
    const me = users.get(socket.id);
    if (!me) return;
    friendRequests[me.id] = (friendRequests[me.id] || []).filter(r => r.fromId !== fromId);
    if (!friendships[me.id]) friendships[me.id] = [];
    if (!friendships[fromId]) friendships[fromId] = [];
    if (!friendships[me.id].includes(fromId)) friendships[me.id].push(fromId);
    if (!friendships[fromId].includes(me.id)) friendships[fromId].push(me.id);
    saveFriends();
    socket.emit('friendAdded', resolveFriendPublic(fromId));
    for (const [sid, u] of users) { if (u.id === fromId) io.to(sid).emit('friendAdded', publicUser(me)); }
  });

  socket.on('declineFriendRequest', (fromId) => {
    const me = users.get(socket.id);
    if (!me) return;
    friendRequests[me.id] = (friendRequests[me.id] || []).filter(r => r.fromId !== fromId);
    saveFriends();
  });

  socket.on('removeFriend', (friendId) => {
    const me = users.get(socket.id);
    if (!me) return;
    friendships[me.id] = (friendships[me.id] || []).filter(id => id !== friendId);
    friendships[friendId] = (friendships[friendId] || []).filter(id => id !== me.id);
    saveFriends();
    socket.emit('friendRemoved', friendId);
    for (const [sid, u] of users) { if (u.id === friendId) io.to(sid).emit('friendRemoved', me.id); }
  });

  socket.on('sendGiftDM', (data) => {
    const me = users.get(socket.id);
    if (!me) return;
    const toUsername = String(data.toUsername || '').trim();
    const toId = data.toUserId || usernameToId[toUsername.toLowerCase()] || null;
    if (!toId) { socket.emit('error', { message: 'Destinataire introuvable' }); return; }
    if (toId === me.id) { socket.emit('error', { message: 'Tu ne peux pas t\'offrir un cadeau' }); return; }

    const giftId = 'gift_' + generateId() + Date.now().toString(36);
    const gift = {
      id: giftId,
      fromId: me.id,
      fromUsername: me.username,
      toId,
      toUsername,
      itemId: data.itemId,
      itemType: data.itemType,
      itemName: data.itemName,
      itemImg: data.itemImg || null,
      price: data.price || 0,
      message: (data.message || '').substring(0, 190),
      claimed: false,
      createdAt: new Date().toISOString()
    };
    pendingGifts[giftId] = gift;
    savePendingGifts();

    const key = dmKey(me.id, toId);
    const content = '🎁 CADEAU|' + giftId + '|' + (gift.itemName || 'Cadeau') + '|' + (gift.itemType || 'deco') + (gift.message ? ('\n' + gift.message) : '');
    const message = {
      id: generateId(),
      content,
      author: publicUser(me),
      timestamp: new Date().toISOString(),
      channelId: 'dm_' + key,
      isGift: true,
      giftId
    };
    if (!dmMessages[key]) dmMessages[key] = [];
    dmMessages[key].push(message);
    if (dmMessages[key].length > 100) dmMessages[key] = dmMessages[key].slice(-100);
    saveMessages();
    io.to('dm_' + key).emit('newMessage', message);
    // Notifier destinataire
    for (const [sid, u] of users) {
      if (u.id === toId) {
        io.to(sid).emit('dmNotification', { from: publicUser(me), message });
        io.to(sid).emit('giftReceived', gift);
      }
    }
    socket.emit('giftSent', { giftId, toUsername });
  });

  socket.on('claimGift', (giftId) => {
    const me = users.get(socket.id);
    if (!me) return;
    const gift = pendingGifts[giftId];
    if (!gift) { socket.emit('error', { message: 'Cadeau introuvable' }); return; }
    if (gift.claimed) { socket.emit('error', { message: 'Cadeau déjà réclamé' }); return; }
    if (gift.toId !== me.id) { socket.emit('error', { message: 'Ce cadeau ne t\'est pas destiné' }); return; }
    gift.claimed = true;
    gift.claimedAt = new Date().toISOString();
    savePendingGifts();

    // Appliquer sur le profil serveur
    if (gift.itemType === 'nitro') {
      me.hasNitro = true;
      if (!(me.badges || []).includes('nitro')) me.badges = [...(me.badges || []), 'nitro'];
      const pk = (me.username || '').toLowerCase();
      if (!savedProfiles[pk]) savedProfiles[pk] = {};
      savedProfiles[pk].hasNitro = true;
      savedProfiles[pk].badges = me.badges;
      saveProfilesToDisk();
      users.set(socket.id, me);
      usersById.set(me.id, me);
      io.emit('userUpdated', publicUser(me));
    }
    socket.emit('giftClaimed', {
      giftId,
      itemId: gift.itemId,
      itemType: gift.itemType,
      itemName: gift.itemName
    });
  });



  socket.on('createChannel', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    const guild = guilds[data.guildId];
    if (!guild) return;
    if (guild.ownerId && guild.ownerId !== user.id && !user.isOwner) {
      socket.emit('error', { message: 'Pas la permission' }); return;
    }
    const chId = data.guildId + '_ch_' + generateId();
    const channel = {
      id: chId,
      name: (data.name || 'salon').trim().replace(/\s+/g, '-').substring(0, 48),
      type: 'text',
      categoryId: data.categoryId || null
    };
    guild.channels.push(channel);
    messages[chId] = [];
    saveGuilds();
    io.emit('guildUpdated', publicGuild(guild));
  });

  socket.on('createCategory', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    const guild = guilds[data.guildId];
    if (!guild) return;
    if (guild.ownerId && guild.ownerId !== user.id && !user.isOwner) {
      socket.emit('error', { message: 'Pas la permission' }); return;
    }
    if (!guild.categories) guild.categories = [];
    const cat = {
      id: data.guildId + '_cat_' + generateId(),
      name: (data.name || 'Catégorie').substring(0, 32)
    };
    guild.categories.push(cat);
    saveGuilds();
    io.emit('guildUpdated', publicGuild(guild));
  });

  socket.on('deleteChannel', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    const guild = guilds[data.guildId];
    if (!guild) return;
    if (guild.ownerId && guild.ownerId !== user.id && !user.isOwner) {
      socket.emit('error', { message: 'Pas la permission' }); return;
    }
    const chId = data.channelId;
    if (!chId) return;
    const before = (guild.channels || []).length;
    guild.channels = (guild.channels || []).filter(c => c.id !== chId);
    if (guild.channels.length === before) {
      socket.emit('error', { message: 'Salon introuvable' }); return;
    }
    // garder au moins 1 salon
    if (guild.channels.length === 0) {
      const fallback = {
        id: data.guildId + '_ch_' + generateId(),
        name: 'général',
        type: 'text',
        categoryId: null
      };
      guild.channels.push(fallback);
      messages[fallback.id] = [];
    }
    delete messages[chId];
    saveMessages();
    saveGuilds();
    io.emit('guildUpdated', publicGuild(guild));
    // si on était dessus, basculer
    if (socket.currentChannel === chId) {
      const first = guild.channels[0];
      if (first) {
        socket.leave(chId);
        socket.join(first.id);
        socket.currentChannel = first.id;
        socket.emit('channelMessages', { channelId: first.id, messages: messages[first.id] || [] });
      }
    }
  });

  socket.on('deleteCategory', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    const guild = guilds[data.guildId];
    if (!guild) return;
    if (guild.ownerId && guild.ownerId !== user.id && !user.isOwner) {
      socket.emit('error', { message: 'Pas la permission' }); return;
    }
    const catId = data.categoryId;
    if (!catId) return;
    guild.categories = (guild.categories || []).filter(c => c.id !== catId);
    // détacher les salons de cette catégorie
    (guild.channels || []).forEach(ch => {
      if (ch.categoryId === catId) ch.categoryId = null;
    });
    saveGuilds();
    io.emit('guildUpdated', publicGuild(guild));
  });

  socket.on('createRole', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    const guild = guilds[data.guildId];
    if (!guild) return;
    if (guild.ownerId && guild.ownerId !== user.id && !user.isOwner) {
      socket.emit('error', { message: 'Pas la permission' }); return;
    }
    if (!guild.roles) guild.roles = [];
    const role = {
      id: data.guildId + '_role_' + generateId(),
      name: (data.name || 'Nouveau rôle').substring(0, 32),
      color: data.color || '#99aab5',
      position: guild.roles.length
    };
    guild.roles.push(role);
    saveGuilds();
    io.emit('guildUpdated', publicGuild(guild));
  });

  socket.on('updateGuild', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    const guild = guilds[data.guildId];
    if (!guild) return;
    if (guild.ownerId && guild.ownerId !== user.id && !user.isOwner) {
      socket.emit('error', { message: 'Pas la permission' }); return;
    }
    if (data.name) guild.name = data.name.trim().substring(0, 32);
    if (data.icon !== undefined) guild.icon = (data.icon || '').toString().trim().substring(0, 2).toUpperCase() || (guild.name[0] || 'S').toUpperCase();
    if (data.iconUrl !== undefined) {
      if (data.iconUrl === null || data.iconUrl === '') {
        guild.iconUrl = null;
      } else if (typeof data.iconUrl === 'string' && data.iconUrl.startsWith('data:image/')) {
        // max ~5MB base64 (~6.7M chars)
        if (data.iconUrl.length <= 7_000_000) {
          guild.iconUrl = data.iconUrl;
        }
      }
    }
    saveGuilds();
    io.emit('guildUpdated', publicGuild(guild));
  });


  socket.on('addReaction', (data) => {
    const user = users.get(socket.id);
    if (!user || !data.messageId || !data.emoji) return;
    const channelId = data.channelId || socket.currentChannel;
    let list = null;
    if (channelId && channelId.startsWith('dm_')) list = dmMessages[channelId.replace(/^dm_/, '')] || dmMessages[channelId];
    // find in channel messages
    if (!list && channelId) list = messages[channelId];
    // also search dm by iterating keys if needed
    if (!list) {
      for (const key of Object.keys(messages)) {
        const found = (messages[key] || []).find(m => m.id === data.messageId);
        if (found) { list = messages[key]; break; }
      }
    }
    if (!list) {
      for (const key of Object.keys(dmMessages)) {
        const found = (dmMessages[key] || []).find(m => m.id === data.messageId);
        if (found) { list = dmMessages[key]; break; }
      }
    }
    if (!list) return;
    const msg = list.find(m => m.id === data.messageId);
    if (!msg) return;
    if (!msg.reactions) msg.reactions = {};
    const emoji = String(data.emoji).substring(0, 16);
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const uid = user.id;
    const idx = msg.reactions[emoji].indexOf(uid);
    if (idx === -1) msg.reactions[emoji].push(uid);
    else {
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    }
    const payload = { messageId: msg.id, channelId: msg.channelId, reactions: msg.reactions };
    if (msg.channelId && msg.channelId.startsWith('dm_')) {
      io.to(msg.channelId).emit('reactionUpdate', payload);
    } else if (msg.channelId) {
      io.to(msg.channelId).emit('reactionUpdate', payload);
    } else {
      io.emit('reactionUpdate', payload);
    }
  });


  socket.on('boostServer', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    // Boost UNIQUEMENT si le user a Nitro
    const hasNitro = !!user.hasNitro || (user.badges || []).some(b =>
      b === 'nitro' || (typeof b === 'string' && (b.startsWith('nitro_') || b.startsWith('nitro')))
    );
    if (!hasNitro) {
      socket.emit('error', { message: 'Il te faut Nitro pour booster un serveur ! Achète Nitro dans la boutique.' });
      return;
    }
    const guildId = data.guildId || user.currentGuild;
    const guild = guilds[guildId];
    if (!guild) { socket.emit('error', { message: 'Serveur introuvable' }); return; }
    const used = userBoosts[user.id] || 0;
    if (used >= 2) {
      socket.emit('error', { message: 'Maximum 2 boosts par personne' });
      return;
    }
    userBoosts[user.id] = used + 1;
    if (!guild.boostCount) guild.boostCount = 0;
    guild.boostCount += 1;
    // Grant boost badge
    if (!user.badges) user.badges = [];
    // Always grant 1-month boost badge
    if (!user.badges.includes('nitro1')) {
      user.badges.push('nitro1');
    }
    // remove generic boost if present
    user.badges = user.badges.filter(b => b !== 'boost');
    users.set(socket.id, user);
    usersById.set(user.id, user);
    const key = user.username.toLowerCase();
    if (!savedProfiles[key]) savedProfiles[key] = {};
    savedProfiles[key].badges = user.badges;
    savedProfiles[key].boostsUsed = userBoosts[user.id];
    saveProfilesToDisk();
    io.emit('userUpdated', publicUser(user));
    io.emit('onlineUsers', Array.from(users.values()).map(publicUser));
    saveGuilds();
    io.emit('guildUpdated', publicGuild(guild));
    socket.emit('boostSuccess', {
      boostsUsed: userBoosts[user.id],
      boostsLeft: 2 - userBoosts[user.id],
      guildBoosts: guild.boostCount
    });
  });

  socket.on('reorderBadges', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    // Owner can reorder anyone, users can reorder themselves
    let target = user;
    if (data.userId && data.userId !== user.id) {
      if (!user.isOwner) { socket.emit('error', { message: 'Pas la permission' }); return; }
      target = usersById.get(data.userId);
      if (!target) { socket.emit('error', { message: 'Utilisateur non trouvé' }); return; }
    }
    if (!Array.isArray(data.badges)) return;
    // Keep only valid badges that user already has (or owner can set any)
    const valid = data.badges.filter(b => typeof b === 'string');
    if (user.isOwner && data.userId && data.userId !== user.id) {
      target.badges = valid;
    } else {
      // Self: only reorder existing badges
      const current = new Set(target.badges || []);
      target.badges = valid.filter(b => current.has(b));
      // append any missing that were not in the order list
      (Array.from(current)).forEach(b => {
        if (!target.badges.includes(b)) target.badges.push(b);
      });
    }
    usersById.set(target.id, target);
    for (const [sid, u] of users) {
      if (u.id === target.id) users.set(sid, target);
    }
    const key = target.username.toLowerCase();
    if (!savedProfiles[key]) savedProfiles[key] = {};
    savedProfiles[key].badges = target.badges;
    saveProfilesToDisk();
    io.emit('userUpdated', publicUser(target));
    io.emit('onlineUsers', Array.from(users.values()).map(publicUser));
  });


  socket.on('setCreatedAt', (data) => {
    const current = users.get(socket.id);
    if (!current || !current.isOwner) {
      socket.emit('error', { message: 'Seul le propriétaire peut modifier la date de création' });
      return;
    }
    let target = current;
    if (data.userId) {
      target = usersById.get(data.userId) || current;
    }
    if (!target) return;
    const d = data.createdAt ? new Date(data.createdAt) : new Date();
    if (isNaN(d.getTime())) {
      socket.emit('error', { message: 'Date invalide' });
      return;
    }
    target.createdAt = d.toISOString();
    usersById.set(target.id, target);
    for (const [sid, u] of users) {
      if (u.id === target.id) users.set(sid, target);
    }
    const key = target.username.toLowerCase();
    if (!savedProfiles[key]) savedProfiles[key] = {};
    savedProfiles[key].createdAt = target.createdAt;
    savedProfiles[key].badges = target.badges;
    savedProfiles[key].avatarUrl = target.avatarUrl;
    savedProfiles[key].bannerUrl = target.bannerUrl;
    saveProfilesToDisk();
    io.emit('userUpdated', publicUser(target));
    io.emit('onlineUsers', Array.from(users.values()).map(publicUser));
  });

  socket.on('shopPurchase', (data) => {
    const buyer = users.get(socket.id);
    console.log('[SHOP] Achat:', data?.itemName, 'par', data?.buyer || buyer?.username, data?.email, data?.price + '€');
    // Notifier tous les owners connectés
    for (const [sid, u] of users.entries()) {
      if (u.isOwner) {
        io.to(sid).emit('shopPurchaseNotify', {
          itemName: data?.itemName,
          price: data?.price,
          buyer: data?.buyer || buyer?.username,
          email: data?.email
        });
      }
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      io.emit('onlineUsers', Array.from(users.values()).map(publicUser));
      console.log(user.username + ' left');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('========================================');
  console.log('  Zeyscord est en ligne !');
  console.log('  → http://localhost:' + PORT);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log('  → http://' + net.address + ':' + PORT + ' (amis Wi-Fi)');
      }
    }
  }
  console.log('========================================');
});
