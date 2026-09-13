const socket = io();

let currentUser = null;
let currentChannel = 'general';
let currentDM = null; // target user id if in DM
let currentView = 'home'; // 'home' | 'server'
let guilds = [];
let currentGuild = null;
let onlineUsers = [];
let friends = [];
let friendRequests = [];
let availableBadges = [];
let lastMessageAuthor = null;
let typingTimeout = null;
let selectedUserForBadges = null;

const BADGE_ICONS = {
  owner: `<img src="/badges/staff.png" width="22" height="22">`,
  early_supporter: `<img src="/badges/early_supporter.png" width="22" height="22">`,
  bot_developer: `<img src="/badges/bot_developer.png" width="22" height="22">`,
  hypesquad: `<img src="/badges/hypesquad.png" width="22" height="22">`,
  partner: `<img src="/badges/partner.png" width="22" height="22">`,
  moderator: `<img src="/badges/moderator.png" width="22" height="22">`,
  bughunter: `<img src="/badges/bughunter.png" width="22" height="22">`,
  bughunter2: `<img src="/badges/bughunter2.png" width="22" height="22">`,
  nitro: `<img src="/badges/nitro.png" width="22" height="22">`,
  nitro1: `<img src="/badges/boost_1.png" width="22" height="22">`,
  nitro2: `<img src="/badges/boost_2.png" width="22" height="22">`,
  nitro9: `<img src="/badges/boost_9.png" width="22" height="22">`,
  nitro15: `<img src="/badges/boost_15.png" width="22" height="22">`,
  nitro18: `<img src="/badges/boost_18.png" width="22" height="22">`,
  nitro3: `<img src="/badges/boost_3.png" width="22" height="22">`,
  nitro6: `<img src="/badges/boost_6.png" width="22" height="22">`,
  nitro12: `<img src="/badges/boost_12.png" width="22" height="22">`,
  nitro24: `<img src="/badges/boost_24.png" width="22" height="22">`,
  boost: `<img src="/badges/boost_1.png" width="22" height="22">`,
  staff: `<img src="/badges/staff.png" width="22" height="22">`,
  verified: `<img src="/badges/active_dev.png" width="22" height="22">`,
  nitro_bronze: `<img src="/badges/nitro_bronze.png" width="22" height="22">`,
  nitro_silver: `<img src="/badges/nitro_silver.png" width="22" height="22">`,
  nitro_gold: `<img src="/badges/nitro_gold.png" width="22" height="22">`,
  nitro_platinum: `<img src="/badges/nitro_platinum.png" width="22" height="22">`,
  nitro_diamond: `<img src="/badges/nitro_diamond.png" width="22" height="22">`,
  nitro_emerald: `<img src="/badges/nitro_emerald.png" width="22" height="22">`,
  nitro_ruby: `<img src="/badges/nitro_ruby.png" width="22" height="22">`,
  nitro_opal: `<img src="/badges/nitro_opal.png" width="22" height="22">`
};
const BADGE_NAMES = {
  owner: 'Propriétaire de l\'application',
  early_supporter: 'Soutien de la première heure',
  bot_developer: 'Développeur de bot certifié de la première heure',
  hypesquad: 'Événements HypeSquad',
  partner: 'Partenaire',
  moderator: 'Ancien des programmes de modération',
  bughunter: 'Chasseur de bugs',
  bughunter2: 'Chasseur de bugs niveau 2',
  nitro: 'Abonné Nitro',
  nitro1: 'Booster de serveurs depuis 1 mois',
  nitro2: 'Booster de serveurs depuis 2 mois',
  nitro9: 'Booster de serveurs depuis 9 mois',
  nitro15: 'Booster de serveurs depuis 15 mois',
  nitro18: 'Booster de serveurs depuis 18 mois',
  nitro3: 'Booster de serveurs depuis 3 mois',
  nitro6: 'Booster de serveurs depuis 6 mois',
  nitro12: 'Booster de serveurs depuis 12 mois',
  nitro24: 'Booster de serveurs depuis 24 mois',
  boost: 'Booster de serveurs',
  staff: 'Équipe Discord',
  verified: 'Développeur actif',
  nitro_bronze: 'Nitro Bronze',
  nitro_silver: 'Nitro Argent',
  nitro_gold: 'Nitro Or',
  nitro_platinum: 'Nitro Platine',
  nitro_diamond: 'Nitro Diamant',
  nitro_emerald: 'Nitro Émeraude',
  nitro_ruby: 'Nitro Rubis',
  nitro_opal: 'Nitro Opal'
};




// Discord-style badge tooltips
function bindBadgeTooltips(root) {
  (root || document).querySelectorAll('.badge[data-badge]').forEach(badge => {
    if (badge._tooltipBound) return;
    badge._tooltipBound = true;
    badge.addEventListener('mouseenter', (e) => showBadgeTooltip(e.currentTarget));
    badge.addEventListener('mouseleave', hideBadgeTooltip);
  });
}

function showBadgeTooltip(el) {
  hideBadgeTooltip();
  const id = el.dataset.badge;
  const name = BADGE_NAMES[id] || id;
  const icon = BADGE_ICONS[id] || '';
  const tip = document.createElement('div');
  tip.id = 'badge-tooltip';
  tip.className = 'badge-tooltip';
  tip.innerHTML = `<span class="badge-tooltip-icon">${icon}</span><span class="badge-tooltip-text">${name}</span>`;
  document.body.appendChild(tip);
  const rect = el.getBoundingClientRect();
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  let left = rect.left + rect.width / 2 - tw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  let top = rect.top - th - 10;
  if (top < 8) top = rect.bottom + 10;
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}

function hideBadgeTooltip() {
  document.getElementById('badge-tooltip')?.remove();
}

// Helper to build badge HTML with data-badge
function badgesHtml(badges) {
  return (badges || []).map(b =>
    `<span class="badge" data-badge="${b}">${BADGE_ICONS[b]||'🏅'}</span>`
  ).join('');
}

const DECO_URLS = {
  angry: '/decos/angry.png',
  ki: '/decos/ki.png',
  rage: '/decos/rage.png',
  phoenix: '/decos/phoenix.png',
  lotus: '/decos/lotus.png'
};
const EFFECT_URLS = {
  earthquake: '/effects/earthquake.png',
  sakura: '/effects/sakura.png',
  cyberpunk: '/effects/cyberpunk.png',
  mastery: '/effects/mastery.png',
  vortex: '/effects/vortex.png'
};

function applyAvatarDeco(el, deco) {
  if (!el) return;
  el.querySelectorAll('.avatar-deco-overlay').forEach(n => n.remove());
  if (el.parentElement) {
    el.parentElement.querySelectorAll(':scope > .avatar-deco-overlay').forEach(n => {
      if (n.parentElement === el.parentElement) n.remove();
    });
  }
  el.classList.remove('has-deco');
  if (!deco || deco === 'none' || !DECO_URLS[deco]) return;

  const img = document.createElement('img');
  img.className = 'avatar-deco-overlay';
  img.src = DECO_URLS[deco];
  img.alt = '';
  img.draggable = false;

  const isProfile = el.id === 'profile-avatar' || el.classList.contains('profile-avatar');
  const isMessage = el.classList.contains('message-avatar');
  const isMember = el.classList.contains('member-avatar');
  const isUser = el.classList.contains('user-avatar');

  el.classList.add('has-deco');
  el.style.position = 'relative';
  el.style.overflow = 'visible';

  // Size relative to avatar type (Discord-like: deco ~1.5x avatar)
  let size = '64px';
  if (isProfile) size = '120px';
  else if (isMessage) size = '60px';
  else if (isMember) size = '48px';
  else if (isUser) size = '52px';

  img.style.cssText = [
    'position:absolute',
    'left:50%',
    'top:50%',
    'transform:translate(-50%,-50%)',
    'width:' + size,
    'height:' + size,
    'max-width:none',
    'pointer-events:none',
    'z-index:2',
    'object-fit:contain'
  ].join(';');

  // Avatar image itself stays circular and under deco
  const innerImg = el.querySelector('img:not(.avatar-deco-overlay)');
  if (innerImg) {
    innerImg.style.borderRadius = '50%';
    innerImg.style.width = '100%';
    innerImg.style.height = '100%';
    innerImg.style.objectFit = 'cover';
    innerImg.style.position = 'relative';
    innerImg.style.zIndex = '1';
  }

  el.appendChild(img);
}




function applyProfileEffect(card, effect) {
  if (!card) return;
  card.className = 'profile-card';
  const oldFx = card.querySelector('.profile-effect-overlay');
  if (oldFx) oldFx.remove();
  if (!effect || effect === 'none' || !EFFECT_URLS[effect]) return;
  card.classList.add('effect-' + effect);
  const overlay = document.createElement('img');
  overlay.className = 'profile-effect-overlay';
  overlay.src = EFFECT_URLS[effect];
  overlay.alt = '';
  card.insertBefore(overlay, card.firstChild);
}


// DOM
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const channelsList = document.getElementById('channels-list');
const messagesList = document.getElementById('messages-list');
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const currentChannelName = document.getElementById('current-channel-name');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const membersList = document.getElementById('members-list');
const membersCount = document.getElementById('members-count');
const typingIndicator = document.getElementById('typing-indicator');

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const u = usernameInput.value.trim();
  if (u) socket.emit('join', u);
});

socket.on('init', data => {
  currentUser = data.user;
  onlineUsers = data.onlineUsers || [];
  availableBadges = data.availableBadges || [];
  friends = data.friends || [];
  friendRequests = data.friendRequests || [];
  guilds = data.guilds || [];
  currentGuild = data.currentGuild || (guilds[0] && guilds[0].id);
  currentChannel = (data.channels && data.channels[0] && data.channels[0].id) || currentChannel;
  loginScreen.classList.add('hidden');
  app.classList.remove('hidden');
  updateUserPanel();
  renderServers();
  renderChannels(data.channels || []);
  renderMessages(data.messages || []);
  renderMembers();
  renderFriends();
  if (typeof switchView === 'function') switchView('home');
  messageInput.focus();
  // Init boost UI (opacity selon Nitro)
  const g = guilds.find(gg => gg.id === currentGuild);
  updateBoostUI(g ? (g.boostCount || 0) : 0);
});

socket.on('channelMessages', data => {
  currentChannel = data.channelId;
  currentDM = null;
  lastMessageAuthor = null;
  renderMessages(data.messages || []);
  if (typeof updateChannelUI === 'function') updateChannelUI();
});

socket.on('dmMessages', data => {
  currentDM = data.targetUserId;
  currentChannel = null;
  lastMessageAuthor = null;
  renderMessages(data.messages || []);
  const target = onlineUsers.find(u => u.id === data.targetUserId) || friends.find(u => u.id === data.targetUserId);
  if (target) {
    currentChannelName.textContent = '@' + target.username;
    messageInput.placeholder = 'Message @' + target.username;
  }
});

socket.on('newMessage', msg => {
  // Si c'est notre propre message, on enlève les versions temporaires optimistes
  if (currentUser && msg.author && msg.author.id === currentUser.id) {
    document.querySelectorAll('.message[data-message-id^="temp_"]').forEach(el => {
      // Vérifie si le contenu correspond (évite de supprimer d'autres temps)
      const contentEl = el.querySelector('.message-content');
      if (contentEl && contentEl.textContent === msg.content) {
        el.remove();
      }
    });
  }
  if (currentDM && msg.channelId && msg.channelId.startsWith('dm_')) {
    // Évite le doublon exact si déjà présent
    if (!document.querySelector(`.message[data-message-id="${msg.id}"]`)) {
      appendMessage(msg); scrollToBottom();
    }
  } else if (!currentDM && msg.channelId === currentChannel) {
    if (!document.querySelector(`.message[data-message-id="${msg.id}"]`)) {
      appendMessage(msg); scrollToBottom();
    }
  }
});

socket.on('onlineUsers', users => {
  onlineUsers = users;
  const me = users.find(u => u.id === currentUser?.id);
  if (me) currentUser = me;
  renderMembers();
  updateUserPanel();
  renderFriends();
});

socket.on('userUpdated', user => {
  const i = onlineUsers.findIndex(u => u.id === user.id);
  if (i !== -1) onlineUsers[i] = user;
  if (currentUser?.id === user.id) {
    currentUser = user;
    updateUserPanel();
    // Refresh boost button state (Nitro or not)
    const g = guilds.find(gg => gg.id === currentGuild);
    updateBoostUI(g ? (g.boostCount || 0) : 0);
  }
  renderMembers();
  renderFriends();
});

socket.on('userTyping', data => {
  if (data.username !== currentUser?.username) {
    typingIndicator.textContent = data.username + " est en train d'écrire...";
    typingIndicator.classList.remove('hidden');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => typingIndicator.classList.add('hidden'), 3000);
  }
});

socket.on('friendRequest', req => {
  friendRequests.push(req);
  renderFriends();
  alert("Nouvelle demande d'ami de " + req.fromUsername);
});

socket.on('friendRequestSent', data => {
  alert("Demande d'ami envoyée à " + data.to);
});

socket.on('friendAdded', friend => {
  if (!friends.find(f => f.id === friend.id)) friends.push(friend);
  friendRequests = friendRequests.filter(r => r.fromId !== friend.id);
  renderFriends();
});

socket.on('friendRemoved', friendId => {
  friends = friends.filter(f => f.id !== friendId);
  renderFriends();
});


socket.on('guildUpdated', guild => {
  const i = guilds.findIndex(g => g.id === guild.id);
  if (i !== -1) guilds[i] = guild; else guilds.push(guild);
  if (currentGuild === guild.id) {
    renderChannels(guild.channels);
    const header = document.getElementById('server-header-name');
    if (header) header.textContent = guild.name;
    updateBoostUI(guild.boostCount || 0);
    renderServers();
    if (document.getElementById('server-settings-modal') && !document.getElementById('server-settings-modal').classList.contains('hidden')) {
      fillServerSettings();
    }
  }
});

socket.on('guildCreated', guild => {
  if (!guilds.find(g => g.id === guild.id)) guilds.push(guild);
  renderServers();
});

socket.on('guildJoined', data => {
  currentGuild = data.guild.id;
  if (!guilds.find(g => g.id === data.guild.id)) guilds.push(data.guild);
  currentChannel = data.channelId;
  currentDM = null;
  currentView = 'server';
  renderServers();
  renderChannels(data.channels || []);
  renderMessages(data.messages || []);
  switchView('server');
  const header = document.getElementById('server-header-name') || document.querySelector('#server-view .server-header h2');
  if (header) header.textContent = data.guild.name;
  if (typeof updateChannelUI === 'function') updateChannelUI();
});

socket.on('error', data => alert(data.message || 'Erreur'));

function updateUserPanel() {
  if (!currentUser) return;
  if (currentUser.avatarUrl) {
    userAvatar.innerHTML = '';
    userAvatar.style.background = 'transparent';
    const img = document.createElement('img');
    img.src = currentUser.avatarUrl;
    img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block';
    userAvatar.appendChild(img);
  } else {
    userAvatar.innerHTML = '';
    userAvatar.style.background = currentUser.avatarColor || '#5865f2';
    userAvatar.textContent = (currentUser.username || '?')[0].toUpperCase();
  }
  userName.textContent = currentUser.username;
  applyAvatarDeco(userAvatar, currentUser.avatarDeco);
}

function renderChannels(channels) {
  channelsList.innerHTML = '';
  const guild = guilds.find(g => g.id === currentGuild);
  const cats = (guild && guild.categories) || [];
  const chans = channels || (guild && guild.channels) || [];

  const byCat = {};
  chans.forEach(ch => {
    const cid = ch.categoryId || '_none';
    if (!byCat[cid]) byCat[cid] = [];
    byCat[cid].push(ch);
  });

  const hashSvg = `<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M5.88657 21C5.43619 21 5.05291 20.6919 4.96847 20.2497L3.10921 10.3679C3.05097 10.0575 3.16278 9.7413 3.4014 9.54224C3.64003 9.34317 3.97164 9.29167 4.25966 9.40967L7.5 10.75V6.5C7.5 5.67157 8.17157 5 9 5H15C15.8284 5 16.5 5.67157 16.5 6.5V10.75L19.7403 9.40967C20.0284 9.29167 20.36 9.34317 20.5986 9.54224C20.8372 9.7413 20.949 10.0575 20.8908 10.3679L19.0315 20.2497C18.9471 20.6919 18.5638 21 18.1134 21H5.88657ZM9 7V12.25L5.5 10.8L6.88657 19H17.1134L18.5 10.8L15 12.25V7H9Z"/></svg>`;

  const renderCh = (ch) => {
    const el = document.createElement('div');
    el.className = 'channel-item' + (ch.id === currentChannel && !currentDM ? ' active' : '');
    el.dataset.channel = ch.id;
    el.innerHTML = hashSvg + `<span>${escapeHtml(ch.name)}</span>`;
    el.onclick = () => { currentDM = null; socket.emit('joinChannel', ch.id); };
    channelsList.appendChild(el);
  };

  if (cats.length) {
    cats.forEach(cat => {
      const header = document.createElement('div');
      header.className = 'channels-header';
      header.innerHTML = `<span>${escapeHtml(cat.name).toUpperCase()}</span>`;
      channelsList.appendChild(header);
      (byCat[cat.id] || []).forEach(renderCh);
    });
    (byCat['_none'] || []).forEach(renderCh);
  } else {
    chans.forEach(renderCh);
  }
}


function updateChannelUI() {
  document.querySelectorAll('.channel-item').forEach(el => {
    el.classList.toggle('active', el.dataset.channel === currentChannel && !currentDM);
  });
  let name = currentChannel;
  const chEl = document.querySelector('.channel-item.active span');
  if (chEl) name = chEl.textContent;
  else if (currentChannel && currentChannel.includes('_')) name = currentChannel.split('_').pop();
  currentChannelName.textContent = name;
  messageInput.placeholder = 'Envoyer un message dans #' + name;
  const w1 = document.getElementById('welcome-channel');
  const w2 = document.getElementById('welcome-channel-2');
  if (w1) w1.textContent = name;
  if (w2) w2.textContent = name;
}

function renderMessages(msgs) {
  messagesList.innerHTML = '';
  lastMessageAuthor = null;
  msgs.forEach(m => appendMessage(m));
  scrollToBottom();
}


const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','🔥','🎉','👀','✅','❌','⭐','💯','🙏','💀','✨','🎮'];

function renderReactionsHtml(reactions, messageId) {
  if (!reactions || !Object.keys(reactions).length) return '';
  return Object.entries(reactions).map(([emoji, users]) => {
    const count = Array.isArray(users) ? users.length : 0;
    if (!count) return '';
    const mine = currentUser && Array.isArray(users) && users.includes(currentUser.id);
    return `<button class="reaction-chip${mine ? ' mine' : ''}" data-emoji="${emoji}" data-mid="${messageId}">${emoji} <span>${count}</span></button>`;
  }).join('');
}

function openReactionPicker(messageId, anchor) {
  let picker = document.getElementById('reaction-picker');
  if (picker) picker.remove();
  picker = document.createElement('div');
  picker.id = 'reaction-picker';
  picker.className = 'reaction-picker';
  picker.innerHTML = QUICK_EMOJIS.map(e => `<button type="button" data-emoji="${e}">${e}</button>`).join('');
  document.body.appendChild(picker);
  const rect = anchor.getBoundingClientRect();
  picker.style.left = Math.min(rect.left, window.innerWidth - 280) + 'px';
  picker.style.top = (rect.top - 48) + 'px';
  picker.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      socket.emit('addReaction', {
        messageId,
        emoji: btn.dataset.emoji,
        channelId: currentDM ? null : currentChannel
      });
      picker.remove();
    };
  });
  const close = (ev) => {
    if (!picker.contains(ev.target) && ev.target !== anchor) {
      picker.remove();
      document.removeEventListener('click', close);
    }
  };
  setTimeout(() => document.addEventListener('click', close), 0);
}

socket.on('reactionUpdate', (data) => {
  const el = document.querySelector(`.message[data-message-id="${data.messageId}"]`);
  if (!el) return;
  const box = el.querySelector('.message-reactions');
  if (!box) return;
  box.innerHTML = renderReactionsHtml(data.reactions || {}, data.messageId);
  box.querySelectorAll('.reaction-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      socket.emit('addReaction', {
        messageId: data.messageId,
        emoji: chip.dataset.emoji,
        channelId: data.channelId || currentChannel
      });
    });
  });
});


function appendMessage(message) {
  const isGrouped = lastMessageAuthor === message.author.id;
  lastMessageAuthor = message.author.id;
  const el = document.createElement('div');
  el.className = 'message' + (isGrouped ? ' grouped' : '');
  el.dataset.messageId = message.id;
  const time = new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const badgesStr = badgesHtml(message.author.badges);
  const reactionsHtml = renderReactionsHtml(message.reactions || {}, message.id);
  const bg = message.author.avatarUrl ? 'transparent' : (message.author.avatarColor || '#5865f2');
  el.innerHTML = `
    <div class="message-avatar" style="background:${bg}" data-uid="${message.author.id}"></div>
    <div class="message-body">
      <div class="message-header">
        <span class="message-author" data-uid="${message.author.id}">${escapeHtml(message.author.username)}</span>
        <span class="message-badges">${badgesStr}</span>
        <span class="message-timestamp">${time}</span>
      </div>
      <div class="message-content">${escapeHtml(message.content)}</div>
      <div class="message-reactions" data-mid="${message.id}">${reactionsHtml}</div>
    </div>
    <button class="msg-react-btn" title="Ajouter une réaction" data-mid="${message.id}">😊</button>`;
  const avEl = el.querySelector('.message-avatar');
  if (message.author.avatarUrl) {
    const img = document.createElement('img');
    img.src = message.author.avatarUrl;
    img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block';
    avEl.appendChild(img);
  } else {
    avEl.textContent = (message.author.username || '?')[0].toUpperCase();
  }
  avEl?.addEventListener('click', () => openProfile(message.author.id));
  el.querySelector('.message-author')?.addEventListener('click', () => openProfile(message.author.id));
  el.querySelector('.msg-react-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openReactionPicker(message.id, e.currentTarget);
  });
  el.querySelectorAll('.reaction-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      socket.emit('addReaction', { messageId: message.id, emoji: chip.dataset.emoji, channelId: message.channelId || currentChannel });
    });
  });
  messagesList.appendChild(el);
  applyAvatarDeco(avEl, message.author.avatarDeco);
  bindBadgeTooltips(el);
}


function renderMembers() {
  membersList.innerHTML = '';
  membersCount.textContent = onlineUsers.length;
  onlineUsers.forEach(user => {
    const el = document.createElement('div');
    el.className = 'member-item';
    const badgesStr = badgesHtml((user.badges || []).slice(0, 4));
    el.innerHTML = `
      <div class="member-avatar" style="background:${user.avatarUrl ? 'transparent' : (user.avatarColor||'#5865f2')}"></div>
      <div class="member-info">
        <div class="member-name-row">
          <span class="member-name">${escapeHtml(user.username)}</span>
          <span class="member-badges">${badgesStr}</span>
        </div>
        ${user.customStatus ? `<div class="member-status">${escapeHtml(user.customStatus)}</div>` : ''}
      </div>`;
    const avEl = el.querySelector('.member-avatar');
    if (user.avatarUrl) {
      const img = document.createElement('img');
      img.src = user.avatarUrl;
      img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block';
      avEl.appendChild(img);
    } else {
      avEl.textContent = (user.username || '?')[0].toUpperCase();
    }
    el.onclick = () => openProfile(user.id);
    membersList.appendChild(el);
    applyAvatarDeco(avEl, user.avatarDeco);
    bindBadgeTooltips(el);
  });
}

function renderFriends() {
  const list = document.getElementById('friends-list');
  const dmList = document.getElementById('dm-list');
  const reqList = document.getElementById('friend-requests-list');

  if (list) {
    list.innerHTML = '';
    friends.forEach(f => {
      const el = document.createElement('div');
      el.className = 'channel-item' + (currentDM === f.id ? ' active' : '');
      const av = f.avatarUrl
        ? `<img src="${esc(f.avatarUrl)}" style="width:24px;height:24px;border-radius:50%;object-fit:cover">`
        : `<span style="width:24px;height:24px;border-radius:50%;background:${f.avatarColor||'#5865f2'};display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:white;flex-shrink:0">${f.username[0].toUpperCase()}</span>`;
      el.innerHTML = `${av}<span>${escapeHtml(f.username)}</span>`;
      el.onclick = () => openDM(f.id);
      list.appendChild(el);
    });
    if (!friends.length) {
      list.innerHTML = '<div style="padding:8px;color:#949ba4;font-size:13px">Aucun ami pour le moment</div>';
    }
  }

  if (dmList) {
    dmList.innerHTML = '';
    friends.forEach(f => {
      const el = document.createElement('div');
      el.className = 'channel-item' + (currentDM === f.id ? ' active' : '');
      const av = f.avatarUrl
        ? `<img src="${esc(f.avatarUrl)}" style="width:24px;height:24px;border-radius:50%;object-fit:cover">`
        : `<span style="width:24px;height:24px;border-radius:50%;background:${f.avatarColor||'#5865f2'};display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:white;flex-shrink:0">${f.username[0].toUpperCase()}</span>`;
      el.innerHTML = `${av}<span>${escapeHtml(f.username)}</span>`;
      el.onclick = () => openDM(f.id);
      dmList.appendChild(el);
    });
    if (!friends.length) {
      dmList.innerHTML = '<div style="padding:8px;color:#949ba4;font-size:13px">Ajoute des amis pour discuter en privé</div>';
    }
  }

  if (reqList) {
    reqList.innerHTML = friendRequests.length ? '<div class="channels-header" style="margin-top:8px"><span>DEMANDES EN ATTENTE</span></div>' : '';
    friendRequests.forEach(r => {
      const el = document.createElement('div');
      el.style.cssText = 'padding:8px;font-size:13px;color:#dbdee1';
      el.innerHTML = `<div style="margin-bottom:4px">${escapeHtml(r.fromUsername)}</div>
        <button data-accept="${r.fromId}" style="margin-right:4px;padding:4px 10px;background:#23a559;border:none;border-radius:3px;color:white;cursor:pointer">Accepter</button>
        <button data-decline="${r.fromId}" style="padding:4px 10px;background:#f23f43;border:none;border-radius:3px;color:white;cursor:pointer">Refuser</button>`;
      el.querySelector('[data-accept]')?.addEventListener('click', () => socket.emit('acceptFriendRequest', r.fromId));
      el.querySelector('[data-decline]')?.addEventListener('click', () => {
        socket.emit('declineFriendRequest', r.fromId);
        friendRequests = friendRequests.filter(x => x.fromId !== r.fromId);
        renderFriends();
      });
      reqList.appendChild(el);
    });
  }

  // Wire add friend button once
  const addBtn = document.getElementById('add-friend-btn');
  const addInput = document.getElementById('add-friend-input');
  if (addBtn && !addBtn.dataset.wired) {
    addBtn.dataset.wired = '1';
    addBtn.onclick = () => {
      const name = addInput.value.trim();
      if (name) { socket.emit('sendFriendRequest', name); addInput.value = ''; }
    };
  }
}

function openDM(userId) {
  currentDM = userId;
  socket.emit('joinDM', userId);
}

function scrollToBottom() { messagesContainer.scrollTop = messagesContainer.scrollHeight; }
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function esc(t) { return String(t).replace(/"/g,'&quot;'); }

// Profile
function openProfile(userId) {
  const user = onlineUsers.find(u => u.id === userId) || friends.find(u => u.id === userId);
  if (!user) return;
  const modal = document.getElementById('profile-modal');
  const banner = document.getElementById('profile-banner');
  const avatar = document.getElementById('profile-avatar');
  const uname = document.getElementById('profile-username');
  const handle = document.getElementById('profile-handle');
  const badges = document.getElementById('profile-badges');
  const status = document.getElementById('profile-status');
  const about = document.getElementById('profile-about');
  const memberSince = document.getElementById('profile-member-since');
  const actions = document.getElementById('profile-actions');

  if (user.bannerUrl) {
    // Quotes required for data: URLs (base64)
    banner.style.backgroundImage = `url("${String(user.bannerUrl).replace(/"/g, '%22')}")`;
    banner.style.backgroundColor = 'transparent';
  } else {
    banner.style.backgroundImage = 'none';
    banner.style.backgroundColor = user.avatarColor || '#5865f2';
  }

  if (user.avatarUrl) {
    avatar.innerHTML = '';
    avatar.style.background = 'transparent';
    const img = document.createElement('img');
    img.src = user.avatarUrl;
    img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block';
    avatar.appendChild(img);
  } else {
    avatar.innerHTML = '';
    avatar.style.background = user.avatarColor || '#5865f2';
    avatar.textContent = (user.username || '?')[0].toUpperCase();
  }

  uname.textContent = user.username;
  if (handle) handle.textContent = user.username.toLowerCase().replace(/\s/g,'') + ' • en ligne';
  badges.innerHTML = badgesHtml(user.badges);
  bindBadgeTooltips(badges);
  status.textContent = user.customStatus || 'Pas de statut personnalisé';
  if (about) about.innerHTML = user.customStatus
    ? escapeHtml(user.customStatus)
    : 'Aucune bio pour le moment.';
  if (memberSince) {
    const d = user.createdAt ? new Date(user.createdAt) : new Date();
    memberSince.textContent = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const createdEdit = document.getElementById('profile-created-edit');
  const createdInput = document.getElementById('profile-created-input');
  if (createdEdit && createdInput) {
    if (currentUser && currentUser.isOwner) {
      createdEdit.classList.remove('hidden');
      createdEdit.style.display = 'flex';
      const d = user.createdAt ? new Date(user.createdAt) : new Date();
      createdInput.value = d.toISOString().slice(0, 10);
      createdEdit.dataset.userId = user.id;
    } else {
      createdEdit.classList.add('hidden');
      createdEdit.style.display = 'none';
    }
  }

  actions.innerHTML = '';
  if (currentUser?.id === user.id) {
    const btn = document.createElement('button');
    btn.textContent = '✏️ Modifier le profil';
    btn.onclick = () => { closeProfile(); openEditProfile(); };
    actions.appendChild(btn);
  } else {
    const dmBtn = document.createElement('button');
    dmBtn.textContent = '💬 Envoyer un message';
    dmBtn.onclick = () => { closeProfile(); openDM(user.id); };
    actions.appendChild(dmBtn);
    if (!friends.find(f => f.id === user.id)) {
      const frBtn = document.createElement('button');
      frBtn.textContent = '➕ Ajouter en ami';
      frBtn.onclick = () => { socket.emit('sendFriendRequest', user.username); closeProfile(); };
      actions.appendChild(frBtn);
    }
  }
  if (currentUser?.isOwner) {
    const bBtn = document.createElement('button');
    bBtn.textContent = '🏅 Gérer les badges';
    bBtn.onclick = () => { closeProfile(); openBadgesManager(user); };
    actions.appendChild(bBtn);
  }
  if (currentUser?.id === user.id || currentUser?.isOwner) {
    const oBtn = document.createElement('button');
    oBtn.textContent = '↕️ Ordre des badges';
    oBtn.onclick = () => { closeProfile(); openBadgesManager(user); };
    actions.appendChild(oBtn);
  }
  const card = modal.querySelector('.profile-card');
  applyProfileEffect(card, user.profileEffect);
  // Apply deco after layout so size is correct
  requestAnimationFrame(() => {
    applyAvatarDeco(avatar, user.avatarDeco);
  });
  modal.classList.remove('hidden');
}

function closeProfile() { document.getElementById('profile-modal').classList.add('hidden'); }
document.getElementById('profile-overlay')?.addEventListener('click', closeProfile);

// ===== Upload helpers (avatar / bannière en fichier local) =====
let pendingEditAvatar = null;   // dataURL or null (null = keep current, '' = clear)
let pendingEditBanner = null;
let pendingSettingsAvatar = null;
let pendingSettingsBanner = null;

function setPreview(elId, dataUrl) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (dataUrl) {
    el.innerHTML = `<img src="${dataUrl}" alt="">`;
    el.style.backgroundImage = '';
  } else {
    el.innerHTML = '';
    el.style.backgroundImage = '';
  }
}

function readFileAsDataURL(file, maxSizeMB = 2) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Fichier image requis'));
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      reject(new Error('Image trop lourde (max ' + maxSizeMB + ' Mo)'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erreur de lecture'));
    reader.readAsDataURL(file);
  });
}

function wireUpload(btnId, fileId, previewId, onData) {
  const btn = document.getElementById(btnId);
  const fileInput = document.getElementById(fileId);
  if (!btn || !fileInput) return;
  btn.onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      onData(dataUrl);
      setPreview(previewId, dataUrl);
    } catch (err) {
      alert(err.message || 'Impossible de charger l\'image');
    }
    fileInput.value = '';
  };
}

function openEditProfile() {
  pendingEditAvatar = undefined; // undefined = keep existing
  pendingEditBanner = undefined;
  document.getElementById('edit-status').value = currentUser.customStatus || '';
  setPreview('edit-avatar-preview', currentUser.avatarUrl || null);
  setPreview('edit-banner-preview', currentUser.bannerUrl || null);
  // Add username field if missing
  let unameField = document.getElementById('edit-username');
  if (!unameField) {
    const card = document.querySelector('#edit-profile-modal .edit-card');
    const label = document.createElement('label');
    label.textContent = 'Nom d\'utilisateur';
    unameField = document.createElement('input');
    unameField.type = 'text';
    unameField.id = 'edit-username';
    unameField.maxLength = 32;
    const firstLabel = card.querySelector('label');
    card.insertBefore(label, firstLabel);
    card.insertBefore(unameField, firstLabel);
  }
  unameField.value = currentUser.username || '';
  document.getElementById('edit-profile-modal').classList.remove('hidden');
}
function closeEditProfile() { document.getElementById('edit-profile-modal').classList.add('hidden'); }
document.getElementById('edit-overlay')?.addEventListener('click', closeEditProfile);
document.getElementById('edit-cancel')?.addEventListener('click', closeEditProfile);
document.getElementById('edit-save')?.addEventListener('click', () => {
  const payload = {
    customStatus: document.getElementById('edit-status').value.trim(),
    username: document.getElementById('edit-username')?.value.trim()
  };
  if (pendingEditAvatar !== undefined) payload.avatarUrl = pendingEditAvatar || null;
  if (pendingEditBanner !== undefined) payload.bannerUrl = pendingEditBanner || null;
  socket.emit('updateProfile', payload);
  closeEditProfile();
});

// Wire edit modal uploads
wireUpload('edit-avatar-btn', 'edit-avatar-file', 'edit-avatar-preview', (d) => { pendingEditAvatar = d; });
wireUpload('edit-banner-btn', 'edit-banner-file', 'edit-banner-preview', (d) => { pendingEditBanner = d; });
document.getElementById('edit-avatar-clear')?.addEventListener('click', () => {
  pendingEditAvatar = null;
  setPreview('edit-avatar-preview', null);
});
document.getElementById('edit-banner-clear')?.addEventListener('click', () => {
  pendingEditBanner = null;
  setPreview('edit-banner-preview', null);
});

function openBadgesManager(user) {
  selectedUserForBadges = user;
  const nameEl = document.getElementById('badges-target-name');
  if (nameEl) nameEl.textContent = user.username;
  const box = document.getElementById('badges-checkboxes');
  if (!box) return;
  box.innerHTML = '';

  const allIds = Object.keys(BADGE_ICONS);
  const fromServer = (availableBadges || []).map(b => (b && b.id) ? b.id : b).filter(Boolean);
  const all = [...new Set([...allIds, ...fromServer])];

  const ordered = [];
  const seen = new Set();
  (user.badges || []).forEach(id => {
    if (id && !seen.has(id)) { ordered.push(id); seen.add(id); }
  });
  all.forEach(id => {
    if (id && !seen.has(id)) { ordered.push(id); seen.add(id); }
  });

  const hint = document.createElement('p');
  hint.style.cssText = 'color:#b5bac1;font-size:13px;margin:0 0 12px;grid-column:1/-1';
  hint.textContent = 'Coche les badges. Utilise ▲ ▼ pour changer l\'ordre.';
  box.appendChild(hint);

  function moveBadge(id, dir) {
    const items = [...box.querySelectorAll('.badge-check')];
    const idx = items.findIndex(el => el.dataset.id === id);
    if (idx < 0) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= items.length) return;
    const a = items[idx];
    const b = items[swap];
    if (dir < 0) box.insertBefore(a, b);
    else box.insertBefore(b, a);
  }

  ordered.forEach(id => {
    const name = BADGE_NAMES[id] || id;
    const checked = (user.badges || []).includes(id);
    const row = document.createElement('div');
    row.className = 'badge-check';
    row.dataset.id = id;
    row.innerHTML =
      '<button type="button" class="badge-move-up" title="Monter">▲</button>' +
      '<button type="button" class="badge-move-down" title="Descendre">▼</button>' +
      '<input type="checkbox" value="' + id + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="badge-check-label">' + (BADGE_ICONS[id] || '🏅') + ' ' + name + '</span>';
    row.querySelector('.badge-move-up').onclick = (e) => { e.preventDefault(); e.stopPropagation(); moveBadge(id, -1); };
    row.querySelector('.badge-move-down').onclick = (e) => { e.preventDefault(); e.stopPropagation(); moveBadge(id, 1); };
    box.appendChild(row);
  });

  document.getElementById('badges-modal').classList.remove('hidden');
}

function closeBadgesManager() { document.getElementById('badges-modal').classList.add('hidden'); selectedUserForBadges = null; }
document.getElementById('badges-overlay')?.addEventListener('click', closeBadgesManager);
document.getElementById('badges-cancel')?.addEventListener('click', closeBadgesManager);
document.getElementById('badges-save')?.addEventListener('click', () => {
  if (!selectedUserForBadges) return;
  // Order = DOM order of checked boxes
  const checked = [...document.querySelectorAll('#badges-checkboxes .badge-check')]
    .filter(l => l.querySelector('input')?.checked)
    .map(l => l.dataset.id || l.querySelector('input').value);
  if (currentUser?.isOwner) {
    socket.emit('setBadges', { userId: selectedUserForBadges.id, badges: checked });
  } else {
    socket.emit('reorderBadges', { userId: selectedUserForBadges.id, badges: checked });
  }
  closeBadgesManager();
});

userAvatar?.addEventListener('click', () => currentUser && openProfile(currentUser.id));
userName?.addEventListener('click', () => currentUser && openProfile(currentUser.id));

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const content = messageInput.value.trim();
  if (!content) return;
  // Optimistic: affiche le message immédiatement pour éviter qu'il "disparaisse"
  if (currentUser) {
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const optimisticMsg = {
      id: tempId,
      content,
      author: currentUser,
      timestamp: new Date().toISOString(),
      channelId: currentDM ? ('dm_' + [currentUser.id, currentDM].sort().join('_')) : currentChannel,
      _temp: true
    };
    appendMessage(optimisticMsg);
    scrollToBottom();
  }
  if (currentDM) {
    socket.emit('sendMessage', { content, dmTargetId: currentDM });
  } else {
    socket.emit('sendMessage', { content, channelId: currentChannel });
  }
  messageInput.value = '';
});
messageInput.addEventListener('input', () => {
  // Empêche le spam de typing events
  if (messageInput._typingTimer) return;
  messageInput._typingTimer = setTimeout(() => { messageInput._typingTimer = null; }, 800);
  socket.emit('typing', { channelId: currentDM ? 'dm_'+currentDM : currentChannel });
});


// ===== VIEW SWITCHING (Home = DMs, Server = channels) =====

function renderServers() {
  const list = document.getElementById('servers-list');
  if (!list) return;
  list.innerHTML = '';
  guilds.forEach(g => {
    const el = document.createElement('div');
    el.className = 'server-icon' + (g.id === currentGuild && currentView === 'server' ? ' active' : '');
    el.title = g.name;
    el.innerHTML = '<span>' + escapeHtml((g.icon || g.name[0] || 'S').toString().substring(0, 2)) + '</span>';
    el.onclick = () => {
      currentGuild = g.id;
      socket.emit('joinGuild', g.id);
      switchView('server');
      renderServers();
    };
    list.appendChild(el);
  });
}

function switchView(view) {
  currentView = view;
  const homeView = document.getElementById('home-view');
  const serverView = document.getElementById('server-view');
  const homeBtn = document.getElementById('home-btn');
  const serverBtn = document.getElementById('server-btn');
  const membersSidebar = document.querySelector('.members-sidebar');

  if (view === 'home') {
    homeView?.classList.remove('hidden');
    serverView?.classList.add('hidden');
    homeBtn?.classList.add('active');
    serverBtn?.classList.remove('active');
    if (membersSidebar) membersSidebar.style.display = 'none';
    currentChannelName.textContent = 'Amis';
    messageInput.placeholder = 'Sélectionne un ami pour discuter...';
    if (!currentDM) {
      messagesList.innerHTML = '<div style="padding:40px;text-align:center;color:#949ba4"><h3 style="color:#f2f3f5;margin-bottom:8px">Messages privés</h3><p>Choisis un ami à gauche pour commencer une conversation.</p></div>';
    }
    renderFriends();
  } else {
    homeView?.classList.add('hidden');
    serverView?.classList.remove('hidden');
    homeBtn?.classList.remove('active');
    serverBtn?.classList.add('active');
    if (membersSidebar) membersSidebar.style.display = '';
    currentDM = null;
    if (currentChannel) {
      socket.emit('joinChannel', currentChannel);
    } else {
      socket.emit('joinChannel', 'general');
    }
  }
}

document.getElementById('home-btn')?.addEventListener('click', () => switchView('home'));
document.getElementById('server-btn')?.addEventListener('click', () => switchView('server'));

// Open DM also switches to home view
const _openDM = openDM;
openDM = function(userId) {
  switchView('home');
  currentDM = userId;
  socket.emit('joinDM', userId);
};


// ===== SETTINGS =====
function openSettings() {
  if (!currentUser) return;
  pendingSettingsAvatar = undefined;
  pendingSettingsBanner = undefined;
  document.getElementById('settings-username').value = currentUser.username || '';
  document.getElementById('settings-email').value = localStorage.getItem('zeyscord_email') || '';
  document.getElementById('settings-bio').value = currentUser.customStatus || '';
  setPreview('settings-avatar-preview', currentUser.avatarUrl || null);
  setPreview('settings-banner-preview', currentUser.bannerUrl || null);
  selectedDeco = currentUser.avatarDeco || 'none';
  selectedEffect = currentUser.profileEffect || 'none';
  document.querySelectorAll('.deco-option').forEach(o => {
    o.classList.toggle('active', o.dataset.deco === selectedDeco);
  });
  document.querySelectorAll('.effect-option').forEach(o => {
    o.classList.toggle('active', o.dataset.effect === selectedEffect);
  });
  refreshDecoOptionsInSettings();
  document.getElementById('settings-modal').classList.remove('hidden');
}
function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}

document.getElementById('settings-overlay')?.addEventListener('click', closeSettings);
document.getElementById('settings-close')?.addEventListener('click', closeSettings);

// Wire gear button in user panel
document.querySelectorAll('.user-controls button').forEach((btn, i) => {
  if (i === 1 || (btn.getAttribute('title') || '').toLowerCase().includes('param')) {
    btn.addEventListener('click', openSettings);
  }
});

// Tabs
document.querySelectorAll('.settings-nav-item[data-tab]').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.settings-nav-item').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.settings-tab').forEach(x => x.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('tab-' + item.dataset.tab)?.classList.add('active');
  });
});

document.getElementById('save-account')?.addEventListener('click', () => {
  const username = document.getElementById('settings-username').value.trim();
  const email = document.getElementById('settings-email').value.trim();
  if (email) localStorage.setItem('zeyscord_email', email);
  socket.emit('updateProfile', { username });
  alert('Compte mis à jour');
});

let selectedDeco = 'none';
let selectedEffect = 'none';
document.querySelectorAll('.deco-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.deco-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    selectedDeco = opt.dataset.deco;
  });
});
document.querySelectorAll('.effect-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.effect-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    selectedEffect = opt.dataset.effect;
  });
});

document.getElementById('save-profile')?.addEventListener('click', () => {
  const payload = {
    customStatus: document.getElementById('settings-bio').value.trim(),
    avatarDeco: selectedDeco,
    profileEffect: selectedEffect
  };
  if (pendingSettingsAvatar !== undefined) payload.avatarUrl = pendingSettingsAvatar || null;
  if (pendingSettingsBanner !== undefined) payload.bannerUrl = pendingSettingsBanner || null;
  socket.emit('updateProfile', payload);
  alert('Profil mis à jour');
});

// Wire settings uploads
wireUpload('settings-avatar-btn', 'settings-avatar-file', 'settings-avatar-preview', (d) => { pendingSettingsAvatar = d; });
wireUpload('settings-banner-btn', 'settings-banner-file', 'settings-banner-preview', (d) => { pendingSettingsBanner = d; });
document.getElementById('settings-avatar-clear')?.addEventListener('click', () => {
  pendingSettingsAvatar = null;
  setPreview('settings-avatar-preview', null);
});
document.getElementById('settings-banner-clear')?.addEventListener('click', () => {
  pendingSettingsBanner = null;
  setPreview('settings-banner-preview', null);
});

document.getElementById('save-appearance')?.addEventListener('click', () => {
  const theme = document.getElementById('settings-theme').value;
  const fontSize = document.getElementById('settings-font-size').value;
  document.documentElement.style.setProperty('--msg-font', fontSize + 'px');
  document.body.style.fontSize = fontSize + 'px';
  if (theme === 'darker') {
    document.documentElement.style.setProperty('--bg-primary', '#1e1f22');
    document.documentElement.style.setProperty('--bg-secondary', '#111214');
  } else if (theme === 'blue') {
    document.documentElement.style.setProperty('--bg-primary', '#2c2f33');
    document.documentElement.style.setProperty('--bg-secondary', '#23272a');
  } else {
    document.documentElement.style.setProperty('--bg-primary', '#313338');
    document.documentElement.style.setProperty('--bg-secondary', '#2b2d31');
  }
  localStorage.setItem('zeyscord_theme', theme);
  localStorage.setItem('zeyscord_font', fontSize);
  alert('Apparence appliquée');
});

document.getElementById('save-notifications')?.addEventListener('click', () => {
  localStorage.setItem('zeyscord_notif_messages', document.getElementById('notif-messages').checked);
  localStorage.setItem('zeyscord_notif_friends', document.getElementById('notif-friends').checked);
  localStorage.setItem('zeyscord_notif_sounds', document.getElementById('notif-sounds').checked);
  alert('Notifications enregistrées');
});

document.getElementById('save-privacy')?.addEventListener('click', () => {
  localStorage.setItem('zeyscord_privacy_dm', document.getElementById('privacy-dm').checked);
  localStorage.setItem('zeyscord_privacy_online', document.getElementById('privacy-online').checked);
  localStorage.setItem('zeyscord_privacy_requests', document.getElementById('privacy-requests').checked);
  alert('Confidentialité enregistrée');
});

document.getElementById('settings-logout')?.addEventListener('click', () => {
  if (confirm('Se déconnecter ?')) location.reload();
});

// Restore appearance on load
(function restoreAppearance() {
  const theme = localStorage.getItem('zeyscord_theme');
  const font = localStorage.getItem('zeyscord_font');
  if (font) document.body.style.fontSize = font + 'px';
  if (theme === 'darker') {
    document.documentElement.style.setProperty('--bg-primary', '#1e1f22');
    document.documentElement.style.setProperty('--bg-secondary', '#111214');
  } else if (theme === 'blue') {
    document.documentElement.style.setProperty('--bg-primary', '#2c2f33');
    document.documentElement.style.setProperty('--bg-secondary', '#23272a');
  }
})();


// ===== SHOP & OWNED DECOS =====
const SHOP_DECOS = [
  { id: 'angry', name: 'En colère', img: '/decos/angry.png', price: 0, type: 'deco' },
  { id: 'ki', name: 'Le Ki', img: '/decos/ki.png', price: 0, type: 'deco' },
  { id: 'rage', name: 'Rage', img: '/decos/rage.png', price: 0, type: 'deco' },
  { id: 'phoenix', name: 'Phoenix', img: '/decos/phoenix.png', price: 0, type: 'deco' },
  { id: 'lotus', name: 'Lotus', img: '/decos/lotus.png', price: 0, type: 'deco' }
];
const SHOP_EFFECTS = [
  { id: 'earthquake', name: 'Séisme', img: '/effects/earthquake.png', price: 0, type: 'effect' },
  { id: 'sakura', name: 'Sakura', img: '/effects/sakura.png', price: 0, type: 'effect' },
  { id: 'cyberpunk', name: 'Cyberpunk', img: '/effects/cyberpunk.png', price: 0, type: 'effect' },
  { id: 'mastery', name: 'Mastery', img: '/effects/mastery.png', price: 0, type: 'effect' },
  { id: 'vortex', name: 'Vortex', img: '/effects/vortex.png', price: 0, type: 'effect' }
];
const SHOP_NITRO = [
  { id: 'nitro', name: 'Nitro', img: '/badges/nitro.png', price: 0, type: 'nitro', desc: 'Badge Nitro + avantages' }
];
const SHOP_ITEMS = [...SHOP_DECOS, ...SHOP_EFFECTS, ...SHOP_NITRO];

function shopUserKey() {
  const u = (currentUser && currentUser.username) ? currentUser.username.toLowerCase() : (localStorage.getItem('zeyscord_username') || 'guest').toLowerCase();
  return u;
}
function shopGet(kind) {
  try {
    const all = JSON.parse(localStorage.getItem('zeyscord_shop_by_user') || '{}');
    const user = all[shopUserKey()] || { decos: [], effects: [], nitro: [] };
    return user[kind] || [];
  } catch { return []; }
}
function shopSet(kind, list) {
  try {
    const all = JSON.parse(localStorage.getItem('zeyscord_shop_by_user') || '{}');
    const key = shopUserKey();
    if (!all[key]) all[key] = { decos: [], effects: [], nitro: [] };
    all[key][kind] = list;
    localStorage.setItem('zeyscord_shop_by_user', JSON.stringify(all));
  } catch (_) {}
}
function getOwnedDecos() { return shopGet('decos'); }
function setOwnedDecos(list) { shopSet('decos', list); }
function ownDeco(id) {
  const list = getOwnedDecos();
  if (!list.includes(id)) {
    list.push(id);
    setOwnedDecos(list);
  }
}
function getOwnedEffects() { return shopGet('effects'); }
function setOwnedEffects(list) { shopSet('effects', list); }
function getOwnedNitro() { return shopGet('nitro'); }
function ownNitro() {
  shopSet('nitro', ['nitro']);
  // Equip badge immediately
  const badges = [...(currentUser.badges || [])];
  if (!badges.includes('nitro')) badges.push('nitro');
  currentUser.badges = badges;
  currentUser.hasNitro = true;
  socket.emit('updateProfile', { hasNitro: true });
  updateUserPanel();
  renderMembers();
}
function ownEffect(id) {
  const list = getOwnedEffects();
  if (!list.includes(id)) {
    list.push(id);
    setOwnedEffects(list);
  }
}


function openShop() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const ownedD = getOwnedDecos();
  const ownedE = getOwnedEffects();
  grid.innerHTML = '';

  const section = (title) => {
    const h = document.createElement('div');
    h.className = 'shop-section-title';
    h.textContent = title;
    grid.appendChild(h);
  };

  const addItem = (item, owned, onBuy) => {
    const isOwned = owned.includes(item.id);
    const el = document.createElement('div');
    el.className = 'shop-item' + (isOwned ? ' owned' : '');
    el.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-price">${item.price === 0 ? 'Gratuit' : item.price + ' ZC'}</div>
      <button class="shop-item-btn${isOwned ? ' owned' : ''}" data-id="${item.id}">
        ${isOwned ? 'Possédé ✓' : 'Obtenir'}
      </button>`;
    const btn = el.querySelector('button');
    if (!isOwned) btn.onclick = () => onBuy(item);
    grid.appendChild(el);
  };

  section("Décorations d'avatar");
  SHOP_DECOS.forEach(item => addItem(item, ownedD, (it) => {
    ownDeco(it.id);
    openShop();
    alert("« " + it.name + " » ajoutée ! Paramètres → Profil pour l'équiper.");
  }));

  section('Effets de profil');
  SHOP_EFFECTS.forEach(item => addItem(item, ownedE, (it) => {
    ownEffect(it.id);
    openShop();
    alert("« " + it.name + " » ajouté ! Paramètres → Profil pour l'équiper.");
  }));

  section('Nitro');
  const ownedN = getOwnedNitro();
  SHOP_NITRO.forEach(item => addItem(item, ownedN, (it) => {
    ownNitro();
    openShop();
    alert("Nitro activé ! Badge équipé automatiquement.");
  }));

  document.getElementById('shop-modal').classList.remove('hidden');
}

function closeShop() {
  document.getElementById('shop-modal').classList.add('hidden');
}
document.getElementById('shop-overlay')?.addEventListener('click', closeShop);
document.getElementById('shop-close')?.addEventListener('click', closeShop);
document.getElementById('shop-btn')?.addEventListener('click', openShop);

// Filter profile deco options in settings to only owned (+ none)

function refreshEffectOptionsInSettings() {
  const grid = document.getElementById('profile-effect-grid');
  if (!grid) return;
  const owned = getOwnedEffects();
  grid.innerHTML = '';
  const none = document.createElement('div');
  none.className = 'effect-option' + ((selectedEffect || 'none') === 'none' ? ' active' : '');
  none.dataset.effect = 'none';
  none.textContent = 'Aucun';
  none.onclick = () => {
    document.querySelectorAll('.effect-option').forEach(o => o.classList.remove('active'));
    none.classList.add('active');
    selectedEffect = 'none';
  };
  grid.appendChild(none);
  SHOP_EFFECTS.forEach(item => {
    if (!owned.includes(item.id)) return;
    const opt = document.createElement('div');
    opt.className = 'effect-option' + (selectedEffect === item.id ? ' active' : '');
    opt.dataset.effect = item.id;
    opt.textContent = item.name;
    opt.onclick = () => {
      document.querySelectorAll('.effect-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedEffect = item.id;
    };
    grid.appendChild(opt);
  });
  if (owned.length === 0) {
    const hint = document.createElement('div');
    hint.style.cssText = 'color:#b5bac1;font-size:13px;padding:8px 0;width:100%';
    hint.textContent = 'Aucun effet possédé. Ouvre la Boutique pour en obtenir.';
    grid.appendChild(hint);
  }
}

function refreshDecoOptionsInSettings() {
  const grid = document.getElementById('avatar-deco-grid');
  if (!grid) return;
  const owned = getOwnedDecos();
  grid.innerHTML = '';
  // Always "none"
  const none = document.createElement('div');
  none.className = 'deco-option' + ((selectedDeco || 'none') === 'none' ? ' active' : '');
  none.dataset.deco = 'none';
  none.title = 'Aucune';
  none.innerHTML = '<div class="deco-preview none"></div>';
  none.onclick = () => {
    document.querySelectorAll('.deco-option').forEach(o => o.classList.remove('active'));
    none.classList.add('active');
    selectedDeco = 'none';
  };
  grid.appendChild(none);

  SHOP_ITEMS.forEach(item => {
    if (!owned.includes(item.id)) return;
    const opt = document.createElement('div');
    opt.className = 'deco-option' + (selectedDeco === item.id ? ' active' : '');
    opt.dataset.deco = item.id;
    opt.title = item.name;
    opt.innerHTML = `<img class="deco-img" src="${item.img}" alt="${item.name}">`;
    opt.onclick = () => {
      document.querySelectorAll('.deco-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedDeco = item.id;
    };
    grid.appendChild(opt);
  });

  if (owned.length === 0) {
    const hint = document.createElement('div');
    hint.style.cssText = 'grid-column:1/-1;color:#b5bac1;font-size:13px;padding:8px 0';
    hint.textContent = 'Aucune déco possédée. Ouvre la Boutique (icône panier) pour en obtenir gratuitement.';
    grid.appendChild(hint);
  }
}

// Hook openSettings to refresh deco list
const _openSettings = typeof openSettings === 'function' ? openSettings : null;


document.getElementById('create-server-btn')?.addEventListener('click', () => {
  document.getElementById('create-server-name').value = '';
  document.getElementById('create-server-modal').classList.remove('hidden');
});
document.getElementById('create-server-overlay')?.addEventListener('click', () => {
  document.getElementById('create-server-modal').classList.add('hidden');
});
document.getElementById('create-server-cancel')?.addEventListener('click', () => {
  document.getElementById('create-server-modal').classList.add('hidden');
});
document.getElementById('create-server-confirm')?.addEventListener('click', () => {
  const name = document.getElementById('create-server-name').value.trim();
  if (!name) return alert('Donne un nom au serveur');
  socket.emit('createGuild', { name });
  document.getElementById('create-server-modal').classList.add('hidden');
});


// ===== SERVER SETTINGS =====
function openServerSettings() {
  if (!currentGuild) return;
  fillServerSettings();
  document.getElementById('server-settings-modal').classList.remove('hidden');
}
function closeServerSettings() {
  document.getElementById('server-settings-modal').classList.add('hidden');
}
function fillServerSettings() {
  const guild = guilds.find(g => g.id === currentGuild);
  if (!guild) return;
  document.getElementById('ss-name').value = guild.name || '';
  document.getElementById('ss-icon').value = guild.icon || '';
  // categories select
  const sel = document.getElementById('ss-ch-cat');
  sel.innerHTML = '<option value="">Sans catégorie</option>';
  (guild.categories || []).forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = c.name;
    sel.appendChild(o);
  });
  // list categories + channels with delete
  const chList = document.getElementById('ss-channels-list');
  chList.innerHTML = '';

  const title = document.createElement('div');
  title.style.cssText = 'font-weight:700;margin-bottom:10px;color:#f2f3f5;font-size:12px;text-transform:uppercase';
  title.textContent = 'Catégories & salons';
  chList.appendChild(title);

  // categories
  (guild.categories || []).forEach(cat => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;margin:4px 0;background:#1e1f22;border-radius:4px';
    row.innerHTML = `<span style="color:#949ba4;font-size:12px;font-weight:700;text-transform:uppercase">${escapeHtml(cat.name)}</span>`;
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Supprimer';
    delBtn.style.cssText = 'background:transparent;border:none;color:#f23f43;cursor:pointer;font-size:12px;padding:4px 8px';
    delBtn.onclick = () => {
      if (!confirm('Supprimer la catégorie « ' + cat.name + ' » ?\nLes salons seront détachés (pas supprimés).')) return;
      socket.emit('deleteCategory', { guildId: currentGuild, categoryId: cat.id });
    };
    row.appendChild(delBtn);
    chList.appendChild(row);
  });

  // channels
  const chTitle = document.createElement('div');
  chTitle.style.cssText = 'font-weight:700;margin:14px 0 8px;color:#f2f3f5;font-size:12px;text-transform:uppercase';
  chTitle.textContent = 'Salons actuels';
  chList.appendChild(chTitle);

  const chans = guild.channels || [];
  if (!chans.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:#949ba4;font-size:13px';
    empty.textContent = 'Aucun salon';
    chList.appendChild(empty);
  } else {
    chans.forEach(c => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;margin:2px 0;border-radius:4px';
      row.onmouseenter = () => { row.style.background = '#2b2d31'; };
      row.onmouseleave = () => { row.style.background = 'transparent'; };
      const catName = (guild.categories || []).find(x => x.id === c.categoryId)?.name;
      row.innerHTML = `<span style="color:#dbdee1;font-size:14px">#${escapeHtml(c.name)}${catName ? ' <span style="color:#949ba4;font-size:11px">(' + escapeHtml(catName) + ')</span>' : ''}</span>`;
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Supprimer';
      delBtn.style.cssText = 'background:transparent;border:none;color:#f23f43;cursor:pointer;font-size:12px;padding:4px 8px;flex-shrink:0';
      delBtn.onclick = () => {
        if (!confirm('Supprimer le salon #' + c.name + ' ?')) return;
        socket.emit('deleteChannel', { guildId: currentGuild, channelId: c.id });
      };
      row.appendChild(delBtn);
      chList.appendChild(row);
    });
  }

  // roles
  const rList = document.getElementById('ss-roles-list');
  rList.innerHTML = (guild.roles || []).map(r =>
    `<div style="display:flex;align-items:center;gap:8px;margin:6px 0"><span style="width:12px;height:12px;border-radius:50%;background:${r.color}"></span>${escapeHtml(r.name)}</div>`
  ).join('') || 'Aucun rôle';
}

document.getElementById('server-settings-btn')?.addEventListener('click', openServerSettings);
document.getElementById('server-settings-overlay')?.addEventListener('click', closeServerSettings);
document.getElementById('server-settings-close')?.addEventListener('click', closeServerSettings);
document.getElementById('server-settings-close-nav')?.addEventListener('click', closeServerSettings);

document.querySelectorAll('[data-stab]').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('[data-stab]').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('#server-settings-modal .settings-tab').forEach(x => x.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('stab-' + item.dataset.stab)?.classList.add('active');
  });
});

document.getElementById('ss-save-overview')?.addEventListener('click', () => {
  socket.emit('updateGuild', {
    guildId: currentGuild,
    name: document.getElementById('ss-name').value.trim(),
    icon: document.getElementById('ss-icon').value.trim()
  });
  alert('Serveur mis à jour');
});

document.getElementById('ss-add-cat')?.addEventListener('click', () => {
  const name = document.getElementById('ss-cat-name').value.trim();
  if (!name) return;
  socket.emit('createCategory', { guildId: currentGuild, name });
  document.getElementById('ss-cat-name').value = '';
});

document.getElementById('ss-add-ch')?.addEventListener('click', () => {
  const name = document.getElementById('ss-ch-name').value.trim();
  if (!name) return;
  socket.emit('createChannel', {
    guildId: currentGuild,
    name,
    categoryId: document.getElementById('ss-ch-cat').value || null
  });
  document.getElementById('ss-ch-name').value = '';
});

document.getElementById('ss-add-role')?.addEventListener('click', () => {
  const name = document.getElementById('ss-role-name').value.trim();
  if (!name) return;
  socket.emit('createRole', {
    guildId: currentGuild,
    name,
    color: document.getElementById('ss-role-color').value
  });
  document.getElementById('ss-role-name').value = '';
});


// ===== SERVER BOOST =====
function hasNitroForBoost() {
  if (!currentUser) return false;
  if (currentUser.hasNitro) return true;
  const badges = currentUser.badges || [];
  return badges.some(b => b === 'nitro' || (typeof b === 'string' && (b.startsWith('nitro_') || b.startsWith('nitro'))));
}
function boostCurrentServer() {
  if (!currentGuild) return alert('Aucun serveur sélectionné');
  if (!hasNitroForBoost()) {
    return alert('Il te faut Nitro pour booster un serveur !\nVa dans la boutique (ou Ton Nitro) pour en obtenir.');
  }
  if (!confirm('Booster ce serveur ? (nécessite Nitro, max 2 boosts par compte)\nTu recevras le badge Boost 1 mois.')) return;
  socket.emit('boostServer', { guildId: currentGuild });
}
socket.on('boostSuccess', (data) => {
  alert('Serveur boosté ! Badge obtenu.\nBoosts restants : ' + data.boostsLeft + '/2\nBoosts du serveur : ' + data.guildBoosts);
  updateBoostUI(data.guildBoosts);
});
function updateBoostUI(count) {
  const el = document.getElementById('server-boost-count');
  if (el) el.textContent = '🚀 ' + (count || 0);
  const btn = document.getElementById('boost-server-btn');
  if (btn) {
    if (hasNitroForBoost()) {
      btn.style.opacity = '1';
      btn.title = 'Booster ce serveur (Nitro requis)';
    } else {
      btn.style.opacity = '0.45';
      btn.title = 'Nitro requis pour booster';
    }
  }
}

document.getElementById('boost-server-btn')?.addEventListener('click', (e) => { e.stopPropagation(); boostCurrentServer(); });


// ===== HOME TABS: Amis / Ton Nitro / Boutique =====
const NITRO_TIERS = [
  { id: null, name: 'Aucun', img: '/badges/nitro.png', next: 'Obtiens Nitro dans la boutique', progress: 0 },
  { id: 'nitro', name: 'Abonné Nitro', img: '/badges/nitro.png', next: 'Passe à Nitro Bronze', progress: 10 },
  { id: 'nitro_bronze', name: 'Nitro Bronze', img: '/badges/nitro_bronze.png', next: '2 mois avant Nitro Argent', progress: 20 },
  { id: 'nitro_silver', name: 'Nitro Argent', img: '/badges/nitro_silver.png', next: '3 mois avant Nitro Or', progress: 35 },
  { id: 'nitro_gold', name: 'Nitro Or', img: '/badges/nitro_gold.png', next: '6 mois avant Nitro Platine', progress: 50 },
  { id: 'nitro_platinum', name: 'Nitro Platine', img: '/badges/nitro_platinum.png', next: '1 an avant Nitro Diamant', progress: 65 },
  { id: 'nitro_diamond', name: 'Nitro Diamant', img: '/badges/nitro_diamond.png', next: '1 an avant Nitro Émeraude', progress: 75 },
  { id: 'nitro_emerald', name: 'Nitro Émeraude', img: '/badges/nitro_emerald.png', next: '2 ans avant Nitro Rubis', progress: 85 },
  { id: 'nitro_ruby', name: 'Nitro Rubis', img: '/badges/nitro_ruby.png', next: '1 an avant Nitro Opal', progress: 92 },
  { id: 'nitro_opal', name: 'Nitro Opal', img: '/badges/nitro_opal.png', next: 'Niveau maximum atteint', progress: 100 }
];

function getUserNitroTier() {
  if (!currentUser) return NITRO_TIERS[0];
  const badges = currentUser.badges || [];
  // highest tier wins
  for (let i = NITRO_TIERS.length - 1; i >= 0; i--) {
    const t = NITRO_TIERS[i];
    if (t.id && badges.includes(t.id)) return t;
  }
  if (currentUser.hasNitro || badges.includes('nitro')) return NITRO_TIERS[1];
  return NITRO_TIERS[0];
}

function updateNitroCard() {
  const tier = getUserNitroTier();
  const img = document.getElementById('nitro-card-img');
  const name = document.getElementById('nitro-card-tier');
  const next = document.getElementById('nitro-card-next');
  const date = document.getElementById('nitro-card-date');
  const bar = document.getElementById('nitro-progress-bar');
  if (img) img.src = tier.img;
  if (name) name.textContent = tier.name;
  if (next) next.textContent = tier.next;
  if (date) date.textContent = tier.id ? 'Abonné Zeyscord Nitro' : 'Pas encore abonné';
  if (bar) bar.style.width = (tier.progress || 0) + '%';
}

function setHomeTab(tab) {
  document.querySelectorAll('.home-nav-item').forEach(el => el.classList.remove('active'));
  const nitroPanel = document.getElementById('nitro-panel');
  const friendsPanel = document.getElementById('home-friends-panel');
  const messagesContainer = document.getElementById('messages-container');
  const messageForm = document.getElementById('message-form');

  if (tab === 'friends') {
    document.getElementById('nav-friends')?.classList.add('active');
    nitroPanel?.classList.add('hidden');
    if (friendsPanel) friendsPanel.style.display = '';
    messagesContainer?.classList.remove('hidden');
    messageForm?.classList.remove('hidden');
  } else if (tab === 'nitro') {
    document.getElementById('nav-nitro')?.classList.add('active');
    updateNitroCard();
    nitroPanel?.classList.remove('hidden');
    if (friendsPanel) friendsPanel.style.display = 'none';
  } else if (tab === 'shop') {
    document.getElementById('nav-shop')?.classList.add('active');
    nitroPanel?.classList.add('hidden');
    if (friendsPanel) friendsPanel.style.display = '';
    openShop();
  }
}

document.getElementById('nav-friends')?.addEventListener('click', () => setHomeTab('friends'));
document.getElementById('nav-nitro')?.addEventListener('click', () => {
  switchView('home');
  setHomeTab('nitro');
});
document.getElementById('nav-shop')?.addEventListener('click', () => {
  switchView('home');
  setHomeTab('shop');
});
document.getElementById('nitro-open-shop')?.addEventListener('click', openShop);


document.getElementById('profile-created-save')?.addEventListener('click', () => {
  if (!currentUser?.isOwner) {
    alert('Seul le propriétaire peut modifier la date de création');
    return;
  }
  const input = document.getElementById('profile-created-input');
  const wrap = document.getElementById('profile-created-edit');
  const userId = wrap?.dataset.userId;
  if (!input?.value) return;
  socket.emit('setCreatedAt', { userId, createdAt: input.value });
  const memberSince = document.getElementById('profile-member-since');
  if (memberSince) {
    const d = new Date(input.value);
    memberSince.textContent = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  alert('Date de création mise à jour');
});


// Auto-reconnect with saved username
(function autoLogin() {
  const saved = localStorage.getItem('zeyscord_username');
  if (saved && loginForm) {
    const input = document.getElementById('username-input') || document.querySelector('#login-form input[type="text"]');
    if (input) input.value = saved;
    // wait for socket connect
    const tryJoin = () => {
      if (socket.connected) {
        socket.emit('join', saved);
      } else {
        socket.once('connect', () => socket.emit('join', saved));
      }
    };
    tryJoin();
  }
})();
