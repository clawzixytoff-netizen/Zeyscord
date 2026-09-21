const socket = io();

let currentUser = null;
let currentChannel = 'zeyscord_general';
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
  owner: `<img src="/badges/certified.png" width="22" height="22">`,
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
  nitro_opal: `<img src="/badges/nitro_opal.png" width="22" height="22">`,
  quest: `<img src="/badges/quest.png" width="22" height="22">`,
  orbs: `<img src="/badges/orbs.png" width="22" height="22">`,
  leaf: `<img src="/badges/leaf.png" width="22" height="22">`,
  gift: `<img src="/badges/gift_purple.png" width="22" height="22">`,
  gift_rainbow: `<img src="/badges/gift_rainbow.png" width="22" height="22">`,
  gift_gold: `<img src="/badges/gift_gold.png" width="22" height="22">`,
  gift_blue: `<img src="/badges/gift_blue.png" width="22" height="22">`,
  gift_teal: `<img src="/badges/gift_teal.png" width="22" height="22">`,
  gift_pink: `<img src="/badges/gift_pink.png" width="22" height="22">`,
  certified: `<img src="/badges/certified.png" width="22" height="22">`
};
const BADGE_NAMES = {
  owner: 'Créateur de l\'application',
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
  nitro_opal: 'Nitro Opal',
  quest: 'Quêtes',
  orbs: 'Orbs',
  leaf: 'Feuilles',
  gift: 'Cadeau',
  gift_rainbow: 'Cadeau Arc-en-ciel',
  gift_gold: 'Cadeau Or',
  gift_blue: 'Cadeau Bleu',
  gift_teal: 'Cadeau Sarcelle',
  gift_pink: 'Cadeau Rose',
  certified: 'Certifié'
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


// Force zpc profile styles (injected once)
(function injectZpcStyles() {
  if (document.getElementById('zpc-force-css')) return;
  const s = document.createElement('style');
  s.id = 'zpc-force-css';
  s.textContent = `
    .zpc { width:340px!important; border-radius:12px!important; overflow:visible!important; position:relative!important; box-shadow:0 8px 32px rgba(0,0,0,.5)!important; }
    .zpc-banner { height:120px!important; min-height:120px!important; width:100%!important; display:block!important; border-radius:12px 12px 0 0!important; background-size:cover!important; background-position:center!important; }
    .zpc-body { position:relative!important; padding:48px 16px 16px!important; border-radius:0 0 12px 12px!important; min-height:80px!important; }
    .zpc-avatar-wrap { position:absolute!important; top:-40px!important; left:16px!important; width:92px!important; height:92px!important; overflow:visible!important; z-index:30!important; margin:0!important; padding:0!important; }
    .zpc-avatar { width:80px!important; height:80px!important; border-radius:50%!important; border:6px solid #232428!important; box-sizing:content-box!important; display:flex!important; align-items:center!important; justify-content:center!important; font-size:32px!important; font-weight:600!important; color:#fff!important; position:relative!important; z-index:1!important; overflow:hidden!important; }
    .zpc-avatar img { width:100%!important; height:100%!important; object-fit:cover!important; border-radius:50%!important; display:block!important; }
    /* deco handled elsewhere */
    .zpc-name { color:#fff!important; font-size:20px!important; font-weight:700!important; margin:0 0 2px!important; }
    .zpc-handle { color:rgba(255,255,255,.7)!important; font-size:14px!important; margin-bottom:8px!important; }
    .zpc-status, .zpc-section { background:rgba(0,0,0,.35)!important; border-radius:8px!important; padding:10px 12px!important; margin-bottom:10px!important; color:#dbdee1!important; }
    .pe-preview-wrap { overflow:visible!important; }
  `;
  document.head.appendChild(s);
})();

const DECO_URLS = {
  hugh_the_rainbow: "https://cdn.discordapp.com/avatar-decoration-presets/a_0c0eeb351ae2cf48c6e1eee2cae49d40.png?size=240&passthrough=true",
  phoenix: "https://cdn.discordapp.com/avatar-decoration-presets/a_0e839cd79500e7b68e2bbbed54790c28.png?size=240&passthrough=true",
  firecrackers: "https://cdn.discordapp.com/avatar-decoration-presets/a_0f4f1b40921ce680b60007e94427d1f2.png?size=240&passthrough=true",
  flaming_sword: "https://cdn.discordapp.com/avatar-decoration-presets/a_0f5d6c4dd8ae74662ee9c40722a56cbd.png?size=240&passthrough=true",
  ramenbowl: "https://cdn.discordapp.com/avatar-decoration-presets/a_001e956faa73bd0410c455234c62818f.png?size=240&passthrough=true",
  steampunk_cat_ears: "https://cdn.discordapp.com/avatar-decoration-presets/a_1acbe609daec21fa5b866df9e5a42cb7.png?size=240&passthrough=true",
  lucky_envelopes: "https://cdn.discordapp.com/avatar-decoration-presets/a_1b1df0ae8c2d34afd85da5c22a0d761a.png?size=240&passthrough=true",
  magical_potion: "https://cdn.discordapp.com/avatar-decoration-presets/a_1dbc603c181999b9815cb426dfec71a6.png?size=240&passthrough=true",
  akuma: "https://cdn.discordapp.com/avatar-decoration-presets/a_1e8cb6070b13f775a41384c84c5a53e1.png?size=240&passthrough=true",
  next_turn_button: "https://cdn.discordapp.com/avatar-decoration-presets/a_2b95e7a4951a1a092e7870bf1d456262.png?size=240&passthrough=true",
  snowglobe: "https://cdn.discordapp.com/avatar-decoration-presets/a_2ca5fb1ecf0dac410b38d76cb4aae7f9.png?size=240&passthrough=true",
  feelin_nervous: "https://cdn.discordapp.com/avatar-decoration-presets/a_2d792aad5003faf6809e26879a7eae6b.png?size=240&passthrough=true",
  lotus_flower: "https://cdn.discordapp.com/avatar-decoration-presets/a_2e55d644e11acb6253dfa422eff16dfd.png?size=240&passthrough=true",
  angry: "https://cdn.discordapp.com/avatar-decoration-presets/a_3c97a2d37f433a7913a1c7b7a735d000.png?size=240&passthrough=true",
  owlbear_cub: "https://cdn.discordapp.com/avatar-decoration-presets/a_3c5743cedcb72131c58278278a97c143.png?size=240&passthrough=true",
  straw_hat: "https://cdn.discordapp.com/avatar-decoration-presets/a_3d1e6078b2e4c8865e0ad0f429d651b1.png?size=240&passthrough=true",
  heartbloom: "https://cdn.discordapp.com/avatar-decoration-presets/a_3e1fc3c7ee2e34e8176f4737427e8f4f.png?size=240&passthrough=true",
  candlelight: "https://cdn.discordapp.com/avatar-decoration-presets/a_3f29e6edfe1cff43736f644cf1d01278.png?size=240&passthrough=true",
  treasure_and_key: "https://cdn.discordapp.com/avatar-decoration-presets/a_4c9f2ec29c05755456dbce45d8190ed4.png?size=240&passthrough=true",
  in_tears: "https://cdn.discordapp.com/avatar-decoration-presets/a_4cc97277177b166fd7d4af3bdb370815.png?size=240&passthrough=true",
  butterflies: "https://cdn.discordapp.com/avatar-decoration-presets/a_4cd9ae5a8d103c219eacd3674d7730cd.png?size=240&passthrough=true",
  zombie_food: "https://cdn.discordapp.com/avatar-decoration-presets/a_4f2b75e5adff09709702613ea0e2cb70.png?size=240&passthrough=true",
  bubble_tea: "https://cdn.discordapp.com/avatar-decoration-presets/a_5b1319abfc9f928479b68a73635f591d.png?size=240&passthrough=true",
  witch_hat_plum: "https://cdn.discordapp.com/avatar-decoration-presets/a_5e8abacc7a7454d6b08b5cc84cac1d80.png?size=240&passthrough=true",
  shy: "https://cdn.discordapp.com/avatar-decoration-presets/a_6b793a5f7e4e15eea6b10a4fde448511.png?size=240&passthrough=true",
  black_hole: "https://cdn.discordapp.com/avatar-decoration-presets/a_6d16b27d9415cafe3b289053644337c4.png?size=240&passthrough=true",
  mirage: "https://cdn.discordapp.com/avatar-decoration-presets/a_6d99f670de3fcee669660fe262e896ea.png?size=240&passthrough=true",
  ufo: "https://cdn.discordapp.com/avatar-decoration-presets/a_6fdbddb6229453eac3bbb212edf5cd1c.png?size=240&passthrough=true",
  aespa_fanlight: "https://cdn.discordapp.com/avatar-decoration-presets/a_007d64a922ff5773fb9464945de93c8e.png?size=240&passthrough=true",
  sakura_warrior: "https://cdn.discordapp.com/avatar-decoration-presets/a_7cf09c7e78d6eb35ae354acc1d5cc676.png?size=240&passthrough=true",
  fox_hat: "https://cdn.discordapp.com/avatar-decoration-presets/a_7d305bca6cf371df98c059f9d2ef05e4.png?size=240&passthrough=true",
  lovestruck: "https://cdn.discordapp.com/avatar-decoration-presets/a_7f44d538ec830f479605f7bf8720afda.png?size=240&passthrough=true",
  crossbones: "https://cdn.discordapp.com/avatar-decoration-presets/a_7f863078aee4932cd50ee4e3b55d3035.png?size=240&passthrough=true",
  group_hug: "https://cdn.discordapp.com/avatar-decoration-presets/a_8ad98d25ee4e4512704f759476eeb294.png?size=240&passthrough=true",
  pipedream: "https://cdn.discordapp.com/avatar-decoration-presets/a_8c17e799bfeffa797042569a1ebcafc0.png?size=240&passthrough=true",
  hex_tiles: "https://cdn.discordapp.com/avatar-decoration-presets/a_8dddba8c2a9704a943bb7020a3d0a418.png?size=240&passthrough=true",
  crystal_ball_blue: "https://cdn.discordapp.com/avatar-decoration-presets/a_8ee8ae54bddfcb17d7d5c5f9bce41c0d.png?size=240&passthrough=true",
  in_love: "https://cdn.discordapp.com/avatar-decoration-presets/a_8ffa2ba9bff18e96b76c2e66fd0d7fa3.png?size=240&passthrough=true",
  hex_lights: "https://cdn.discordapp.com/avatar-decoration-presets/a_09bb4197c743ea31b7eb052eddd3e892.png?size=240&passthrough=true",
  frag_out: "https://cdn.discordapp.com/avatar-decoration-presets/a_09de63526a45be1ddac70e84718ee04a.png?size=240&passthrough=true",
  solar_orbit: "https://cdn.discordapp.com/avatar-decoration-presets/a_9a6bf0ab30a6719d6eb09fa4996984ca.png?size=240&passthrough=true",
  the_monster_you_created: "https://cdn.discordapp.com/avatar-decoration-presets/a_9bc421cef4bdcfffeb2344b44ad91b44.png?size=240&passthrough=true",
  good_ol_pepper: "https://cdn.discordapp.com/avatar-decoration-presets/a_9cc1c1426ea5478aac7be6cdefdbc568.png?size=240&passthrough=true",
  fan_flourish: "https://cdn.discordapp.com/avatar-decoration-presets/a_9d2ff9685be0c668ef6990b0035fac17.png?size=240&passthrough=true",
  skull_medallion: "https://cdn.discordapp.com/avatar-decoration-presets/a_9d67a1cbf81fe7197c871e94f619b04b.png?size=240&passthrough=true",
  tarrain_tiles: "https://cdn.discordapp.com/avatar-decoration-presets/a_9d95e36bc282523fddc63d31a8d01091.png?size=240&passthrough=true",
  feelin_scrumptious: "https://cdn.discordapp.com/avatar-decoration-presets/a_9d35467f282b8c72a26f5aa40aa2a637.png?size=240&passthrough=true",
  red_lantern: "https://cdn.discordapp.com/avatar-decoration-presets/a_9e16d86b2887eb2a3bed36a5b8876935.png?size=240&passthrough=true",
  mooncaps_blue: "https://cdn.discordapp.com/avatar-decoration-presets/a_25f7407a6a0c5de43736a1f24c3b7979.png?size=240&passthrough=true",
  honeyblossom: "https://cdn.discordapp.com/avatar-decoration-presets/a_27bbf0b53b1054cf61e9a4c0e8d4027f.png?size=240&passthrough=true",
  string_lights_dusk: "https://cdn.discordapp.com/avatar-decoration-presets/a_28e531da18a80b8287837332154c5f58.png?size=240&passthrough=true",
  defensive_shield: "https://cdn.discordapp.com/avatar-decoration-presets/a_29a0533cb3de61aa8179810188f3830d.png?size=240&passthrough=true",
  heartstrings_blue: "https://cdn.discordapp.com/avatar-decoration-presets/a_42cc3fe7133523096466102e7a222003.png?size=240&passthrough=true",
  magical_girl: "https://cdn.discordapp.com/avatar-decoration-presets/a_45f7f9975255971b197d34d77fb50ede.png?size=240&passthrough=true",
  unicorn: "https://cdn.discordapp.com/avatar-decoration-presets/a_47c0f4b4a837894998d5a316acf74f87.png?size=240&passthrough=true",
  chromawave: "https://cdn.discordapp.com/avatar-decoration-presets/a_49c479e15533fb4c02eb320c9c137433.png?size=240&passthrough=true",
  rocket_puncher: "https://cdn.discordapp.com/avatar-decoration-presets/a_49ed38f73003e2e182f77190af0a0a56.png?size=240&passthrough=true",
  slither_n_snack: "https://cdn.discordapp.com/avatar-decoration-presets/a_49ffdb1883d8c644a8eb68711ee58be9.png?size=240&passthrough=true",
  koi_pond: "https://cdn.discordapp.com/avatar-decoration-presets/a_50b440810b1bbd89f6284f36d40ad0af.png?size=240&passthrough=true",
  faces_of_the_moon: "https://cdn.discordapp.com/avatar-decoration-presets/a_50cfb73a4c52235363491855d3c3c3bc.png?size=240&passthrough=true",
  dismay: "https://cdn.discordapp.com/avatar-decoration-presets/a_51d3bb502109eec26c76386ec980bc8b.png?size=240&passthrough=true",
  sweat_drops: "https://cdn.discordapp.com/avatar-decoration-presets/a_55c9d0354290afa8b7fe47ea9bd7dbcf.png?size=240&passthrough=true",
  lofi_girl_outfit: "https://cdn.discordapp.com/avatar-decoration-presets/a_60cb281fac6d8f558efaf6dd9fe4dbe4.png?size=240&passthrough=true",
  viper_poison_cloud: "https://cdn.discordapp.com/avatar-decoration-presets/a_62cd9d7c0031a7c1eb5ad5cc96992189.png?size=240&passthrough=true",
  heartstrings_red: "https://cdn.discordapp.com/avatar-decoration-presets/a_63a69109db554a66764cbe61c6e556ef.png?size=240&passthrough=true",
  lunar_lanterns: "https://cdn.discordapp.com/avatar-decoration-presets/a_63b29ec5b1ea6bb01c2251049838d822.png?size=240&passthrough=true",
  string_lights_ember: "https://cdn.discordapp.com/avatar-decoration-presets/a_63d17f42ee46a843d99a58655910bc6a.png?size=240&passthrough=true",
  m_bison: "https://cdn.discordapp.com/avatar-decoration-presets/a_66f69effef43b4f7c4f5d0739079a947.png?size=240&passthrough=true",
  ryu: "https://cdn.discordapp.com/avatar-decoration-presets/a_68cb6c21d6222cd9285c08068f39873d.png?size=240&passthrough=true",
  magic_portal_purple: "https://cdn.discordapp.com/avatar-decoration-presets/a_72d1fd7c47cc7a98c8f64d175773344b.png?size=240&passthrough=true",
  cozy_cat: "https://cdn.discordapp.com/avatar-decoration-presets/a_77b7b6a740a9451e1ef39c0252154ef8.png?size=240&passthrough=true",
  scallywag: "https://cdn.discordapp.com/avatar-decoration-presets/a_78f326d95c0193c317470e3e81db81e7.png?size=240&passthrough=true",
  balance: "https://cdn.discordapp.com/avatar-decoration-presets/a_82e4df4028396ad5ccaaafb397fa6248.png?size=240&passthrough=true",
  fishbones: "https://cdn.discordapp.com/avatar-decoration-presets/a_84a67b33ef5b75e17f858a95648c973f.png?size=240&passthrough=true",
  string_lights: "https://cdn.discordapp.com/avatar-decoration-presets/a_88f42fb7360d8224a670a50c3496f315.png?size=240&passthrough=true",
  valorant_champions_2024: "https://cdn.discordapp.com/avatar-decoration-presets/a_90e0dce3cc48c4a9607b6d41209c737e.png?size=240&passthrough=true",
  cannon_fire: "https://cdn.discordapp.com/avatar-decoration-presets/a_91a33236cf2728310a3a29bbdc8e0d29.png?size=240&passthrough=true",
  playful_lofi_cat: "https://cdn.discordapp.com/avatar-decoration-presets/a_96f65d0aacc4a94b50ef7fb656d5826d.png?size=240&passthrough=true",
  crystal_elk: "https://cdn.discordapp.com/avatar-decoration-presets/a_98c7600d304b86ca3b18272e1da05559.png?size=240&passthrough=true",
  magic_portal_blue: "https://cdn.discordapp.com/avatar-decoration-presets/a_98cf94e029ac79c5b377413d1a2bd82f.png?size=240&passthrough=true",
  implant: "https://cdn.discordapp.com/avatar-decoration-presets/a_172fa9da0af8698e37f5e5de76637439.png?size=240&passthrough=true",
  cottage_home: "https://cdn.discordapp.com/avatar-decoration-presets/a_210b82b98876083ce393ecd92eb07260.png?size=240&passthrough=true",
  bloomling: "https://cdn.discordapp.com/avatar-decoration-presets/a_306a56249fe3c3d2bc7a30041cb63e0e.png?size=240&passthrough=true",
  lightning: "https://cdn.discordapp.com/avatar-decoration-presets/a_365eed4178528fe8293c4212e8e2d5cb.png?size=240&passthrough=true",
  mech_flora: "https://cdn.discordapp.com/avatar-decoration-presets/a_459cf2afde41f01559a4a4204ab81767.png?size=240&passthrough=true",
  lava_lamp_bundle: "https://cdn.discordapp.com/avatar-decoration-presets/a_462b0bddc07dd495765fe12abe8b077f.png?size=240&passthrough=true",
  mallow_jump: "https://cdn.discordapp.com/avatar-decoration-presets/a_492f6b54b761c0a14d9dbc9c98aaa0f5.png?size=240&passthrough=true",
  dancing_fairies: "https://cdn.discordapp.com/avatar-decoration-presets/a_535aa3354b1a7395c271bb2f53be4275.png?size=240&passthrough=true",
  air: "https://cdn.discordapp.com/avatar-decoration-presets/a_554b7c34f7b6c709f19535aacb128e7b.png?size=240&passthrough=true",
  rose_bearer: "https://cdn.discordapp.com/avatar-decoration-presets/a_555ad9b90a13534180b9274d013e3651.png?size=240&passthrough=true",
  power_by_shimmer: "https://cdn.discordapp.com/avatar-decoration-presets/a_609fb5c17a4d5ff2e2bec1a1931a9caa.png?size=240&passthrough=true",
  head_in_the_clouds: "https://cdn.discordapp.com/avatar-decoration-presets/a_670b722e56740d11d1e6fe55b8094013.png?size=240&passthrough=true",
  fall_leaves: "https://cdn.discordapp.com/avatar-decoration-presets/a_720a2045510ec16f9878237d2ff9873f.png?size=240&passthrough=true",
  pirate_captain: "https://cdn.discordapp.com/avatar-decoration-presets/a_798a5bcbb11067e4d9ab339e51d2a16c.png?size=240&passthrough=true",
  blade_storm: "https://cdn.discordapp.com/avatar-decoration-presets/a_904b1989077c91fca1168d39bfcaa0a4.png?size=240&passthrough=true",
  guile: "https://cdn.discordapp.com/avatar-decoration-presets/a_993ac691660d3d67b500d995e121b220.png?size=240&passthrough=true",
  sproutling: "https://cdn.discordapp.com/avatar-decoration-presets/a_3012fad396abbf24e325431800b51510.png?size=240&passthrough=true",
  midnight_sorceress: "https://cdn.discordapp.com/avatar-decoration-presets/a_4430a4ee89b7fba456e765db21f38485.png?size=240&passthrough=true",
  doodling: "https://cdn.discordapp.com/avatar-decoration-presets/a_5873ecaa76fb549654b40095293f902e.png?size=240&passthrough=true",
  sleepy_chilledcow: "https://cdn.discordapp.com/avatar-decoration-presets/a_6649e251a23f24935471ee02c212675b.png?size=240&passthrough=true",
  armamenter: "https://cdn.discordapp.com/avatar-decoration-presets/a_6912c651e979fbfdc479ed082a571513.png?size=240&passthrough=true",
  flame_chompers: "https://cdn.discordapp.com/avatar-decoration-presets/a_8396e9830e3e288cd3aaa6daf18b605a.png?size=240&passthrough=true",
  constellations: "https://cdn.discordapp.com/avatar-decoration-presets/a_8552f9857793aed0cf816f370e2df3be.png?size=240&passthrough=true",
  cat_onesie: "https://cdn.discordapp.com/avatar-decoration-presets/a_9661cf3296ac236d8815e3f5b809a467.png?size=240&passthrough=true",
  strawberry_vine: "https://cdn.discordapp.com/avatar-decoration-presets/a_9867b1ba56601e745cfe741e6b00b835.png?size=240&passthrough=true",
  sakura_lnk: "https://cdn.discordapp.com/avatar-decoration-presets/a_13913a00bd9990ab4102a3bf069f0f3f.png?size=240&passthrough=true",
  spooky_cat_ears: "https://cdn.discordapp.com/avatar-decoration-presets/a_33656b7ed12cde00c1826b654cf65590.png?size=240&passthrough=true",
  dark_hood: "https://cdn.discordapp.com/avatar-decoration-presets/a_41445f736db3525135b6b9e1122f2254.png?size=240&passthrough=true",
  sushi_roll: "https://cdn.discordapp.com/avatar-decoration-presets/a_44045ae47175eaca4ed1b4d889b62b27.png?size=240&passthrough=true",
  gelatinous_cube: "https://cdn.discordapp.com/avatar-decoration-presets/a_66604bb5c9351541f30c20a4e78c239c.png?size=240&passthrough=true",
  feelin_awe: "https://cdn.discordapp.com/avatar-decoration-presets/a_89155faed81b205d59fbbefa4316952d.png?size=240&passthrough=true",
  dice: "https://cdn.discordapp.com/avatar-decoration-presets/a_94191be95bb9c471ff17644f3639eb6d.png?size=240&passthrough=true",
  a_hint_of_clove: "https://cdn.discordapp.com/avatar-decoration-presets/a_98555e40cc6802bd3a4fed906af1d992.png?size=240&passthrough=true",
  neon_nibbles: "https://cdn.discordapp.com/avatar-decoration-presets/a_126219d37fa9422dab6a075064453750.png?size=240&passthrough=true",
  water: "https://cdn.discordapp.com/avatar-decoration-presets/a_250640ab00a8837a1d56f35879138177.png?size=240&passthrough=true",
  dragon_s_smile: "https://cdn.discordapp.com/avatar-decoration-presets/a_445566ed965b2c1632a5b45c92f32d11.png?size=240&passthrough=true",
  joystick: "https://cdn.discordapp.com/avatar-decoration-presets/a_795573a62c6d9b583f3029100f90d56b.png?size=240&passthrough=true",
  spirit_embers: "https://cdn.discordapp.com/avatar-decoration-presets/a_1005898c6acf56a9ac5010baf444f6fd.png?size=240&passthrough=true",
  got_xenoglossy: "https://cdn.discordapp.com/avatar-decoration-presets/a_35713167cc82e0f408c26dfc032a7f0f.png?size=240&passthrough=true",
  kabuto: "https://cdn.discordapp.com/avatar-decoration-presets/a_084353360ae4f9b5b3b5f186e5525de0.png?size=240&passthrough=true",
  aurora: "https://cdn.discordapp.com/avatar-decoration-presets/a_386445551be850bb16b73a225d0d0602.png?size=240&passthrough=true",
  dandelion_duo: "https://cdn.discordapp.com/avatar-decoration-presets/a_629689577fa1da2ef0061a5a8c930de1.png?size=240&passthrough=true",
  rage: "https://cdn.discordapp.com/avatar-decoration-presets/a_a0db4314b8cc271c8f472357aa895005.png?size=240&passthrough=true",
  fresh_pine: "https://cdn.discordapp.com/avatar-decoration-presets/a_a0fafb7c7ee7f1e5b1442f44f3aa14b7.png?size=240&passthrough=true",
  ruby_hearts: "https://cdn.discordapp.com/avatar-decoration-presets/a_a1c0581971d4a296908829289fea2c47.png?size=240&passthrough=true",
  city_walls: "https://cdn.discordapp.com/avatar-decoration-presets/a_a4e8e02dbbba6889428c744df7aa5a81.png?size=240&passthrough=true",
  polar_bear_hat: "https://cdn.discordapp.com/avatar-decoration-presets/a_a7e6467b5332ab7a2b725aa225e6c752.png?size=240&passthrough=true",
  dusk_and_dawn: "https://cdn.discordapp.com/avatar-decoration-presets/a_a44e9335ea869639fdf812f3642a56a6.png?size=240&passthrough=true",
  reyna_s_leer: "https://cdn.discordapp.com/avatar-decoration-presets/a_a87e3efa4de2956331831681231ce63b.png?size=240&passthrough=true",
  baby_displacer_beast: "https://cdn.discordapp.com/avatar-decoration-presets/a_a842a9cf76fdaf91a6354937b31ecdef.png?size=240&passthrough=true",
  oni_mask: "https://cdn.discordapp.com/avatar-decoration-presets/a_a21393f8a2cb8eafbdfb5364fb1cbbae.png?size=240&passthrough=true",
  fire: "https://cdn.discordapp.com/avatar-decoration-presets/a_a065206df7b011a5510e4e5bca7d49be.png?size=240&passthrough=true",
  bowler_hat: "https://cdn.discordapp.com/avatar-decoration-presets/a_a67833d0f3138d7dcdee98c39eae33d7.png?size=240&passthrough=true",
  the_petal_pack: "https://cdn.discordapp.com/avatar-decoration-presets/a_ab95c78401ce4ec85c25a6d308db9d85.png?size=240&passthrough=true",
  the_anomaly: "https://cdn.discordapp.com/avatar-decoration-presets/a_af5ee420e5f860ff2cdbb5fa4633f2cf.png?size=240&passthrough=true",
  cypher_neural_theft: "https://cdn.discordapp.com/avatar-decoration-presets/a_b1efe77f379c6c9c6e47e6b6299d5a7d.png?size=240&passthrough=true",
  devil: "https://cdn.discordapp.com/avatar-decoration-presets/a_b4dcf63b6af2e20cba91af61c0e3a8a7.png?size=240&passthrough=true",
  shocked: "https://cdn.discordapp.com/avatar-decoration-presets/a_b98e8b204d59882fb7f9f7c86922c0bf.png?size=240&passthrough=true",
  mooncaps: "https://cdn.discordapp.com/avatar-decoration-presets/a_b13180be7866281f6fa588a49dd7feb0.png?size=240&passthrough=true",
  helmsman: "https://cdn.discordapp.com/avatar-decoration-presets/a_b98093bb7723235a4cd2792762795640.png?size=240&passthrough=true",
  cozy_headphones: "https://cdn.discordapp.com/avatar-decoration-presets/a_bb71042ccd2ca277a69f086a4f3354d0.png?size=240&passthrough=true",
  kitsune: "https://cdn.discordapp.com/avatar-decoration-presets/a_be111e4303d634c55500202a61656e0b.png?size=240&passthrough=true",
  brass_beats: "https://cdn.discordapp.com/avatar-decoration-presets/a_bfaeda83edb41e78250eedc71bed31fc.png?size=240&passthrough=true",
  soul_leaving_body: "https://cdn.discordapp.com/avatar-decoration-presets/a_c3c09bd122898be35093d0d59850f627.png?size=240&passthrough=true",
  cat_ears: "https://cdn.discordapp.com/avatar-decoration-presets/a_c3cffc19e9784f7d0b005eecdf1b566e.png?size=240&passthrough=true",
  aradiating_energy: "https://cdn.discordapp.com/avatar-decoration-presets/a_c7e1751e8122f1b475cb3006966fb28c.png?size=240&passthrough=true",
  wizard_hat: "https://cdn.discordapp.com/avatar-decoration-presets/a_c25b962e5cabb9a656f02c50095d6496.png?size=240&passthrough=true",
  shuriken_s_mark: "https://cdn.discordapp.com/avatar-decoration-presets/a_c32ce5680d4be96e059790ad493aa0fe.png?size=240&passthrough=true",
  omen_s_cowl: "https://cdn.discordapp.com/avatar-decoration-presets/a_c45abe8c7585fdb41b8d8d4d666f1588.png?size=240&passthrough=true",
  autumn_crown: "https://cdn.discordapp.com/avatar-decoration-presets/a_c509c4760e5e1a50fa341d68f3c1901b.png?size=240&passthrough=true",
  digital_sunrise: "https://cdn.discordapp.com/avatar-decoration-presets/a_cc83efd93ecd6e41857449c3c0ef9b22.png?size=240&passthrough=true",
  golden_hex: "https://cdn.discordapp.com/avatar-decoration-presets/a_ccee9031d66bc0f2d7ed0c6178d01784.png?size=240&passthrough=true",
  e_d_hacker: "https://cdn.discordapp.com/avatar-decoration-presets/a_cdca4a092a03b16b94e50289fe3f7bd1.png?size=240&passthrough=true",
  malefic_crown: "https://cdn.discordapp.com/avatar-decoration-presets/a_d1ea7b8650bf3d64a03304c2ceb7d089.png?size=240&passthrough=true",
  magical_wand: "https://cdn.discordapp.com/avatar-decoration-presets/a_d3a9c3a1c89ccb0e1ab8724a5c965f48.png?size=240&passthrough=true",
  disxcore_headset: "https://cdn.discordapp.com/avatar-decoration-presets/a_d3da36040163ee0f9176dfe7ced45cdc.png?size=240&passthrough=true",
  flux_alchemy: "https://cdn.discordapp.com/avatar-decoration-presets/a_d8d93c7a53c0dd07a4074b745210434d.png?size=240&passthrough=true",
  glowing_runes: "https://cdn.discordapp.com/avatar-decoration-presets/a_d650e22f6c4bab4fc0969e9d35edbcb0.png?size=240&passthrough=true",
  snake_s_hug: "https://cdn.discordapp.com/avatar-decoration-presets/a_d859cee893cffd5dd0fa17a6caea44e0.png?size=240&passthrough=true",
  starry_eyed: "https://cdn.discordapp.com/avatar-decoration-presets/a_d72066b8cecbadd9fc951913ebcc384f.png?size=240&passthrough=true",
  yoru_bundle: "https://cdn.discordapp.com/avatar-decoration-presets/a_da532f804b47f1681006c2996eb07b2a.png?size=240&passthrough=true",
  wizard_s_staff: "https://cdn.discordapp.com/avatar-decoration-presets/a_db9baf0ba7cf449d2b027c06309dbe8d.png?size=240&passthrough=true",
  the_hexcore: "https://cdn.discordapp.com/avatar-decoration-presets/a_dbb1abd90367c1a31a94f7e162f3a3c3.png?size=240&passthrough=true",
  juri: "https://cdn.discordapp.com/avatar-decoration-presets/a_dcfe10bac4a782ffb5eefef7a8003115.png?size=240&passthrough=true",
  rumbling: "https://cdn.discordapp.com/avatar-decoration-presets/a_df5442048d7d5b8b8906f3a9cd93f0ab.png?size=240&passthrough=true",
  mix_string_light_bundle: "https://cdn.discordapp.com/avatar-decoration-presets/a_dff769a0f922bb56ab0d4ba2bcbacfae.png?size=240&passthrough=true",
  sakura_scholar: "https://cdn.discordapp.com/avatar-decoration-presets/a_e0a2df84cf7eb8e098a13e37ec9027c1.png?size=240&passthrough=true",
  rainy_mood: "https://cdn.discordapp.com/avatar-decoration-presets/a_e8c11f139e55dac538cdaafb3caa2317.png?size=240&passthrough=true",
  aim_for_love: "https://cdn.discordapp.com/avatar-decoration-presets/a_e60cc4d7f4d8a6e79dd8cc67d2b13d6c.png?size=240&passthrough=true",
  clyde_invaders: "https://cdn.discordapp.com/avatar-decoration-presets/a_e72e44eeea89e92dc02c9bec8b02d158.png?size=240&passthrough=true",
  glitch: "https://cdn.discordapp.com/avatar-decoration-presets/a_e90ebc0114e7bdc30353c8b11953ea41.png?size=240&passthrough=true",
  uwu_xp: "https://cdn.discordapp.com/avatar-decoration-presets/a_e257ca83b5b164968fd036f69dbb2ad9.png?size=240&passthrough=true",
  cozy_post_it: "https://cdn.discordapp.com/avatar-decoration-presets/a_e671277ab6d18c0de00871347eed94a7.png?size=240&passthrough=true",
  eldritch_ring: "https://cdn.discordapp.com/avatar-decoration-presets/a_ef6fe8b27123eacccebe51c92a61587c.png?size=240&passthrough=true",
  aracanist_bundle: "https://cdn.discordapp.com/avatar-decoration-presets/a_ef8d97374ffdbf140df1164be6c69e46.png?size=240&passthrough=true",
  starlight_whales: "https://cdn.discordapp.com/avatar-decoration-presets/a_efe3081ee3359a77b515575b5f7bc8c0.png?size=240&passthrough=true",
  timekeeper_s_clock: "https://cdn.discordapp.com/avatar-decoration-presets/a_f1c60c026aa89971e360ba88643d92c0.png?size=240&passthrough=true",
  ki_energy: "https://cdn.discordapp.com/avatar-decoration-presets/a_f3af281c65cf0cf590e9e1f59e9c6cf6.png?size=240&passthrough=true",
  port_of_soul: "https://cdn.discordapp.com/avatar-decoration-presets/a_f4fcdab859b2eab1874fbe7182d5aa26.png?size=240&passthrough=true",
  azure_dice_roll_bundle: "https://cdn.discordapp.com/avatar-decoration-presets/a_f8ffeba6f389d1475c8794ca88b59785.png?size=240&passthrough=true",
  feelin_panic: "https://cdn.discordapp.com/avatar-decoration-presets/a_f11c214394044d001d81c983dcab354f.png?size=240&passthrough=true",
  a_sphere_of_gusting_wind_swirls_around_the_avatar: "https://cdn.discordapp.com/avatar-decoration-presets/a_f081c6b2c85c5ebe5df42f1c24d45bb5.png?size=240&passthrough=true",
  bunny_zzzs: "https://cdn.discordapp.com/avatar-decoration-presets/a_f438bb9b2f25ac55058fc169ecc8096e.png?size=240&passthrough=true",
  ken: "https://cdn.discordapp.com/avatar-decoration-presets/a_f524554b7f42a214d15c226c344a5357.png?size=240&passthrough=true",
  oasis: "https://cdn.discordapp.com/avatar-decoration-presets/a_f740031cc97d1b7eb73c0d0ac1dd09f3.png?size=240&passthrough=true",
  cat_ear_headset: "https://cdn.discordapp.com/avatar-decoration-presets/a_fa39ba4d9eff38d2eeb47ebcb623e4ca.png?size=240&passthrough=true",
  earht: "https://cdn.discordapp.com/avatar-decoration-presets/a_fa014594d4b2b4249e1098c0adc85b47.png?size=240&passthrough=true",
  gold_laurel_wreath: "https://cdn.discordapp.com/avatar-decoration-presets/a_fcb0de14da228879b455f1f1d3919749.png?size=240&passthrough=true",
  fairy_pixie_bundle: "https://cdn.discordapp.com/avatar-decoration-presets/a_fe3c76cac2adf426832a7e495e8329d3.png?size=240&passthrough=true",
  death_s_edge: "https://cdn.discordapp.com/avatar-decoration-presets/a_fe63036018fefb8abe3172383497e3bf.png?size=240&passthrough=true",
  autumn_s_arbor: "https://cdn.discordapp.com/avatar-decoration-presets/a_fead934c894e95e070d8a0301f9f0b27.png?size=240&passthrough=true",
  futuristic_ui: "https://cdn.discordapp.com/avatar-decoration-presets/a_fed43ab12698df65902ba06727e20c0e.png?size=240&passthrough=true",
};
const EFFECT_LAYERS = {
  boost_relic: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/boost-relic/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/boost-relic/loop.png" },
  cyberspace: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/cyberspace/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/cyberspace/loop.png" },
  hydro_blast: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/splash/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/splash/loop.png" },
  shatter: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-5/earthquake/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/earthquake/loop.png" },
  magic_hearts: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/magic-girl/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/magic-girl/loop.png" },
  sakura_dreams: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-12-13/sakura/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/sakura/loop.png" },
  power_surge: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/sayan/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/sayan/loop.png" },
  shuriken_strike: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-5/shuriken/intro3.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/shuriken/loop3.png" },
  mystic_vines: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/vines/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/vines/loop.png" },
  pixie_dust: { intro: null, loop: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/fairy/loop.png" },
  discord_os: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/cereal/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/cereal/loop.png" },
  breakfast_plate: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/plate/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/plate/loop.png" },
  ghoulish_graffiti: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/punk-girl/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/punk-girl/loop.png" },
  dark_omens: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/ghost-skull/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/ghost-skull/loop.png" },
  zombie_slime: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/zombie-slime/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/zombie-slime/loop.png" },
  fall_foliage: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/leaves/intro-branch.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/leaves/loop.png" },
  lillypad_life: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/rain/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/rain/loop.png" },
  deck_the_halls: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-28/deck-the-halls/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/deck-the-halls/loop.png" },
  snowy_shenanigans: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-28/snowy-shenanigans/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/snowy-shenanigans/loop.png" },
  goozilla: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/intro-claw.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/loop.png" },
  heartzilla: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-30/heartzilla/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/heartzilla/loop.png" },
  monster_pop: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-30/monster-pop/intro-monster.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/monster-pop/loop.png" },
  nightrunner: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-19/cyberpunk-nightrunner/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-18/cyberpunk-nightrunner/idle.png" },
  uplink_error: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-19/cyberpunk-uplinkerror/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-18/cyberpunk-uplinkerror/idle.png" },
  dragon_dance: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-07/dragon-dance/intro_2e0f72c35c.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-07/dragon-dance/loop_20e743b578.png" },
  fortune_flurry: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/fortune-flurry/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-02/fortune-flurry/loop.png" },
  midnight_celebration: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/midnight-celebration/intro.png", loop: null },
  rock_slide: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/rock-slide/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/rock-slide/idle.png" },
  vortex: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/vortex/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/vortex/idle.png" },
  mastery: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/mastery/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/mastery/idle.png" },
  dreamy: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/dreamy/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/dreamy/idle.png" },
  ki_detonate: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/ki-detonate/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/ki-detonate/idle.png" },
  sushi_mania: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/sushi-mania/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/sushi-mania/idle.png" },
  petal_serenade: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/intro-pse01.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/idle-frame.png" },
  fellowship_of_the_spring: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/intro-fose01.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/idle-frame.png" },
  spring_bloom: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/intro-sbe01.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/idle-flowers.png" },
  clove_s_ruse: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/cloves-ruse/intro_b62d8ce4.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/cloves-ruse/idle_050419ac.png" },
  ace: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/intro_fa545ec0.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/idle_frame_83d027d7.png" },
  the_immortal_clove: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/the-immortal-clove/intro_310a69a3.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/the-immortal-clove/idle_8739289c.png" },
  study_spot: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-12/study-spot/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/study-spot/idle.png" },
  all_nighter: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-14/all-nighter/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/all-nighter/idle-frame.png" },
  watercolors: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/watercolors/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/watercolors/idle.png" },
  shooting_stars: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/shooting-stars/intro_770bd27eae0.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/shooting-stars/loop_b1b5a9936b.png" },
  supernova: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/supernova/intro_9e90bcf683.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/supernova/loop_5835f1730b.png" },
  twilight: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/twilight/intro_56dbd2384f.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/twilight/loop_ff3e249d19.png" },
  feelin_mischievous: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/intro_bg.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/idle_bg.png" },
  feelin_90s: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-70s/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-70s/idle.png" },
  feelin_pizzazz: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-10/feelin-pizzazz/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-pizzazz/idle.png" },
  jolly_roger: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-10/jolly-roger/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/jolly-roger/idle.png" },
  forgotten_treasure: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-10/forgotten-treasure/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/forgotten-treasure/idle.png" },
  haunted_man_o_war: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-13/haunted-man-o-war/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-13/haunted-man-o-war/idle.png" },
  space_evader: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/intro_bg.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/idle.png" },
  turbo_drive: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/idle_finish.png" },
  twinkle_trails: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/twinkle-trails/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/twinkle-trails/idle.png" },
  saya: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-21/saya/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/saya/idle.png" },
  wake_up: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-20/wake-up/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/wake-up/idle.png" },
  tocotoco: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-20/tocotoco/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/tocotoco/idle.png" },
  arcane_summons: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/arcane-summons/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/arcane-summons/idle.png" },
  vengeance: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/vengeance/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/vengeance/idle.png" },
  spirit_flame: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/spirit-flame/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/spirit-flame/idle.png" },
  nice_profile: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-24/nice-profile/intro_a9d1e733.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/nice-profile/idle_a.png" },
  handsome_squidward: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/intro_e89c516b.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/idle_a.png" },
  doodlebob_takeover: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/doodlebob-takeover/intro_479359c2.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/doodlebob-takeover/idle.png" },
  plankton_splat: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-17/plankton-splat/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-17/plankton-splat/idle.png" },
  ocean_flowers: { intro: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/ocean-flowers/intro.png", loop: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/ocean-flowers/idle.png" },
};

const EFFECT_URLS = {
  boost_relic: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/boost-relic/loop.png",
  cyberspace: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/cyberspace/loop.png",
  hydro_blast: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/splash/loop.png",
  shatter: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/earthquake/loop.png",
  magic_hearts: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/magic-girl/loop.png",
  sakura_dreams: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/sakura/loop.png",
  power_surge: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/sayan/loop.png",
  shuriken_strike: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/shuriken/loop3.png",
  mystic_vines: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/vines/loop.png",
  pixie_dust: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/fairy/loop.png",
  discord_os: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/cereal/loop.png",
  breakfast_plate: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/plate/loop.png",
  ghoulish_graffiti: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/punk-girl/loop.png",
  dark_omens: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/ghost-skull/loop.png",
  zombie_slime: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/zombie-slime/loop.png",
  fall_foliage: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/leaves/loop.png",
  lillypad_life: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/rain/loop.png",
  deck_the_halls: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/deck-the-halls/loop.png",
  snowy_shenanigans: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/snowy-shenanigans/loop.png",
  goozilla: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/loop.png",
  heartzilla: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/heartzilla/loop.png",
  monster_pop: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/monster-pop/loop.png",
  nightrunner: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-18/cyberpunk-nightrunner/idle.png",
  uplink_error: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-18/cyberpunk-uplinkerror/idle.png",
  dragon_dance: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-07/dragon-dance/loop_20e743b578.png",
  fortune_flurry: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-02/fortune-flurry/loop.png",
  midnight_celebration: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/midnight-celebration/intro.png",
  rock_slide: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/rock-slide/idle.png",
  vortex: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/vortex/idle.png",
  mastery: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/mastery/idle.png",
  dreamy: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/dreamy/idle.png",
  ki_detonate: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/ki-detonate/idle.png",
  sushi_mania: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/sushi-mania/idle.png",
  petal_serenade: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/idle-frame.png",
  fellowship_of_the_spring: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/idle-frame.png",
  spring_bloom: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/idle-flowers.png",
  clove_s_ruse: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/cloves-ruse/idle_050419ac.png",
  ace: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/idle_frame_83d027d7.png",
  the_immortal_clove: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/the-immortal-clove/idle_8739289c.png",
  study_spot: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/study-spot/idle.png",
  all_nighter: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/all-nighter/idle-frame.png",
  watercolors: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/watercolors/idle.png",
  shooting_stars: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/shooting-stars/loop_b1b5a9936b.png",
  supernova: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/supernova/loop_5835f1730b.png",
  twilight: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/twilight/loop_ff3e249d19.png",
  feelin_mischievous: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/idle_bg.png",
  feelin_90s: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-70s/idle.png",
  feelin_pizzazz: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-pizzazz/idle.png",
  jolly_roger: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/jolly-roger/idle.png",
  forgotten_treasure: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/forgotten-treasure/idle.png",
  haunted_man_o_war: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-13/haunted-man-o-war/idle.png",
  space_evader: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/idle.png",
  turbo_drive: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/idle_finish.png",
  twinkle_trails: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/twinkle-trails/idle.png",
  saya: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/saya/idle.png",
  wake_up: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/wake-up/idle.png",
  tocotoco: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/tocotoco/idle.png",
  arcane_summons: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/arcane-summons/idle.png",
  vengeance: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/vengeance/idle.png",
  spirit_flame: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/spirit-flame/idle.png",
  nice_profile: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/nice-profile/idle_a.png",
  handsome_squidward: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/idle_a.png",
  doodlebob_takeover: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/doodlebob-takeover/idle.png",
  plankton_splat: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-17/plankton-splat/idle.png",
  ocean_flowers: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/ocean-flowers/idle.png",
};

function applyAvatarDeco(el, deco) {
  if (!el) return;
  const next = (!deco || deco === 'none' || !DECO_URLS[deco]) ? 'none' : deco;

  let wrap =
    el.closest('.uam-avatar-wrap') ||
    el.closest('.zpc-avatar-wrap') ||
    el.closest('.profile-avatar-wrapper') ||
    el.closest('.user-avatar-wrap') ||
    el.closest('.member-avatar-wrap') ||
    el.closest('.picker-deco-av-wrap') ||
    el.parentElement;

  if (wrap) wrap.querySelectorAll('.avatar-deco-overlay').forEach(n => n.remove());
  el.querySelectorAll('.avatar-deco-overlay').forEach(n => n.remove());
  el.classList.toggle('has-deco', next !== 'none');
  if (next === 'none') return;

  if (wrap) {
    wrap.style.setProperty('overflow', 'visible', 'important');
    wrap.style.setProperty('position', 'relative', 'important');
    wrap.style.setProperty('z-index', '40', 'important');
  }
  el.style.setProperty('overflow', 'hidden', 'important');
  el.style.setProperty('position', 'relative', 'important');
  el.style.setProperty('z-index', '1', 'important');

  function place() {
    const host = wrap || el;
    host.querySelectorAll('.avatar-deco-overlay').forEach(n => n.remove());

    const avRect = el.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    let av = Math.max(avRect.width, avRect.height);
    if (!av || av < 8) {
      if (el.id === 'uam-avatar') av = 68;
      else if (el.id === 'profile-avatar' || el.id === 'edit-preview-avatar') av = 80;
      else if (el.classList.contains('message-avatar')) av = 40;
      else av = 32;
    }
    // Discord : deco ~1.6x le diametre de la PDP, centree pile
    const size = Math.round(av * 1.32);

    const img = document.createElement('img');
    img.className = 'avatar-deco-overlay';
    img.dataset.decoId = next;
    let src = DECO_URLS[next];
    // CDN : forcer taille nette
    if (src && src.includes('avatar-decoration-presets')) {
      src = src.replace(/size=\d+/, 'size=240');
      if (!src.includes('passthrough')) src += (src.includes('?') ? '&' : '?') + 'passthrough=true';
    }
    img.src = src;
    img.alt = '';
    img.draggable = false;

    // Position en px depuis le centre de la PDP dans le host
    let left = hostRect.width / 2;
    let top = hostRect.height / 2;
    if (hostRect.width > 0 && avRect.width > 0) {
      left = (avRect.left - hostRect.left) + avRect.width / 2;
      top = (avRect.top - hostRect.top) + avRect.height / 2;
    }

    img.style.cssText = [
      'position:absolute',
      'left:' + left + 'px',
      'top:' + top + 'px',
      'width:' + size + 'px',
      'height:' + size + 'px',
      'transform:translate(-50%,-50%)',
      'object-fit:contain',
      'pointer-events:none',
      'z-index:50',
      'margin:0',
      'padding:0',
      'border:0',
      'display:block',
      'max-width:none',
      'max-height:none'
    ].map(s => s + ' !important').join(';');

    host.appendChild(img);
  }

  place();
  requestAnimationFrame(() => requestAnimationFrame(place));
  setTimeout(place, 80);
  setTimeout(place, 250);
}

function applyProfileEffect(card, effect) {
  if (!card) return;
  const next = (!effect || effect === 'none' || !EFFECT_URLS[effect]) ? 'none' : effect;

  if (card.dataset.appliedEffect === next) {
    const still = card.querySelector(':scope > .profile-effect-overlay, .profile-effect-overlay');
    if (next === 'none' || still) return;
  }

  card.querySelectorAll('.profile-effect-overlay').forEach(n => n.remove());
  Array.from(card.classList).forEach(c => { if (c.startsWith('effect-')) card.classList.remove(c); });
  card.dataset.appliedEffect = next;
  if (next === 'none') return;

  card.classList.add('effect-' + next);
  card.style.setProperty('position', 'relative', 'important');
  // clip a la carte pour voir l'effet sur TOUTE la surface
  card.style.setProperty('overflow', 'hidden', 'important');

  const layer = document.createElement('div');
  layer.className = 'profile-effect-overlay';
  layer.dataset.effectId = next;
  layer.style.cssText = [
    'position:absolute',
    'inset:0',
    'width:100%',
    'height:100%',
    'z-index:10',
    'pointer-events:none',
    'border-radius:inherit',
    'overflow:hidden'
  ].join(';');

  function makeFxImg(src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    img.loading = 'eager';
    img.style.setProperty('position', 'absolute', 'important');
    img.style.setProperty('left', '0', 'important');
    img.style.setProperty('top', '0', 'important');
    img.style.setProperty('width', '100%', 'important');
    img.style.setProperty('height', '100%', 'important');
    img.style.setProperty('object-fit', 'cover', 'important');
    img.style.setProperty('object-position', 'center top', 'important');
    img.style.setProperty('image-rendering', 'auto', 'important');
    img.style.setProperty('opacity', '1', 'important');
    img.style.setProperty('mix-blend-mode', 'normal', 'important');
    return img;
  }
  // Discord : intro + loop superposes pour effet complet (ex: Shatter)
  const layers = (typeof EFFECT_LAYERS !== 'undefined' && EFFECT_LAYERS[next]) ? EFFECT_LAYERS[next] : null;
  const urls = [];
  if (layers && layers.intro) urls.push(layers.intro);
  if (layers && layers.loop) urls.push(layers.loop);
  if (!urls.length && EFFECT_URLS[next]) urls.push(EFFECT_URLS[next]);
  urls.forEach(u => layer.appendChild(makeFxImg(u)));
  card.appendChild(layer);

  // Banniere derriere l'effet
  card.querySelectorAll('.uam-header-block, .uam-banner, .zpc-banner, .profile-banner').forEach(el => {
    el.style.setProperty('position', 'relative', 'important');
    el.style.setProperty('z-index', '1', 'important');
  });
  // Body 100% transparent = effet visible sur TOUT le profil
  card.querySelectorAll('.uam-profile-body, .zpc-body, .profile-content').forEach(el => {
    el.style.setProperty('position', 'relative', 'important');
    el.style.setProperty('z-index', '15', 'important');
    el.style.setProperty('background', 'transparent', 'important');
    el.style.setProperty('background-image', 'none', 'important');
  });
  // Boutons lisibles sans masquer l'effet partout
  card.querySelectorAll('.uam-item, .uam-actions .uam-item').forEach(el => {
    el.style.setProperty('background', 'rgba(0,0,0,0.35)', 'important');
    el.style.setProperty('backdrop-filter', 'blur(6px)', 'important');
  });
  card.querySelectorAll('.uam-top-info, .uam-actions, .uam-user-card, .uam-name, .uam-handle, .uam-badges, .zpc-info').forEach(el => {
    el.style.setProperty('position', 'relative', 'important');
    el.style.setProperty('z-index', '16', 'important');
  });
  card.querySelectorAll('.uam-avatar-wrap, .zpc-avatar-wrap, .profile-avatar-wrapper').forEach(el => {
    el.style.setProperty('z-index', '30', 'important');
  });
}


// DOM
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username') || document.getElementById('login-email');
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


// ===== AUTH (login / register / verify) =====
let pendingRegEmail = null;
function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return alert(msg);
  el.textContent = msg || '';
  el.classList.toggle('hidden', !msg);
}
function showAuthPanel(name) {
  ['auth-login-panel', 'auth-register-panel', 'auth-verify-panel'].forEach(id => {
    document.getElementById(id)?.classList.toggle('hidden', id !== name);
  });
  showAuthError('');
}
document.getElementById('goto-register')?.addEventListener('click', (e) => {
  e.preventDefault();
  showAuthPanel('auth-register-panel');
});
document.getElementById('goto-login')?.addEventListener('click', (e) => {
  e.preventDefault();
  showAuthPanel('auth-login-panel');
});
document.getElementById('goto-login-from-verify')?.addEventListener('click', (e) => {
  e.preventDefault();
  showAuthPanel('auth-login-panel');
});

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email')?.value.trim().toLowerCase();
  const password = document.getElementById('login-password')?.value || '';
  if (!email || !password) return;
  showAuthError('');
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      showAuthError(data.error || 'Connexion impossible');
      return;
    }
    localStorage.setItem('zeyscord_email', data.email);
    localStorage.setItem('zeyscord_username', data.username);
    sessionStorage.setItem('zeyscord_session', JSON.stringify({ email: data.email, username: data.username }));
    // save for multi-account list
    if (typeof saveRecentAccount === 'function') {
      saveRecentAccount({ username: data.username, avatarColor: '#5865f2', email: data.email });
    }
    socket.emit('join', { username: data.username, email: data.email });
  } catch (err) {
    showAuthError('Erreur réseau');
  }
});

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('reg-email')?.value.trim().toLowerCase();
  const username = document.getElementById('reg-username')?.value.trim();
  const password = document.getElementById('reg-password')?.value || '';
  if (!email || !username || password.length < 4) {
    showAuthError('Remplis tous les champs (mdp 4+ caractères)');
    return;
  }
  showAuthError('');
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      showAuthError(data.error || 'Inscription impossible');
      return;
    }
    pendingRegEmail = data.email;
    const disp = document.getElementById('verify-code-display');
    if (disp) disp.textContent = data.code;
    document.getElementById('verify-code').value = '';
    showAuthPanel('auth-verify-panel');
  } catch (err) {
    showAuthError('Erreur réseau');
  }
});

document.getElementById('verify-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('verify-code')?.value.trim();
  const email = pendingRegEmail || document.getElementById('reg-email')?.value.trim().toLowerCase();
  if (!email || !code) return;
  showAuthError('');
  try {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!res.ok) {
      showAuthError(data.error || 'Code invalide');
      return;
    }
    // Auto login after verify - need password from form
    const password = document.getElementById('reg-password')?.value || '';
    localStorage.setItem('zeyscord_email', data.email);
    localStorage.setItem('zeyscord_username', data.username);
    sessionStorage.setItem('zeyscord_session', JSON.stringify({ email: data.email, username: data.username }));
    if (password) {
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password })
      });
      if (loginRes.ok) {
        socket.emit('join', { username: data.username, email: data.email });
        return;
      }
    }
    showAuthPanel('auth-login-panel');
    const le = document.getElementById('login-email');
    if (le) le.value = data.email;
    showAuthError('Compte validé ! Connecte-toi.');
  } catch (err) {
    showAuthError('Erreur réseau');
  }
});

// Ajouter un compte → page d'inscription
document.getElementById('accounts-add')?.addEventListener('click', () => {
  closeAccountsManager?.();
  sessionStorage.removeItem('zeyscord_session');
  localStorage.removeItem('zeyscord_username');
  if (socket) socket.disconnect();
  location.reload();
});


socket.on('init', data => {
  currentUser = data.user;
  if (window.matchMedia('(max-width: 768px)').matches) {
    document.body.classList.remove('mobile-in-chat');
  }
  onlineUsers = data.onlineUsers || [];
  availableBadges = data.availableBadges || [];
  friends = data.friends || [];
  friendRequests = data.friendRequests || [];
  if (data.user && Array.isArray(data.user.wishlist)) {
    setWishlist(data.user.wishlist);
  }

  try {
    const known = (friends || []).map(f => f.username).filter(Boolean);
    const prev = JSON.parse(localStorage.getItem('zeyscord_known_users') || '[]');
    localStorage.setItem('zeyscord_known_users', JSON.stringify([...new Set([...prev, ...known])]));
  } catch(_) {}

  guilds = data.guilds || [];
  currentGuild = data.currentGuild || (guilds[0] && guilds[0].id);
  currentChannel = (data.channels && data.channels[0] && data.channels[0].id) || data.messages?.[0]?.channelId || 'zeyscord_general';
  loginScreen.classList.add('hidden');
  app.classList.remove('hidden');
  saveRecentAccount(currentUser);
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
  // Remove optimistic temps matching this content from same author
  if (currentUser && msg.author && msg.author.id === currentUser.id) {
    document.querySelectorAll('.message[data-message-id^="temp_"]').forEach(el => {
      const contentEl = el.querySelector('.message-content');
      if (contentEl && contentEl.textContent === msg.content) el.remove();
    });
  }
  if (document.querySelector('.message[data-message-id="' + msg.id + '"]')) return;

  const isDM = msg.channelId && String(msg.channelId).startsWith('dm_');
  let show = false;
  if (isDM && currentDM && currentUser) {
    const key = 'dm_' + [currentUser.id, currentDM].sort().join('_');
    show = (msg.channelId === key || msg.channelId === socket.currentChannel);
    // fallback: if we're in any DM view with this partner, show
    if (!show && msg.channelId.includes(currentUser.id) && msg.channelId.includes(currentDM)) show = true;
    if (!show) show = true; // if joinDM room matches, server only sends to room - safe to show when currentDM set
  } else if (!isDM && !currentDM && msg.channelId) {
    if (msg.channelId === currentChannel) show = true;
  }
  if (show) {
    appendMessage(msg);
    scrollToBottom();
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
  try {
    const known = JSON.parse(localStorage.getItem('zeyscord_known_users') || '[]');
    if (friend.username && !known.includes(friend.username)) {
      known.push(friend.username);
      localStorage.setItem('zeyscord_known_users', JSON.stringify(known));
    }
  } catch(_) {}

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

const STATUS_LABELS = {
  online: 'En ligne',
  idle: 'Inactif',
  dnd: 'Ne pas déranger',
  invisible: 'Invisible'
};
const STATUS_COLORS = {
  online: '#23a559',
  idle: '#f0b232',
  dnd: '#f23f43',
  invisible: '#80848e'
};

function setStatusDot(el, status) {
  if (!el) return;
  const s = status || 'online';
  const keep = [];
  if (el.classList.contains('zpc-online')) keep.push('zpc-online');
  if (el.classList.contains('status-dot')) keep.push('status-dot');
  if (el.classList.contains('member-status-dot')) keep.push('member-status-dot');
  if (el.classList.contains('uam-status-icon')) keep.push('uam-status-icon');
  if (el.id === 'user-status-dot' || el.id === 'uam-status-dot') keep.push('status-dot');
  el.className = (keep.join(' ') + ' status-' + s).trim();
  const color = STATUS_COLORS[s] || STATUS_COLORS.online;
  el.style.setProperty('background', color, 'important');
  el.style.setProperty('background-color', color, 'important');
  el.style.setProperty('display', 'block', 'important');
}

/** Met a jour TOUS les indicateurs de statut (PC + mobile) */
function applyPresenceStatus(status) {
  const s = status || 'online';
  if (currentUser) currentUser.presenceStatus = s;

  setStatusDot(document.getElementById('user-status-dot'), s);
  setStatusDot(document.getElementById('uam-status-dot'), s);
  setStatusDot(document.getElementById('profile-status-dot'), s);

  const ind = document.getElementById('uam-status-indicator');
  if (ind) {
    ind.className = 'uam-status-icon status-' + s;
  }
  const lab = document.getElementById('uam-status-label');
  if (lab) lab.textContent = STATUS_LABELS[s] || 'En ligne';

  // Texte sous le pseudo dans le menu
  const handle = document.getElementById('uam-handle');
  if (handle && currentUser) {
    const base = (currentUser.username || '').toLowerCase();
    handle.textContent = base + ' • ' + (STATUS_LABELS[s] || 'en ligne').toLowerCase();
  }
}

function fillSmallAvatar(el, user) {
  if (!el || !user) return;
  if (user.avatarUrl) {
    el.innerHTML = '';
    el.style.background = 'transparent';
    const img = document.createElement('img');
    img.src = user.avatarUrl;
    img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block';
    el.appendChild(img);
  } else {
    el.innerHTML = '';
    el.style.background = user.avatarColor || '#5865f2';
    el.textContent = (user.username || '?')[0].toUpperCase();
  }
}

function updateUserPanel() {
  if (!currentUser) return;
  fillSmallAvatar(userAvatar, currentUser);
  userName.textContent = currentUser.username;
  const cs = document.getElementById('user-custom-status');
  if (cs) {
    cs.textContent = currentUser.customStatus || '';
    cs.title = currentUser.customStatus || '';
  }
  applyAvatarDeco(userAvatar, currentUser.avatarDeco);
  const st = currentUser.presenceStatus || 'online';
  setStatusDot(document.getElementById('user-status-dot'), st);
  // Ne rafraichir le menu QUE s'il est ouvert (evite relancer l'effet)
  const menu = document.getElementById('user-account-menu');
  if (menu && !menu.classList.contains('hidden')) {
    populateAccountMenu();
  }
}

function getRecentAccounts() {
  try {
    return JSON.parse(localStorage.getItem('zeyscord_accounts') || '[]');
  } catch { return []; }
}
function saveRecentAccount(user) {
  if (!user || !user.username) return;
  let list = getRecentAccounts().filter(a => a.username.toLowerCase() !== user.username.toLowerCase());
  list.unshift({
    username: user.username,
    avatarUrl: user.avatarUrl || null,
    avatarColor: user.avatarColor || '#5865f2',
    badges: (user.badges || []).slice(0, 4)
  });
  list = list.slice(0, 8);
  localStorage.setItem('zeyscord_accounts', JSON.stringify(list));
}

function populateAccountMenu() {
  if (!currentUser) return;

  // Banner — force image (CSS must not use background shorthand with !important)
  const banner = document.getElementById('uam-banner');
  if (banner) {
    if (currentUser.bannerUrl) {
      const url = String(currentUser.bannerUrl).replace(/"/g, '%22');
      banner.style.setProperty('background-image', 'url("' + url + '")', 'important');
      banner.style.setProperty('background-size', 'cover', 'important');
      banner.style.setProperty('background-position', 'center', 'important');
      banner.style.setProperty('background-color', 'transparent', 'important');
      banner.style.setProperty('background-repeat', 'no-repeat', 'important');
    } else {
      banner.style.setProperty('background-image', 'none', 'important');
      banner.style.setProperty('background-color', currentUser.avatarColor || '#5865f2', 'important');
    }
  }

  // Avatar (large, overlapping banner)
  const wrap = document.querySelector('.uam-profile-body .uam-avatar-wrap') || document.querySelector('.uam-avatar-wrap');
  const av = document.getElementById('uam-avatar');
  if (av) {
    av.style.background = currentUser.avatarColor || '#5865f2';
  }
  fillSmallAvatar(av, currentUser);
  if (av) {
    const img = av.querySelector('img');
    if (img) img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;';
  }
  applyAvatarDeco(av, currentUser.avatarDeco);
  // uam-avatar-wrap FINAL position (ne pas couper la PDP)
  const avWrapFinal = document.querySelector('#user-account-menu > .uam-avatar-wrap') || document.querySelector('#user-account-menu .uam-avatar-wrap');
  if (avWrapFinal) {
    const menu = document.getElementById('user-account-menu');
    if (menu && avWrapFinal.parentElement !== menu) {
      menu.insertBefore(avWrapFinal, menu.querySelector('.uam-profile-body'));
    }
    avWrapFinal.style.setProperty('position', 'absolute', 'important');
    avWrapFinal.style.setProperty('left', '16px', 'important');
    avWrapFinal.style.setProperty('top', '70px', 'important');
    avWrapFinal.style.setProperty('bottom', 'auto', 'important');
    avWrapFinal.style.setProperty('width', '80px', 'important');
    avWrapFinal.style.setProperty('height', '80px', 'important');
    avWrapFinal.style.setProperty('z-index', '50', 'important');
    avWrapFinal.style.setProperty('overflow', 'visible', 'important');
  }

  // Fill name + handle + badges (next to avatar)
  const nameEl = document.getElementById('uam-name');
  const handleEl = document.getElementById('uam-handle');
  const badgesEl = document.getElementById('uam-badges');
  const uname = currentUser.username || 'User';
  const st0 = currentUser.presenceStatus || 'online';
  const stLabel = (STATUS_LABELS[st0] || 'en ligne').toLowerCase();
  const handle = uname.toLowerCase().replace(/\s/g, '');

  if (nameEl) {
    nameEl.textContent = uname;
    nameEl.style.cssText = 'font-size:18px;font-weight:700;color:#fff;display:block;line-height:1.25;margin:0;';
  }
  if (handleEl) {
    handleEl.textContent = handle + ' • ' + stLabel;
    handleEl.style.cssText = 'font-size:13px;color:#b5bac1;display:block;margin:0;';
  }
  if (badgesEl) {
    const blist = (currentUser.badges || []).slice(0, 12);
    badgesEl.innerHTML = blist.map(b => {
      let icon = (BADGE_ICONS[b] || '🏅')
        .replace(/width="\d+"/gi, 'width="20"')
        .replace(/height="\d+"/gi, 'height="20"');
      return '<span class="badge" data-badge="' + b + '" style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;">' + icon + '</span>';
    }).join('');
    badgesEl.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;';
    badgesEl.querySelectorAll('img,svg').forEach(el => {
      el.style.width = '20px';
      el.style.height = '20px';
    });
    bindBadgeTooltips(badgesEl);
  }

  // Custom status
  const cs = document.getElementById('uam-custom-status');
  if (cs) {
    cs.textContent = currentUser.customStatus || '';
    cs.style.display = currentUser.customStatus ? 'block' : 'none';
  }

  // Status — synchronise tous les points / labels
  const st = currentUser.presenceStatus || 'online';
  if (typeof applyPresenceStatus === 'function') applyPresenceStatus(st);
  else {
    setStatusDot(document.getElementById('uam-status-dot'), st);
    const ind = document.getElementById('uam-status-indicator');
    if (ind) ind.className = 'uam-status-icon status-' + st;
    const lab = document.getElementById('uam-status-label');
    if (lab) lab.textContent = STATUS_LABELS[st] || 'En ligne';
  }

  // Theme: couleurs de profil + effet (sans changer les tailles)
  const menuEl = document.getElementById('user-account-menu');
  const bodyEl = document.querySelector('#user-account-menu .uam-profile-body');
  const hasTheme = !!(currentUser.primaryColor);
  const p = currentUser.primaryColor || '#111214';
  const s = currentUser.secondaryColor || p;

  if (menuEl) {
    const hasFx = !!(currentUser.profileEffect && currentUser.profileEffect !== 'none');
    // Fond OPAQUE (sinon on voit les salons a travers sur mobile)
    if (hasTheme) {
      menuEl.style.setProperty('background', 'linear-gradient(180deg, ' + p + ' 0%, ' + s + ' 100%)', 'important');
    } else {
      menuEl.style.setProperty('background', '#111214', 'important');
    }
  }
  if (bodyEl) {
    const hasFx = !!(currentUser.profileEffect && currentUser.profileEffect !== 'none');
    if (hasFx) {
      // transparent total pour voir l'effet complet
      bodyEl.style.setProperty('background', 'transparent', 'important');
      bodyEl.style.setProperty('background-image', 'none', 'important');
    } else if (hasTheme) {
      bodyEl.style.setProperty('background', 'transparent', 'important');
    } else {
      bodyEl.style.setProperty('background', '#111214', 'important');
    }
  }
  // Banner color if no image
  if (banner && !currentUser.bannerUrl) {
    const banColor = currentUser.primaryColor || currentUser.avatarColor || '#5865f2';
    banner.style.setProperty('background-color', banColor, 'important');
  }
  // Glass buttons over theme
  document.querySelectorAll('#user-account-menu .uam-actions .uam-item').forEach(el => {
    el.style.background = hasTheme ? 'rgba(0,0,0,0.35)' : 'transparent';
    el.style.backdropFilter = hasTheme ? 'blur(8px)' : 'none';
  });
  // Pas de cercle noir autour de la PDP
  const avBorder = document.getElementById('uam-avatar');
  if (avBorder) {
    avBorder.style.setProperty('border-color', 'transparent', 'important');
    avBorder.style.setProperty('border-width', '0px', 'important');
    avBorder.style.setProperty('box-shadow', '0 0 0 4px rgba(0,0,0,0.25)', 'important');
  }
  const statusDotBorder = document.getElementById('uam-status-dot');
  if (statusDotBorder) {
    statusDotBorder.style.setProperty('border-color', hasTheme ? p : '#111214', 'important');
  }

  if (menuEl) {
    menuEl.style.position = 'absolute';
    menuEl.style.overflow = 'visible';
    // NE PAS remettre background transparent (casse le menu sur mobile)
    menuEl.style.setProperty('z-index', '1000', 'important');
    applyProfileEffect(menuEl, currentUser.profileEffect || 'none');
  }

  // Accounts list — Discord style switcher
  const listEl = document.getElementById('uam-accounts-list');
  if (listEl) {
    const accounts = getRecentAccounts();
    listEl.innerHTML = '';
    accounts.forEach(acc => {
      const isCurrent = acc.username.toLowerCase() === currentUser.username.toLowerCase();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'uam-account-item' + (isCurrent ? ' active' : '');
      const letter = (acc.username || '?')[0].toUpperCase();
      const bg = acc.avatarUrl ? 'transparent' : (acc.avatarColor || '#5865f2');
      btn.innerHTML =
        '<span class="uam-acc-av" style="background:' + bg + '">' +
          (acc.avatarUrl ? '<img src="' + acc.avatarUrl + '" alt="">' : letter) +
        '</span>' +
        '<span class="uam-acc-name">' + escapeHtml(acc.username) + '</span>' +
        (isCurrent ? '<span class="uam-check">✓</span>' : '');
      if (!isCurrent) {
        btn.onclick = (e) => {
          e.stopPropagation();
          switchAccount(acc.username);
        };
      }
      listEl.appendChild(btn);
    });

    // Gérer les comptes / Ajouter
    let manage = document.getElementById('uam-manage-accounts');
    if (!manage) {
      manage = document.createElement('button');
      manage.type = 'button';
      manage.id = 'uam-manage-accounts';
      manage.className = 'uam-manage-accounts';
      manage.textContent = 'Gérer les comptes';
      manage.onclick = (e) => {
        e.stopPropagation();
        closeAccountMenu();
        openAccountsManager();
      };
    }
    const sub = document.getElementById('uam-accounts-submenu');
    if (sub) {
      // remove old add btn if any
      document.getElementById('uam-add-account')?.remove();
      if (!document.getElementById('uam-manage-accounts')) {
        const sep = document.createElement('div');
        sep.className = 'uam-accounts-sep';
        sub.appendChild(sep);
        sub.appendChild(manage);
      }
    }
  }

  // Click on avatar/name card opens full profile
  const card = document.querySelector('.uam-user-card');
  if (card && !card._boundProfile) {
    card._boundProfile = true;
    card.style.cursor = 'pointer';
    card.title = 'Voir le profil';
    card.addEventListener('click', (e) => {
      if (e.target.closest('.badge')) return;
      e.stopPropagation();
      closeAccountMenu();
      if (currentUser) openProfile(currentUser.id);
    });
  }
}


function switchAccount(username) {
  closeAccountMenu();
  // disconnect and rejoin with new name (keeps saved profile server-side)
  if (socket) socket.disconnect();
  location.reload(); // simplest: user will type the name again, or we auto-join
  // better: store pending name
  sessionStorage.setItem('zeyscord_autojoin', username);
}

function closeAccountMenu() {
  const menu = document.getElementById('user-account-menu');
  const sub = document.getElementById('uam-status-submenu');
  const acc = document.getElementById('uam-accounts-submenu');
  const toggle = document.getElementById('uam-status-toggle');
  if (menu) menu.classList.add('hidden');
  if (sub) sub.classList.add('hidden');
  if (acc) acc.classList.add('hidden');
  if (toggle) toggle.classList.remove('open');
}

// Account menu (Discord-style) — event delegation for reliability
(function setupAccountMenu() {
  const infoBtn = document.getElementById('user-info-btn');
  const menu = document.getElementById('user-account-menu');
  if (!infoBtn || !menu) {
    console.warn('[zeyscord] account menu elements missing');
    return;
  }

  infoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wasHidden = menu.classList.contains('hidden');
    // close first
    menu.classList.add('hidden');
    document.getElementById('uam-status-submenu')?.classList.add('hidden');
    document.getElementById('uam-accounts-submenu')?.classList.add('hidden');
    document.getElementById('uam-status-toggle')?.classList.remove('open');
    if (wasHidden) {
      // Fermer tiroirs mobile pour pas superposer
      document.body.classList.remove('mobile-channels-open', 'mobile-members-open');
      document.getElementById('mobile-sidebar-overlay')?.classList.add('hidden');
      populateAccountMenu();
      menu.classList.remove('hidden');
    }
  });

  // All interactions inside the menu via delegation
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
    const t = e.target.closest('button, [data-status]');
    if (!t) return;

    // Edit profile
    if (t.id === 'uam-edit-profile' || t.closest('#uam-edit-profile')) {
      closeAccountMenu();
      if (typeof openEditProfile === 'function') openEditProfile();
      else if (currentUser) openProfile(currentUser.id);
      return;
    }

    // Toggle status submenu
    if (t.id === 'uam-status-toggle' || t.closest('#uam-status-toggle')) {
      const sub = document.getElementById('uam-status-submenu');
      const acc = document.getElementById('uam-accounts-submenu');
      const toggle = document.getElementById('uam-status-toggle');
      if (acc) acc.classList.add('hidden');
      if (sub) {
        const open = sub.classList.contains('hidden');
        sub.classList.toggle('hidden');
        if (toggle) toggle.classList.toggle('open', open);
      }
      return;
    }

    // Pick a status
    const statusOpt = t.closest('.uam-status-option') || (t.dataset && t.dataset.status ? t : null);
    if (statusOpt && statusOpt.dataset && statusOpt.dataset.status) {
      const status = statusOpt.dataset.status;
      applyPresenceStatus(status);
      socket.emit('updateProfile', { presenceStatus: status });
      updateUserPanel();
      populateAccountMenu();
      document.getElementById('uam-status-submenu')?.classList.add('hidden');
      document.getElementById('uam-status-toggle')?.classList.remove('open');
      return;
    }

    // Toggle accounts submenu — open full manager like Discord
    if (t.id === 'uam-switch-account' || t.closest('#uam-switch-account')) {
      closeAccountMenu();
      openAccountsManager();
      return;
    }

    if (t.id === 'uam-copy-id' || t.closest('#uam-copy-id')) {
      const id = currentUser?.id || currentUser?.username || '';
      navigator.clipboard?.writeText(String(id)).then(() => {
        const btn = document.getElementById('uam-copy-id');
        if (btn) {
          const span = btn.querySelector('span');
          if (span) { const o = span.textContent; span.textContent = 'Copié !'; setTimeout(() => span.textContent = o, 1500); }
        }
      }).catch(() => {});
      return;
    }

    // Logout
    if (t.id === 'uam-logout' || t.closest('#uam-logout')) {
      closeAccountMenu();
      sessionStorage.removeItem('zeyscord_autojoin');
      if (socket) socket.disconnect();
      location.reload();
      return;
    }

    // Switch to another account
    if (t.classList.contains('uam-account-item') || t.closest('.uam-account-item')) {
      const btn = t.closest('.uam-account-item') || t;
      // handled by onclick set in populateAccountMenu
    }
  });

  document.addEventListener('click', () => closeAccountMenu());

  document.getElementById('btn-settings')?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAccountMenu();
    const settings = document.getElementById('settings-modal');
    if (settings) { settings.classList.remove('hidden'); if (typeof refreshEffectOptionsInSettings==='function') refreshEffectOptionsInSettings(); if (typeof refreshDecoOptionsInSettings==='function') refreshDecoOptionsInSettings(); }
  });
})();

// Auto-join last / switched account
(function autoJoin() {
  const name = sessionStorage.getItem('zeyscord_autojoin');
  if (!name) return;
  sessionStorage.removeItem('zeyscord_autojoin');
  const input = document.getElementById('username-input');
  const form = document.getElementById('login-form');
  if (input) input.value = name;
  // small delay so socket is ready
  setTimeout(() => {
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }, 200);
})();


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
      <div class="message-content">${isGiftMessageContent(message.content) ? renderGiftMessageHtml(message.content) : escapeHtml(message.content)}</div>
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
  applyAvatarDeco(avEl, message.author.avatarDeco || 'none');
  bindBadgeTooltips(el);
}


function renderMembers() {
  membersList.innerHTML = '';
  // Invisible users still listed but with gray status
  membersCount.textContent = onlineUsers.length;
  onlineUsers.forEach(user => {
    const el = document.createElement('div');
    el.className = 'member-item';
    const badgesStr = badgesHtml((user.badges || []).slice(0, 4));
    const st = user.presenceStatus || 'online';
    el.innerHTML = `
      <div class="member-avatar-wrap" style="position:relative;width:32px;height:32px;flex-shrink:0">
        <div class="member-avatar" style="background:${user.avatarUrl ? 'transparent' : (user.avatarColor||'#5865f2')}"></div>
        <span class="member-status-dot status-${st}" style="position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;border:3px solid #2b2d31;background:${(STATUS_COLORS&&STATUS_COLORS[st])||'#23a559'};box-sizing:border-box;z-index:2"></span>
      </div>
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
    // remove any extra status dots that deco/CSS might add
    const dots = el.querySelectorAll('.member-status-dot, .status-dot');
    dots.forEach((d, i) => { if (i > 0) d.remove(); });
    bindBadgeTooltips(el);
  });
}

function friendRowHtml(f) {
  const st = f.presenceStatus || 'online';
  const stLabel = (typeof STATUS_LABELS !== 'undefined' && STATUS_LABELS[st]) ? STATUS_LABELS[st] : 'En ligne';
  const custom = f.customStatus ? escapeHtml(f.customStatus) : stLabel;
  const av = f.avatarUrl
    ? `<img src="${esc(f.avatarUrl)}" alt="">`
    : `<div class="friend-av-fallback" style="background:${f.avatarColor||'#5865f2'}">${(f.username||'?')[0].toUpperCase()}</div>`;
  return `
    <div class="friend-row-av">
      ${av}
      <div class="status-dot status-${st}"></div>
    </div>
    <div class="friend-row-info">
      <div class="friend-row-name">${escapeHtml(f.username)}</div>
      <div class="friend-row-status">${custom}</div>
    </div>
    <div class="friend-row-actions">
      <button type="button" class="friend-msg-btn" title="Message">
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      </button>
    </div>`;
}

function renderFriends() {
  try { renderFriendsMain(); } catch(e) {}

  const list = document.getElementById('friends-list');
  const dmList = document.getElementById('dm-list');
  const reqList = document.getElementById('friend-requests-list');

  if (list) {
    list.innerHTML = '';
    friends.forEach(f => {
      const el = document.createElement('div');
      el.className = 'friend-row' + (currentDM === f.id ? ' active' : '');
      el.innerHTML = friendRowHtml(f);
      el.onclick = (e) => {
        if (e.target.closest('.friend-msg-btn')) { openDM(f.id); return; }
        openProfile(f.id);
      };
      el.querySelector('.friend-msg-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openDM(f.id);
      });
      list.appendChild(el);
    });
    if (!friends.length) {
      list.innerHTML = '<div style="padding:12px;color:#949ba4;font-size:13px">Aucun ami pour le moment</div>';
    }
  }

  if (dmList) {
    dmList.innerHTML = '';
    friends.forEach(f => {
      const el = document.createElement('div');
      el.className = 'friend-row' + (currentDM === f.id ? ' active' : '');
      el.innerHTML = friendRowHtml(f);
      el.onclick = () => openDM(f.id);
      el.querySelector('.friend-msg-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openDM(f.id);
      });
      dmList.appendChild(el);
    });
    if (!friends.length) {
      dmList.innerHTML = '<div style="padding:12px;color:#949ba4;font-size:13px">Ajoute des amis pour discuter en privé</div>';
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


function isGiftMessageContent(content) {
  return typeof content === 'string' && content.startsWith('🎁 CADEAU|');
}
function renderGiftMessageHtml(content) {
  const parts = content.split('|');
  // 🎁 CADEAU|giftId|name|type\nmessage?
  const giftId = parts[1] || '';
  let rest = parts.slice(2).join('|');
  let itemName = rest;
  let itemType = 'deco';
  let msg = '';
  const nl = rest.indexOf('\n');
  if (nl >= 0) {
    msg = rest.slice(nl + 1);
    rest = rest.slice(0, nl);
  }
  const segs = rest.split('|');
  itemName = segs[0] || 'Cadeau';
  if (segs[1]) itemType = segs[1];
  return '<div class="gift-dm-card" data-gift-id="'+giftId+'">'
    + '<div class="gift-dm-icon">🎁</div>'
    + '<div class="gift-dm-body">'
    + '<div class="gift-dm-title">Cadeau : '+escapeHtml(itemName)+'</div>'
    + (msg ? '<div class="gift-dm-msg">'+escapeHtml(msg)+'</div>' : '')
    + '<button type="button" class="gift-dm-claim btn-primary" data-claim="'+giftId+'">Ouvrir le cadeau</button>'
    + '</div></div>';
}

function openDM(userId) {
  currentDM = userId;
  socket.emit('joinDM', userId);
  document.getElementById('friends-panel')?.classList.add('hidden');
  document.getElementById('messages-container')?.classList.remove('hidden');
  document.getElementById('message-form')?.classList.remove('hidden');
  const ch = document.querySelector('.chat-header');
  if (ch) ch.style.display = '';
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
  const body = document.getElementById('profile-body');
  const uname = document.getElementById('profile-username');
  const handle = document.getElementById('profile-handle');
  const badges = document.getElementById('profile-badges');
  const status = document.getElementById('profile-status');
  const about = document.getElementById('profile-about');
  const memberSince = document.getElementById('profile-member-since');
  const actions = document.getElementById('profile-actions');

  const p = user.primaryColor || null;
  const s = user.secondaryColor || p;
  const ac = user.avatarColor || '#5865f2';

  // Banner
  if (user.bannerUrl) {
    banner.style.backgroundImage = `url("${String(user.bannerUrl).replace(/"/g, '%22')}")`;
    banner.style.backgroundColor = 'transparent';
  } else {
    banner.style.backgroundImage = 'none';
    banner.style.backgroundColor = (p && ac.toLowerCase() === p.toLowerCase()) ? '#111214' : ac;
  }

  // Avatar
  if (user.avatarUrl) {
    avatar.innerHTML = '';
    avatar.style.background = 'transparent';
    const img = document.createElement('img');
    img.src = user.avatarUrl;
    img.alt = '';
    avatar.appendChild(img);
  } else {
    avatar.innerHTML = '';
    avatar.style.background = (p && ac.toLowerCase() === p.toLowerCase()) ? '#1e1f22' : ac;
    avatar.textContent = (user.username || '?')[0].toUpperCase();
  }
  avatar.style.borderColor = p || '#232428';
  setStatusDot(document.getElementById('profile-status-dot'), user.presenceStatus || 'online');
  const pWrap = document.getElementById('profile-avatar-wrap') || avatar.parentElement;
  if (pWrap) {
    pWrap.style.position = 'relative';
    pWrap.style.top = 'auto';
    pWrap.style.left = 'auto';
    pWrap.style.marginTop = '-30px';
    pWrap.style.marginLeft = '4px';
    pWrap.style.width = '72px';
    pWrap.style.height = '72px';
    pWrap.style.overflow = 'visible';
    pWrap.style.zIndex = '30';
  }

  uname.textContent = user.username;
  if (handle) {
    const st = user.presenceStatus || 'online';
    handle.textContent = user.username.toLowerCase().replace(/\s/g,'') + ' • ' + (STATUS_LABELS[st] || 'en ligne').toLowerCase();
  }
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

  // Theme
  const card = document.getElementById('profile-card-main') || modal.querySelector('.zpc');
  if (body) {
    if (p) {
      body.style.background = `linear-gradient(180deg, ${p} 0%, ${s || p} 100%)`;
      avatar.style.borderColor = p;
      const dot = document.getElementById('profile-status-dot');
      if (dot) dot.style.borderColor = p;
    } else {
      body.style.background = '#232428';
      avatar.style.borderColor = '#232428';
    }
  }
  applyProfileEffect(card, user.profileEffect);
  requestAnimationFrame(() => {
    applyAvatarDeco(avatar, user.avatarDeco);
  });
  
  


  // Onglets profil : À propos | Liste de souhaits (simple, sans casser le DOM)
  try {
    const bodyEl = document.getElementById('profile-body');
    const infoEl = bodyEl && bodyEl.querySelector('.zpc-info');
    if (!bodyEl || !infoEl) throw new Error('no body');

    // Tabs bar
    let tabsBar = document.getElementById('profile-tabs');
    if (!tabsBar) {
      tabsBar = document.createElement('div');
      tabsBar.id = 'profile-tabs';
      tabsBar.className = 'profile-tabs';
      tabsBar.innerHTML = '<button type="button" class="profile-tab active" data-ptab="about">À propos</button>'
        + '<button type="button" class="profile-tab" data-ptab="wishlist">Liste de souhaits</button>';
      infoEl.appendChild(tabsBar);
    }

    // About pane = existing sections after tabs
    let aboutPane = document.getElementById('profile-tab-about');
    if (!aboutPane) {
      aboutPane = document.createElement('div');
      aboutPane.id = 'profile-tab-about';
      aboutPane.className = 'profile-tab-pane active';
      // move status/section/actions that are still direct children of info into about
      const keep = new Set(['profile-tabs', 'profile-tab-about', 'profile-tab-wishlist', 'profile-username', 'profile-handle', 'profile-badges']);
      const toMove = [];
      Array.from(infoEl.children).forEach(ch => {
        if (ch === tabsBar) return;
        if (ch.id && keep.has(ch.id)) return;
        if (ch.classList && (ch.classList.contains('zpc-name') || ch.classList.contains('zpc-handle') || ch.classList.contains('zpc-badges'))) return;
        if (ch.id === 'profile-username' || ch.tagName === 'H2') return;
        toMove.push(ch);
      });
      // Only move status, sections, actions
      toMove.forEach(ch => {
        if (ch.classList && (ch.classList.contains('zpc-status') || ch.classList.contains('zpc-section') || ch.classList.contains('zpc-actions') || ch.classList.contains('profile-actions'))) {
          aboutPane.appendChild(ch);
        } else if (ch.id === 'profile-status' || ch.id === 'profile-member-since-section' || ch.id === 'profile-actions') {
          aboutPane.appendChild(ch);
        }
      });
      // Also get nested leftovers by id
      ['profile-status', 'profile-about', 'profile-member-since-section', 'profile-actions'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.parentElement !== aboutPane && !aboutPane.contains(el)) {
          // if parent is section, move section
          const sec = el.closest('.zpc-section') || el.closest('.zpc-status') || el;
          if (sec.parentElement === infoEl || sec.parentElement === bodyEl) aboutPane.appendChild(sec);
        }
      });
      infoEl.appendChild(aboutPane);
    }

    let wishPane = document.getElementById('profile-tab-wishlist');
    if (!wishPane) {
      wishPane = document.createElement('div');
      wishPane.id = 'profile-tab-wishlist';
      wishPane.className = 'profile-tab-pane';
      infoEl.appendChild(wishPane);
    }

    const wishIds = Array.isArray(user.wishlist) ? user.wishlist : (user.id === currentUser?.id ? getWishlist() : []);
    const allItems = [...(SHOP_DECOS||[]), ...(SHOP_EFFECTS||[]), ...(SHOP_NITRO||[])];
    const isMe = currentUser && user.id === currentUser.id;
    const canGift = currentUser && !isMe;

    let header = '<div class="profile-wish-header"><span class="profile-wish-title">' + wishIds.length + ' article' + (wishIds.length > 1 ? 's' : '') + '</span>';
    if (isMe) header += '<button type="button" class="profile-wish-browse" id="profile-wish-browse">Parcourir la Boutique</button>';
    header += '</div>';

    if (!wishIds.length) {
      wishPane.innerHTML = header + '<div class="profile-wish-empty">Aucun article souhaité</div>';
    } else {
      const cards = wishIds.map(id => {
        const item = allItems.find(x => x.id === id);
        if (!item) return '';
        return '<button type="button" class="profile-wish-tile"'
          + (canGift ? ' data-gift-item="' + item.id + '"' : '')
          + ' title="' + String(item.name||'').replace(/"/g,'') + '">'
          + '<div class="profile-wish-tile-media"><img src="' + (item.img||'') + '" alt=""></div>'
          + (canGift ? '<span class="profile-wish-tile-gift">Offrir</span>' : '')
          + '</button>';
      }).join('');
      wishPane.innerHTML = header + '<div class="profile-wish-grid">' + cards + '</div>';
      wishPane.querySelectorAll('[data-gift-item]').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const item = allItems.find(x => x.id === btn.getAttribute('data-gift-item'));
          if (!item) return;
          closeProfile();
          openGiftModal(item);
          setTimeout(() => {
            const toId = document.getElementById('gift-to-id');
            const toName = document.getElementById('gift-to-name');
            const sel = document.getElementById('gift-friend-selected');
            if (toId) toId.value = user.id;
            if (toName) toName.value = user.username || '';
            if (sel) {
              const bg = user.avatarColor || '#5865f2';
              const av = user.avatarUrl ? '<img src="'+user.avatarUrl+'">' : '<span>'+((user.username||'?')[0].toUpperCase())+'</span>';
              sel.innerHTML = '<div class="gift-friend-av" style="background:'+bg+'">'+av+'</div><span class="gift-friend-name">'+String(user.username||'').replace(/</g,'')+'</span>';
            }
          }, 50);
        };
      });
    }
    document.getElementById('profile-wish-browse')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeProfile();
      if (typeof openShop === 'function') openShop();
    });

    const switchTab = (tab) => {
      tabsBar.querySelectorAll('.profile-tab').forEach(b => b.classList.toggle('active', b.dataset.ptab === tab));
      aboutPane.classList.toggle('active', tab === 'about');
      wishPane.classList.toggle('active', tab === 'wishlist');
    };
    tabsBar.querySelectorAll('.profile-tab').forEach(b => {
      b.onclick = (e) => { e.stopPropagation(); switchTab(b.dataset.ptab); };
    });
    switchTab('about');

    const oldWish = document.getElementById('profile-wishlist');
    if (oldWish) oldWish.style.display = 'none';
  } catch (e) { console.warn('wishlist profile', e); }




  

  modal.classList.remove('hidden');
}

function closeProfile() { document.getElementById('profile-modal').classList.add('hidden'); }
document.getElementById('profile-overlay')?.addEventListener('click', closeProfile);

// ===== Upload helpers (avatar / bannière en fichier local) =====
let pendingEditAvatar = null;   // dataURL or null (null = keep current, '' = clear)
let pendingEditBanner = null;

/** Compresse une image base64 pour passer sous la limite socket (~5 Mo).
 *  Les GIF (et animations) sont renvoyés TELSquels — pas de canvas (sinon plus d'anim). */
function compressImageDataUrl(dataUrl, maxW, maxH, quality) {
  return new Promise((resolve) => {
    try {
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
        resolve(dataUrl);
        return;
      }
      // Ne JAMAIS convertir les GIF (garde l'animation)
      const header = dataUrl.slice(0, 40).toLowerCase();
      if (header.includes('image/gif')) {
        resolve(dataUrl);
        return;
      }
      // PNG/WebP animes rares : si tres gros on laisse tel quel plutot que casser
      if (header.includes('image/webp') && dataUrl.length < 4e6) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const mw = maxW || 512, mh = maxH || 512;
        if (w > mw || h > mh) {
          const r = Math.min(mw / w, mh / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        // Garder PNG si transparence, sinon JPEG
        const hasAlpha = header.includes('image/png');
        let out = hasAlpha
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', quality || 0.82);
        if (out.length > 1.5e6 && !hasAlpha) out = canvas.toDataURL('image/jpeg', 0.65);
        if (out.length > 2.5e6 && !hasAlpha) out = canvas.toDataURL('image/jpeg', 0.5);
        resolve(out);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch (e) {
      resolve(dataUrl);
    }
  });
}
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

let editSelectedDeco = 'none';
let editSelectedEffect = 'none';

function getEditDraft() {
  const avatarUrl = pendingEditAvatar !== undefined ? (pendingEditAvatar || null) : (currentUser?.avatarUrl || null);
  const bannerUrl = pendingEditBanner !== undefined ? (pendingEditBanner || null) : (currentUser?.bannerUrl || null);
  return {
    username: document.getElementById('edit-username')?.value.trim() || currentUser?.username || 'User',
    customStatus: document.getElementById('edit-status')?.value.trim() || '',
    primaryColor: document.getElementById('edit-primary-color')?.value || null,
    secondaryColor: document.getElementById('edit-secondary-color')?.value || null,
    avatarUrl,
    bannerUrl,
    avatarDeco: editSelectedDeco,
    profileEffect: editSelectedEffect,
    avatarColor: currentUser?.avatarColor || '#5865f2'
  };
}

function refreshEditPreview() {
  if (!currentUser) return;
  const d = getEditDraft();
  const banner = document.getElementById('edit-preview-banner');
  const avatar = document.getElementById('edit-preview-avatar');
  const card = document.getElementById('edit-preview-card');
  const body = document.getElementById('edit-preview-content');
  const uname = document.getElementById('edit-preview-username');
  const handle = document.getElementById('edit-preview-handle');
  const status = document.getElementById('edit-preview-status');
  const about = document.getElementById('edit-preview-about');
  if (!banner || !avatar || !card) return;

  const p = d.primaryColor || '#5865f2';
  const s = d.secondaryColor || p;
  const ac = d.avatarColor || '#5865f2';

  // Banner: always visible top strip
  banner.style.height = '120px';
  banner.style.minHeight = '120px';
  banner.style.display = 'block';
  if (d.bannerUrl) {
    banner.style.backgroundImage = `url("${String(d.bannerUrl).replace(/"/g, '%22')}")`;
    banner.style.backgroundSize = 'cover';
    banner.style.backgroundPosition = 'center';
    banner.style.backgroundColor = 'transparent';
  } else {
    banner.style.backgroundImage = 'none';
    // Darker version of primary so the strip is always distinct from the body
    banner.style.backgroundColor = ac !== p ? ac : '#111214';
  }

  // Avatar circle
  if (d.avatarUrl) {
    avatar.innerHTML = '';
    avatar.style.background = 'transparent';
    const img = document.createElement('img');
    img.src = d.avatarUrl;
    img.alt = '';
    avatar.appendChild(img);
  } else {
    avatar.innerHTML = '';
    avatar.style.background = (ac.toLowerCase() === p.toLowerCase()) ? '#1e1f22' : ac;
    avatar.textContent = (d.username || '?')[0].toUpperCase();
  }
  avatar.style.borderColor = p;

  // Force avatar wrap geometry so deco centers correctly
  const wrap = document.getElementById('edit-preview-avatar-wrap') || avatar.parentElement;
  if (wrap) {
    wrap.style.position = 'absolute';
    wrap.style.top = '-40px';
    wrap.style.left = '16px';
    wrap.style.width = '92px';
    wrap.style.height = '92px';
    wrap.style.overflow = 'visible';
    wrap.style.zIndex = '30';
  }

  if (uname) uname.textContent = d.username;
  if (handle) {
    const st = currentUser?.presenceStatus || 'online';
    handle.textContent = (d.username || '').toLowerCase().replace(/\s/g, '') + ' • ' + (STATUS_LABELS[st] || 'en ligne').toLowerCase();
  }
  if (status) status.textContent = d.customStatus || 'Pas de statut personnalisé';
  if (about) about.textContent = d.customStatus || 'Aucune bio pour le moment.';

  if (body) body.style.background = `linear-gradient(180deg, ${p} 0%, ${s} 100%)`;


  // Badges in edit preview
  let badgesPreview = document.getElementById('edit-preview-badges');
  if (!badgesPreview && body) {
    badgesPreview = document.createElement('div');
    badgesPreview.id = 'edit-preview-badges';
    badgesPreview.className = 'zpc-badges';
    const handleNode = document.getElementById('edit-preview-handle');
    if (handleNode && handleNode.parentNode) {
      handleNode.parentNode.insertBefore(badgesPreview, handleNode.nextSibling);
    } else {
      body.appendChild(badgesPreview);
    }
  }
  if (badgesPreview) {
    const blist = (currentUser.badges || []).slice(0, 12);
    badgesPreview.innerHTML = blist.map(b => {
      let icon = (BADGE_ICONS[b] || '🏅')
        .replace(/width="\d+"/gi, 'width="22"')
        .replace(/height="\d+"/gi, 'height="22"');
      return '<span class="badge" data-badge="' + b + '" style="width:22px;height:22px;display:inline-flex;">' + icon + '</span>';
    }).join('');
    badgesPreview.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:6px 0 8px 0;';
    badgesPreview.querySelectorAll('img,svg').forEach(el => {
      el.style.width = '22px';
      el.style.height = '22px';
    });
    bindBadgeTooltips(badgesPreview);
  }

  applyProfileEffect(card, d.profileEffect || 'none');
  requestAnimationFrame(() => applyAvatarDeco(avatar, d.avatarDeco || 'none'));
}

function openEditProfile() {
  if (typeof refreshEffectOptionsInSettings === 'function') refreshEffectOptionsInSettings();
  if (typeof refreshDecoOptionsInSettings === 'function') refreshDecoOptionsInSettings();
  pendingEditAvatar = undefined;
  pendingEditBanner = undefined;
  editSelectedDeco = currentUser.avatarDeco || 'none';
  editSelectedEffect = currentUser.profileEffect || 'none';
  if (typeof refreshDiscordTiles === 'function') setTimeout(refreshDiscordTiles, 50);
  const statusEl = document.getElementById('edit-status');
  if (statusEl) statusEl.value = currentUser.customStatus || '';
  setPreview('edit-avatar-preview', currentUser.avatarUrl || null);
  setPreview('edit-banner-preview', currentUser.bannerUrl || null);
  const unameField = document.getElementById('edit-username');
  if (unameField) unameField.value = currentUser.username || '';
  const ep = document.getElementById('edit-primary-color');
  const es = document.getElementById('edit-secondary-color');
  if (ep) ep.value = currentUser.primaryColor || currentUser.avatarColor || '#5865f2';
  if (es) es.value = currentUser.secondaryColor || currentUser.primaryColor || currentUser.avatarColor || '#eb459e';
  document.querySelectorAll('#edit-deco-grid .deco-option').forEach(o => {
    o.classList.toggle('active', o.dataset.deco === editSelectedDeco);
  });
  document.querySelectorAll('#edit-effect-grid .effect-option').forEach(o => {
    o.classList.toggle('active', o.dataset.effect === editSelectedEffect);
  });
  document.getElementById('edit-profile-modal').classList.remove('hidden');
  refreshEditPreview();
}
function closeEditProfile() { document.getElementById('edit-profile-modal').classList.add('hidden'); }
document.getElementById('edit-overlay')?.addEventListener('click', closeEditProfile);
document.getElementById('edit-cancel')?.addEventListener('click', closeEditProfile);
document.getElementById('edit-save')?.addEventListener('click', async () => {
  const btn = document.getElementById('edit-save');
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement...'; }

  const payload = {
    customStatus: (document.getElementById('edit-status')?.value || '').trim(),
    username: (document.getElementById('edit-username')?.value || '').trim() || currentUser?.username,
    primaryColor: document.getElementById('edit-primary-color')?.value || null,
    secondaryColor: document.getElementById('edit-secondary-color')?.value || null,
    avatarDeco: (typeof editSelectedDeco !== 'undefined' ? editSelectedDeco : null) || currentUser?.avatarDeco || 'none',
    profileEffect: (typeof editSelectedEffect !== 'undefined' ? editSelectedEffect : null) || currentUser?.profileEffect || 'none'
  };

  try {
    if (pendingEditAvatar !== undefined) {
      payload.avatarUrl = pendingEditAvatar
        ? await compressImageDataUrl(pendingEditAvatar, 256, 256, 0.85)
        : null;
    }
    if (pendingEditBanner !== undefined) {
      payload.bannerUrl = pendingEditBanner
        ? await compressImageDataUrl(pendingEditBanner, 960, 340, 0.8)
        : null;
    }
  } catch (e) {
    console.warn('compress', e);
    if (pendingEditAvatar !== undefined) payload.avatarUrl = pendingEditAvatar || null;
    if (pendingEditBanner !== undefined) payload.bannerUrl = pendingEditBanner || null;
  }

  // Mise a jour locale immediate (ne pas attendre le serveur)
  if (currentUser) {
    Object.assign(currentUser, {
      customStatus: payload.customStatus,
      username: payload.username || currentUser.username,
      primaryColor: payload.primaryColor,
      secondaryColor: payload.secondaryColor,
      avatarDeco: payload.avatarDeco,
      profileEffect: payload.profileEffect
    });
    if (payload.avatarUrl !== undefined) currentUser.avatarUrl = payload.avatarUrl;
    if (payload.bannerUrl !== undefined) currentUser.bannerUrl = payload.bannerUrl;
    try { updateUserPanel(); } catch (e) {}
    try { populateAccountMenu(); } catch (e) {}
  }

  socket.emit('updateProfile', payload);
  closeEditProfile();
  if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer'; }
  pendingEditAvatar = undefined;
  pendingEditBanner = undefined;
});

// Wire edit modal uploads + live preview
// Avatar / banner via pencil on preview (file inputs only)
function wireFileOnly(fileId, onData) {
  const input = document.getElementById(fileId);
  if (!input || input.dataset.wired) return;
  input.dataset.wired = '1';
  input.addEventListener('change', () => {
    const f = input.files && input.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => onData(reader.result);
    reader.readAsDataURL(f);
    input.value = '';
  });
}
wireFileOnly('edit-avatar-file', (d) => { pendingEditAvatar = d; refreshEditPreview(); });
wireFileOnly('edit-banner-file', (d) => { pendingEditBanner = d; refreshEditPreview(); });

['edit-username', 'edit-status', 'edit-primary-color', 'edit-secondary-color'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', refreshEditPreview);
  el.addEventListener('change', refreshEditPreview);
});
document.querySelectorAll('#edit-deco-grid .deco-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('#edit-deco-grid .deco-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    editSelectedDeco = opt.dataset.deco;
    refreshEditPreview();
  });
});
document.querySelectorAll('#edit-effect-grid .effect-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('#edit-effect-grid .effect-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    editSelectedEffect = opt.dataset.effect;
    refreshEditPreview();
  });
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

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const content = messageInput.value.trim();
  if (!content) return;
  // Ensure we have a real channel id
  if (!currentDM) {
    const active = document.querySelector('.channel-item.active');
    if (active && active.dataset.channel) currentChannel = active.dataset.channel;
    if (!currentChannel || currentChannel === 'general') currentChannel = 'zeyscord_general';
  }
  const channelId = currentDM
    ? ('dm_' + [currentUser.id, currentDM].sort().join('_'))
    : currentChannel;
  if (currentUser) {
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    appendMessage({
      id: tempId,
      content,
      author: currentUser,
      timestamp: new Date().toISOString(),
      channelId,
      _temp: true
    });
    scrollToBottom();
  }
  if (currentDM) {
    socket.emit('sendMessage', { content, dmTargetId: currentDM });
  } else {
    socket.emit('sendMessage', { content, channelId: currentChannel });
  }
  messageInput.value = '';
  messageInput.focus();
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
  // dedupe by id
  const seen = new Set();
  guilds.forEach(g => {
    if (!g || !g.id || seen.has(g.id)) return;
    seen.add(g.id);
    const el = document.createElement('div');
    el.className = 'server-icon' + (g.id === currentGuild && currentView === 'server' ? ' active' : '');
    el.title = g.name;
    if (g.iconUrl) {
      el.innerHTML = '';
      el.style.backgroundImage = `url("${String(g.iconUrl).replace(/"/g, '')}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundColor = 'transparent';
    } else {
      el.style.backgroundImage = '';
      el.innerHTML = '<span>' + escapeHtml((g.icon || g.name[0] || 'S').toString().substring(0, 2)) + '</span>';
    }
    el.onclick = () => {
      currentGuild = g.id;
      socket.emit('joinGuild', g.id);
      switchView('server');
      renderServers();
      if (window.__zeyMobile?.isMobile?.()) window.__zeyMobile.showChannelsList();
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
    // Force display (mobile CSS)
    if (homeView) homeView.style.display = '';
    if (serverView) serverView.style.display = 'none';
    homeBtn?.classList.add('active');
    serverBtn?.classList.remove('active');
    document.querySelectorAll('#servers-list .server-icon').forEach(el => el.classList.remove('active'));
    if (membersSidebar) membersSidebar.style.display = 'none';
    currentChannelName.textContent = 'Amis';
    messageInput.placeholder = 'Sélectionne un ami pour discuter...';
    if (!currentDM) {
      setHomeTab('friends');
    }
    renderFriends();
  } else {
    homeView?.classList.add('hidden');
    serverView?.classList.remove('hidden');
    if (homeView) homeView.style.display = 'none';
    if (serverView) serverView.style.display = '';
    homeBtn?.classList.remove('active');
    serverBtn?.classList.add('active');
    if (membersSidebar) membersSidebar.style.display = '';
    document.getElementById('friends-panel')?.classList.add('hidden');
    document.getElementById('messages-container')?.classList.remove('hidden');
    document.getElementById('message-form')?.classList.remove('hidden');
    const ch = document.querySelector('.chat-header');
    if (ch) ch.style.display = '';
    currentDM = null;
    if (currentChannel) {
      socket.emit('joinChannel', currentChannel);
    } else {
      socket.emit('joinChannel', currentChannel || 'zeyscord_general');
    }
  }
}

document.getElementById('home-btn')?.addEventListener('click', () => {
  switchView('home');
  if (window.__zeyMobile?.isMobile?.()) window.__zeyMobile.showChannelsList();
});
document.getElementById('server-btn')?.addEventListener('click', () => switchView('server'));

// Open DM also switches to home view + affiche le chat
const _openDM = openDM;
openDM = function(userId) {
  if (!userId) return;
  switchView('home');
  currentDM = userId;
  socket.emit('joinDM', userId);
  document.getElementById('friends-panel')?.classList.add('hidden');
  document.getElementById('messages-container')?.classList.remove('hidden');
  document.getElementById('message-form')?.classList.remove('hidden');
  const ch = document.querySelector('.chat-header');
  if (ch) ch.style.display = '';
  const target = (typeof onlineUsers !== 'undefined' ? onlineUsers.find(u => u.id === userId) : null)
    || (typeof friends !== 'undefined' ? friends.find(u => u.id === userId) : null);
  if (target && typeof currentChannelName !== 'undefined' && currentChannelName) {
    currentChannelName.textContent = '@' + target.username;
  }
  const mi = document.getElementById('message-input');
  if (mi && target) mi.placeholder = 'Message @' + target.username;
  if (typeof renderFriends === 'function') renderFriends();
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
  const sp = document.getElementById('settings-primary-color');
  const ss = document.getElementById('settings-secondary-color');
  if (sp) sp.value = currentUser.primaryColor || currentUser.avatarColor || '#5865f2';
  if (ss) ss.value = currentUser.secondaryColor || currentUser.primaryColor || currentUser.avatarColor || '#eb459e';
  updateSettingsColorPreview();
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

function updateSettingsColorPreview() {
  const p = document.getElementById('settings-primary-color')?.value || '#5865f2';
  const s = document.getElementById('settings-secondary-color')?.value || '#eb459e';
  const prev = document.getElementById('settings-color-preview');
  if (prev) prev.style.background = `linear-gradient(90deg, ${p}, ${s})`;
}
document.getElementById('settings-primary-color')?.addEventListener('input', updateSettingsColorPreview);
document.getElementById('settings-secondary-color')?.addEventListener('input', updateSettingsColorPreview);
document.getElementById('settings-colors-reset')?.addEventListener('click', () => {
  const defP = currentUser?.avatarColor || '#5865f2';
  const sp = document.getElementById('settings-primary-color');
  const ss = document.getElementById('settings-secondary-color');
  if (sp) sp.value = defP;
  if (ss) ss.value = defP;
  updateSettingsColorPreview();
});

document.getElementById('save-profile')?.addEventListener('click', async () => {
  const payload = {
    customStatus: (document.getElementById('settings-bio')?.value || '').trim(),
    avatarDeco: (typeof selectedDeco !== 'undefined' ? selectedDeco : null) || currentUser?.avatarDeco || 'none',
    profileEffect: (typeof selectedEffect !== 'undefined' ? selectedEffect : null) || currentUser?.profileEffect || 'none',
    primaryColor: document.getElementById('settings-primary-color')?.value || null,
    secondaryColor: document.getElementById('settings-secondary-color')?.value || null
  };
  try {
    if (pendingSettingsAvatar !== undefined) {
      payload.avatarUrl = pendingSettingsAvatar
        ? await compressImageDataUrl(pendingSettingsAvatar, 256, 256, 0.85)
        : null;
    }
    if (pendingSettingsBanner !== undefined) {
      payload.bannerUrl = pendingSettingsBanner
        ? await compressImageDataUrl(pendingSettingsBanner, 960, 340, 0.8)
        : null;
    }
  } catch (e) {
    if (pendingSettingsAvatar !== undefined) payload.avatarUrl = pendingSettingsAvatar || null;
    if (pendingSettingsBanner !== undefined) payload.bannerUrl = pendingSettingsBanner || null;
  }
  if (currentUser) {
    Object.assign(currentUser, {
      customStatus: payload.customStatus,
      avatarDeco: payload.avatarDeco,
      profileEffect: payload.profileEffect,
      primaryColor: payload.primaryColor,
      secondaryColor: payload.secondaryColor
    });
    if (payload.avatarUrl !== undefined) currentUser.avatarUrl = payload.avatarUrl;
    if (payload.bannerUrl !== undefined) currentUser.bannerUrl = payload.bannerUrl;
    try { updateUserPanel(); } catch (e) {}
  }
  socket.emit('updateProfile', payload);
  pendingSettingsAvatar = undefined;
  pendingSettingsBanner = undefined;
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
  {
    "id": "hugh_the_rainbow",
    "name": "Hugh the Rainbow",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_0c0eeb351ae2cf48c6e1eee2cae49d40.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "phoenix",
    "name": "Phoenix",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_0e839cd79500e7b68e2bbbed54790c28.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "firecrackers",
    "name": "Firecrackers",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_0f4f1b40921ce680b60007e94427d1f2.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "flaming_sword",
    "name": "Flaming Sword",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_0f5d6c4dd8ae74662ee9c40722a56cbd.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "ramenbowl",
    "name": "RamenBowl",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_001e956faa73bd0410c455234c62818f.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "steampunk_cat_ears",
    "name": "Steampunk Cat Ears",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_1acbe609daec21fa5b866df9e5a42cb7.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "lucky_envelopes",
    "name": "Lucky Envelopes",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_1b1df0ae8c2d34afd85da5c22a0d761a.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "magical_potion",
    "name": "Magical Potion",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_1dbc603c181999b9815cb426dfec71a6.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "akuma",
    "name": "Akuma",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_1e8cb6070b13f775a41384c84c5a53e1.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "next_turn_button",
    "name": "Next Turn Button",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_2b95e7a4951a1a092e7870bf1d456262.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "snowglobe",
    "name": "Snowglobe",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_2ca5fb1ecf0dac410b38d76cb4aae7f9.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "feelin_nervous",
    "name": "Feelin'Nervous",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_2d792aad5003faf6809e26879a7eae6b.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "lotus_flower",
    "name": "Lotus Flower",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_2e55d644e11acb6253dfa422eff16dfd.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "angry",
    "name": "Angry",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_3c97a2d37f433a7913a1c7b7a735d000.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "owlbear_cub",
    "name": "Owlbear Cub",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_3c5743cedcb72131c58278278a97c143.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "straw_hat",
    "name": "Straw Hat",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_3d1e6078b2e4c8865e0ad0f429d651b1.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "heartbloom",
    "name": "Heartbloom",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_3e1fc3c7ee2e34e8176f4737427e8f4f.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "candlelight",
    "name": "Candlelight",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_3f29e6edfe1cff43736f644cf1d01278.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "treasure_and_key",
    "name": "Treasure and Key",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_4c9f2ec29c05755456dbce45d8190ed4.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "in_tears",
    "name": "in Tears",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_4cc97277177b166fd7d4af3bdb370815.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "butterflies",
    "name": "Butterflies",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_4cd9ae5a8d103c219eacd3674d7730cd.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "zombie_food",
    "name": "Zombie Food",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_4f2b75e5adff09709702613ea0e2cb70.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "bubble_tea",
    "name": "Bubble Tea",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_5b1319abfc9f928479b68a73635f591d.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "witch_hat_plum",
    "name": "Witch Hat (Plum)",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_5e8abacc7a7454d6b08b5cc84cac1d80.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "shy",
    "name": "Shy",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_6b793a5f7e4e15eea6b10a4fde448511.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "black_hole",
    "name": "Black Hole",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_6d16b27d9415cafe3b289053644337c4.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "mirage",
    "name": "Mirage",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_6d99f670de3fcee669660fe262e896ea.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "ufo",
    "name": "UFO",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_6fdbddb6229453eac3bbb212edf5cd1c.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "aespa_fanlight",
    "name": "aespa Fanlight",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_007d64a922ff5773fb9464945de93c8e.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "sakura_warrior",
    "name": "Sakura Warrior",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_7cf09c7e78d6eb35ae354acc1d5cc676.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "fox_hat",
    "name": "Fox Hat",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_7d305bca6cf371df98c059f9d2ef05e4.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "lovestruck",
    "name": "Lovestruck",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_7f44d538ec830f479605f7bf8720afda.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "crossbones",
    "name": "Crossbones",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_7f863078aee4932cd50ee4e3b55d3035.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "group_hug",
    "name": "Group Hug",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_8ad98d25ee4e4512704f759476eeb294.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "pipedream",
    "name": "Pipedream",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_8c17e799bfeffa797042569a1ebcafc0.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "hex_tiles",
    "name": "Hex Tiles",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_8dddba8c2a9704a943bb7020a3d0a418.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "crystal_ball_blue",
    "name": "Crystal Ball (Blue)",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_8ee8ae54bddfcb17d7d5c5f9bce41c0d.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "in_love",
    "name": "In Love",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_8ffa2ba9bff18e96b76c2e66fd0d7fa3.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "hex_lights",
    "name": "Hex Lights",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_09bb4197c743ea31b7eb052eddd3e892.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "frag_out",
    "name": "FRAG OUT",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_09de63526a45be1ddac70e84718ee04a.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "solar_orbit",
    "name": "Solar Orbit",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_9a6bf0ab30a6719d6eb09fa4996984ca.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "the_monster_you_created",
    "name": "The Monster You Created",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_9bc421cef4bdcfffeb2344b44ad91b44.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "good_ol_pepper",
    "name": "Good Ol'Pepper",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_9cc1c1426ea5478aac7be6cdefdbc568.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "fan_flourish",
    "name": "Fan Flourish",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_9d2ff9685be0c668ef6990b0035fac17.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "skull_medallion",
    "name": "Skull Medallion",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_9d67a1cbf81fe7197c871e94f619b04b.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "tarrain_tiles",
    "name": "Tarrain Tiles",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_9d95e36bc282523fddc63d31a8d01091.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "feelin_scrumptious",
    "name": "Feelin'Scrumptious",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_9d35467f282b8c72a26f5aa40aa2a637.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "red_lantern",
    "name": "Red Lantern",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_9e16d86b2887eb2a3bed36a5b8876935.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "mooncaps_blue",
    "name": "Mooncaps (Blue)",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_25f7407a6a0c5de43736a1f24c3b7979.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "honeyblossom",
    "name": "Honeyblossom",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_27bbf0b53b1054cf61e9a4c0e8d4027f.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "string_lights_dusk",
    "name": "String Lights (Dusk)",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_28e531da18a80b8287837332154c5f58.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "defensive_shield",
    "name": "Defensive Shield",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_29a0533cb3de61aa8179810188f3830d.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "heartstrings_blue",
    "name": "Heartstrings (Blue)",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_42cc3fe7133523096466102e7a222003.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "magical_girl",
    "name": "Magical Girl",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_45f7f9975255971b197d34d77fb50ede.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "unicorn",
    "name": "Unicorn",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_47c0f4b4a837894998d5a316acf74f87.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "chromawave",
    "name": "Chromawave",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_49c479e15533fb4c02eb320c9c137433.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "rocket_puncher",
    "name": "Rocket Puncher",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_49ed38f73003e2e182f77190af0a0a56.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "slither_n_snack",
    "name": "Slither'n Snack",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_49ffdb1883d8c644a8eb68711ee58be9.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "koi_pond",
    "name": "Koi Pond",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_50b440810b1bbd89f6284f36d40ad0af.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "faces_of_the_moon",
    "name": "Faces of the Moon",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_50cfb73a4c52235363491855d3c3c3bc.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "dismay",
    "name": "Dismay",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_51d3bb502109eec26c76386ec980bc8b.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "sweat_drops",
    "name": "Sweat Drops",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_55c9d0354290afa8b7fe47ea9bd7dbcf.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "lofi_girl_outfit",
    "name": "Lofi Girl Outfit",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_60cb281fac6d8f558efaf6dd9fe4dbe4.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "viper_poison_cloud",
    "name": "Viper Poison Cloud",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_62cd9d7c0031a7c1eb5ad5cc96992189.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "heartstrings_red",
    "name": "Heartstrings (Red)",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_63a69109db554a66764cbe61c6e556ef.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "lunar_lanterns",
    "name": "Lunar Lanterns",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_63b29ec5b1ea6bb01c2251049838d822.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "string_lights_ember",
    "name": "String Lights (Ember)",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_63d17f42ee46a843d99a58655910bc6a.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "m_bison",
    "name": "M. Bison",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_66f69effef43b4f7c4f5d0739079a947.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "ryu",
    "name": "Ryu",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_68cb6c21d6222cd9285c08068f39873d.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "magic_portal_purple",
    "name": "Magic Portal (Purple)",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_72d1fd7c47cc7a98c8f64d175773344b.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "cozy_cat",
    "name": "Cozy Cat",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_77b7b6a740a9451e1ef39c0252154ef8.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "scallywag",
    "name": "Scallywag",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_78f326d95c0193c317470e3e81db81e7.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "balance",
    "name": "Balance",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_82e4df4028396ad5ccaaafb397fa6248.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "fishbones",
    "name": "FISHBONES!",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_84a67b33ef5b75e17f858a95648c973f.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "string_lights",
    "name": "String Lights",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_88f42fb7360d8224a670a50c3496f315.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "valorant_champions_2024",
    "name": "VALORANT Champions 2024",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_90e0dce3cc48c4a9607b6d41209c737e.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "cannon_fire",
    "name": "Cannon Fire",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_91a33236cf2728310a3a29bbdc8e0d29.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "playful_lofi_cat",
    "name": "Playful Lofi Cat",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_96f65d0aacc4a94b50ef7fb656d5826d.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "crystal_elk",
    "name": "Crystal Elk",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_98c7600d304b86ca3b18272e1da05559.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "magic_portal_blue",
    "name": "Magic Portal (Blue)",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_98cf94e029ac79c5b377413d1a2bd82f.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "implant",
    "name": "Implant",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_172fa9da0af8698e37f5e5de76637439.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "cottage_home",
    "name": "Cottage Home",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_210b82b98876083ce393ecd92eb07260.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "bloomling",
    "name": "Bloomling",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_306a56249fe3c3d2bc7a30041cb63e0e.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "lightning",
    "name": "Lightning",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_365eed4178528fe8293c4212e8e2d5cb.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "mech_flora",
    "name": "Mech flora",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_459cf2afde41f01559a4a4204ab81767.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "lava_lamp_bundle",
    "name": "Lava Lamp Bundle",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_462b0bddc07dd495765fe12abe8b077f.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "mallow_jump",
    "name": "Mallow Jump",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_492f6b54b761c0a14d9dbc9c98aaa0f5.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "dancing_fairies",
    "name": "Dancing fairies",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_535aa3354b1a7395c271bb2f53be4275.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "air",
    "name": "Air",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_554b7c34f7b6c709f19535aacb128e7b.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "rose_bearer",
    "name": "Rose Bearer",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_555ad9b90a13534180b9274d013e3651.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "power_by_shimmer",
    "name": "Power by shimmer",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_609fb5c17a4d5ff2e2bec1a1931a9caa.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "head_in_the_clouds",
    "name": "Head in the clouds",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_670b722e56740d11d1e6fe55b8094013.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "fall_leaves",
    "name": "fall leaves",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_720a2045510ec16f9878237d2ff9873f.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "pirate_captain",
    "name": "Pirate captain",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_798a5bcbb11067e4d9ab339e51d2a16c.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "blade_storm",
    "name": "Blade storm",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_904b1989077c91fca1168d39bfcaa0a4.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "guile",
    "name": "Guile",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_993ac691660d3d67b500d995e121b220.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "sproutling",
    "name": "sproutling",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_3012fad396abbf24e325431800b51510.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "midnight_sorceress",
    "name": "Midnight Sorceress",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_4430a4ee89b7fba456e765db21f38485.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "doodling",
    "name": "Doodling",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_5873ecaa76fb549654b40095293f902e.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "sleepy_chilledcow",
    "name": "Sleepy chilledcow",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_6649e251a23f24935471ee02c212675b.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "armamenter",
    "name": "Armamenter",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_6912c651e979fbfdc479ed082a571513.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "flame_chompers",
    "name": "Flame Chompers",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_8396e9830e3e288cd3aaa6daf18b605a.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "constellations",
    "name": "Constellations",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_8552f9857793aed0cf816f370e2df3be.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "cat_onesie",
    "name": "cat onesie",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_9661cf3296ac236d8815e3f5b809a467.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "strawberry_vine",
    "name": "Strawberry Vine",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_9867b1ba56601e745cfe741e6b00b835.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "sakura_lnk",
    "name": "sakura lnk",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_13913a00bd9990ab4102a3bf069f0f3f.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "spooky_cat_ears",
    "name": "spooky cat Ears",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_33656b7ed12cde00c1826b654cf65590.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "dark_hood",
    "name": "Dark Hood",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_41445f736db3525135b6b9e1122f2254.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "sushi_roll",
    "name": "sushi roll",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_44045ae47175eaca4ed1b4d889b62b27.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "gelatinous_cube",
    "name": "Gelatinous Cube",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_66604bb5c9351541f30c20a4e78c239c.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "feelin_awe",
    "name": "Feelin' awe",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_89155faed81b205d59fbbefa4316952d.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "dice",
    "name": "Dice",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_94191be95bb9c471ff17644f3639eb6d.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "a_hint_of_clove",
    "name": "A hint of clove",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_98555e40cc6802bd3a4fed906af1d992.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "neon_nibbles",
    "name": "Neon Nibbles",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_126219d37fa9422dab6a075064453750.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "water",
    "name": "Water",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_250640ab00a8837a1d56f35879138177.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "dragon_s_smile",
    "name": "Dragon's smile",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_445566ed965b2c1632a5b45c92f32d11.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "joystick",
    "name": "Joystick",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_795573a62c6d9b583f3029100f90d56b.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "spirit_embers",
    "name": "Spirit Embers",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_1005898c6acf56a9ac5010baf444f6fd.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "got_xenoglossy",
    "name": "Got xenoglossy",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_35713167cc82e0f408c26dfc032a7f0f.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "kabuto",
    "name": "Kabuto",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_084353360ae4f9b5b3b5f186e5525de0.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "aurora",
    "name": "Aurora",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_386445551be850bb16b73a225d0d0602.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "dandelion_duo",
    "name": "Dandelion Duo",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_629689577fa1da2ef0061a5a8c930de1.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "rage",
    "name": "Rage",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_a0db4314b8cc271c8f472357aa895005.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "fresh_pine",
    "name": "Fresh pine",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_a0fafb7c7ee7f1e5b1442f44f3aa14b7.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "ruby_hearts",
    "name": "Ruby hearts",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_a1c0581971d4a296908829289fea2c47.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "city_walls",
    "name": "city walls",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_a4e8e02dbbba6889428c744df7aa5a81.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "polar_bear_hat",
    "name": "Polar Bear hat",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_a7e6467b5332ab7a2b725aa225e6c752.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "dusk_and_dawn",
    "name": "Dusk and Dawn",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_a44e9335ea869639fdf812f3642a56a6.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "reyna_s_leer",
    "name": "Reyna's leer",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_a87e3efa4de2956331831681231ce63b.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "baby_displacer_beast",
    "name": "Baby Displacer Beast",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_a842a9cf76fdaf91a6354937b31ecdef.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "oni_mask",
    "name": "oni mask",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_a21393f8a2cb8eafbdfb5364fb1cbbae.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "fire",
    "name": "Fire",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_a065206df7b011a5510e4e5bca7d49be.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "bowler_hat",
    "name": "Bowler hat",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_a67833d0f3138d7dcdee98c39eae33d7.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "the_petal_pack",
    "name": "The petal pack",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_ab95c78401ce4ec85c25a6d308db9d85.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "the_anomaly",
    "name": "The Anomaly",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_af5ee420e5f860ff2cdbb5fa4633f2cf.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "cypher_neural_theft",
    "name": "cypher Neural Theft",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_b1efe77f379c6c9c6e47e6b6299d5a7d.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "devil",
    "name": "Devil",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_b4dcf63b6af2e20cba91af61c0e3a8a7.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "shocked",
    "name": "shocked",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_b98e8b204d59882fb7f9f7c86922c0bf.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "mooncaps",
    "name": "Mooncaps",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_b13180be7866281f6fa588a49dd7feb0.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "helmsman",
    "name": "Helmsman",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_b98093bb7723235a4cd2792762795640.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "cozy_headphones",
    "name": "cozy Headphones",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_bb71042ccd2ca277a69f086a4f3354d0.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "kitsune",
    "name": "Kitsune",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_be111e4303d634c55500202a61656e0b.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "brass_beats",
    "name": "Brass beats",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_bfaeda83edb41e78250eedc71bed31fc.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "soul_leaving_body",
    "name": "soul Leaving Body",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_c3c09bd122898be35093d0d59850f627.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "cat_ears",
    "name": "cat Ears",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_c3cffc19e9784f7d0b005eecdf1b566e.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "aradiating_energy",
    "name": "ARadiating Energy",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_c7e1751e8122f1b475cb3006966fb28c.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "wizard_hat",
    "name": "Wizard Hat",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_c25b962e5cabb9a656f02c50095d6496.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "shuriken_s_mark",
    "name": "shuriken's mark",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_c32ce5680d4be96e059790ad493aa0fe.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "omen_s_cowl",
    "name": "omen's cowl",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_c45abe8c7585fdb41b8d8d4d666f1588.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "autumn_crown",
    "name": "Autumn crown",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_c509c4760e5e1a50fa341d68f3c1901b.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "digital_sunrise",
    "name": "Digital Sunrise",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_cc83efd93ecd6e41857449c3c0ef9b22.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "golden_hex",
    "name": "Golden Hex",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_ccee9031d66bc0f2d7ed0c6178d01784.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "e_d_hacker",
    "name": "E.D Hacker",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_cdca4a092a03b16b94e50289fe3f7bd1.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "malefic_crown",
    "name": "Malefic Crown",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_d1ea7b8650bf3d64a03304c2ceb7d089.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "magical_wand",
    "name": "Magical Wand",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_d3a9c3a1c89ccb0e1ab8724a5c965f48.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "disxcore_headset",
    "name": "DISXCORE Headset",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_d3da36040163ee0f9176dfe7ced45cdc.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "flux_alchemy",
    "name": "Flux Alchemy",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_d8d93c7a53c0dd07a4074b745210434d.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "glowing_runes",
    "name": "Glowing Runes",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_d650e22f6c4bab4fc0969e9d35edbcb0.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "snake_s_hug",
    "name": "Snake's Hug",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_d859cee893cffd5dd0fa17a6caea44e0.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "starry_eyed",
    "name": "Starry Eyed",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_d72066b8cecbadd9fc951913ebcc384f.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "yoru_bundle",
    "name": "Yoru Bundle",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_da532f804b47f1681006c2996eb07b2a.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "wizard_s_staff",
    "name": "Wizard's Staff",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_db9baf0ba7cf449d2b027c06309dbe8d.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "the_hexcore",
    "name": "The Hexcore",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_dbb1abd90367c1a31a94f7e162f3a3c3.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "juri",
    "name": "Juri",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_dcfe10bac4a782ffb5eefef7a8003115.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "rumbling",
    "name": "Rumbling",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_df5442048d7d5b8b8906f3a9cd93f0ab.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "mix_string_light_bundle",
    "name": "Mix string Light bundle",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_dff769a0f922bb56ab0d4ba2bcbacfae.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "sakura_scholar",
    "name": "Sakura scholar",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_e0a2df84cf7eb8e098a13e37ec9027c1.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "rainy_mood",
    "name": "Rainy Mood",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_e8c11f139e55dac538cdaafb3caa2317.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "aim_for_love",
    "name": "Aim For Love",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_e60cc4d7f4d8a6e79dd8cc67d2b13d6c.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "clyde_invaders",
    "name": "Clyde invaders",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_e72e44eeea89e92dc02c9bec8b02d158.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "glitch",
    "name": "Glitch",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_e90ebc0114e7bdc30353c8b11953ea41.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "uwu_xp",
    "name": "UwU XP",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_e257ca83b5b164968fd036f69dbb2ad9.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "cozy_post_it",
    "name": "Cozy POST-IT",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_e671277ab6d18c0de00871347eed94a7.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "eldritch_ring",
    "name": "Eldritch Ring",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_ef6fe8b27123eacccebe51c92a61587c.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "aracanist_bundle",
    "name": "Aracanist Bundle",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_ef8d97374ffdbf140df1164be6c69e46.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "starlight_whales",
    "name": "Starlight Whales",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_efe3081ee3359a77b515575b5f7bc8c0.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "timekeeper_s_clock",
    "name": "Timekeeper's Clock",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_f1c60c026aa89971e360ba88643d92c0.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "ki_energy",
    "name": "Ki Energy",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_f3af281c65cf0cf590e9e1f59e9c6cf6.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "port_of_soul",
    "name": "Port of Soul",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_f4fcdab859b2eab1874fbe7182d5aa26.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "azure_dice_roll_bundle",
    "name": "Azure Dice Roll Bundle",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_f8ffeba6f389d1475c8794ca88b59785.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "feelin_panic",
    "name": "Feelin' Panic",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_f11c214394044d001d81c983dcab354f.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "a_sphere_of_gusting_wind_swirls_around_the_avatar",
    "name": "A sphere of gusting wind swirls around the avatar.",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_f081c6b2c85c5ebe5df42f1c24d45bb5.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "bunny_zzzs",
    "name": "Bunny Zzzs",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_f438bb9b2f25ac55058fc169ecc8096e.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "ken",
    "name": "Ken",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_f524554b7f42a214d15c226c344a5357.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "oasis",
    "name": "Oasis",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_f740031cc97d1b7eb73c0d0ac1dd09f3.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "cat_ear_headset",
    "name": "Cat Ear Headset",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_fa39ba4d9eff38d2eeb47ebcb623e4ca.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "earht",
    "name": "Earht",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_fa014594d4b2b4249e1098c0adc85b47.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "gold_laurel_wreath",
    "name": "Gold Laurel Wreath",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_fcb0de14da228879b455f1f1d3919749.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "fairy_pixie_bundle",
    "name": "Fairy & Pixie Bundle",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_fe3c76cac2adf426832a7e495e8329d3.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "death_s_edge",
    "name": "Death's Edge",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_fe63036018fefb8abe3172383497e3bf.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "autumn_s_arbor",
    "name": "Autumn's Arbor",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_fead934c894e95e070d8a0301f9f0b27.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  },
  {
    "id": "futuristic_ui",
    "name": "Futuristic UI",
    "img": "https://cdn.discordapp.com/avatar-decoration-presets/a_fed43ab12698df65902ba06727e20c0e.png?size=240&passthrough=true",
    "price": 2.75,
    "type": "deco"
  }
];
const SHOP_EFFECTS = [
  {
    "id": "boost_relic",
    "name": "Boost Relic",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/boost-relic/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "cyberspace",
    "name": "Cyberspace",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/cyberspace/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "hydro_blast",
    "name": "Hydro Blast",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/splash/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "shatter",
    "name": "Shatter",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/earthquake/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "magic_hearts",
    "name": "Magic Hearts",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/magic-girl/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "sakura_dreams",
    "name": "Sakura Dreams",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/sakura/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "power_surge",
    "name": "Power Surge",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/sayan/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "shuriken_strike",
    "name": "Shuriken Strike",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/shuriken/loop3.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "mystic_vines",
    "name": "Mystic Vines",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/vines/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "pixie_dust",
    "name": "Pixie Dust",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/fairy/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "discord_os",
    "name": "Discord-Os",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/cereal/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "breakfast_plate",
    "name": "Breakfast Plate",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/plate/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "ghoulish_graffiti",
    "name": "Ghoulish Graffiti",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/punk-girl/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "dark_omens",
    "name": "Dark Omens",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/ghost-skull/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "zombie_slime",
    "name": "Zombie Slime",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/zombie-slime/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "fall_foliage",
    "name": "Fall Foliage",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/leaves/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "lillypad_life",
    "name": "Lillypad Life",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/rain/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "deck_the_halls",
    "name": "Deck the halls",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/deck-the-halls/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "snowy_shenanigans",
    "name": "Snowy Shenanigans",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/snowy-shenanigans/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "goozilla",
    "name": "Goozilla",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "heartzilla",
    "name": "Heartzilla",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/heartzilla/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "monster_pop",
    "name": "Monster Pop",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/monster-pop/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "nightrunner",
    "name": "Nightrunner",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-18/cyberpunk-nightrunner/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "uplink_error",
    "name": "Uplink Error",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-18/cyberpunk-uplinkerror/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "dragon_dance",
    "name": "Dragon Dance",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-07/dragon-dance/loop_20e743b578.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "fortune_flurry",
    "name": "Fortune Flurry",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-02/fortune-flurry/loop.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "midnight_celebration",
    "name": "Midnight Celebration",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/midnight-celebration/intro.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "rock_slide",
    "name": "Rock Slide",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/rock-slide/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "vortex",
    "name": "Vortex",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/vortex/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "mastery",
    "name": "Mastery",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/mastery/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "dreamy",
    "name": "Dreamy",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/dreamy/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "ki_detonate",
    "name": "Ki Detonate",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/ki-detonate/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "sushi_mania",
    "name": "Sushi Mania",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/sushi-mania/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "petal_serenade",
    "name": "Petal Serenade",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/idle-frame.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "fellowship_of_the_spring",
    "name": "Fellowship of the Spring",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/idle-frame.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "spring_bloom",
    "name": "Spring Bloom",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/idle-flowers.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "clove_s_ruse",
    "name": "Clove's Ruse",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/cloves-ruse/idle_050419ac.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "ace",
    "name": "ACE",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/idle_frame_83d027d7.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "the_immortal_clove",
    "name": "The Immortal Clove",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/the-immortal-clove/idle_8739289c.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "study_spot",
    "name": "Study Spot",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/study-spot/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "all_nighter",
    "name": "All Nighter",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/all-nighter/idle-frame.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "watercolors",
    "name": "Watercolors",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/watercolors/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "shooting_stars",
    "name": "Shooting Stars",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/shooting-stars/loop_b1b5a9936b.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "supernova",
    "name": "Supernova",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/supernova/loop_5835f1730b.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "twilight",
    "name": "Twilight",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/twilight/loop_ff3e249d19.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "feelin_mischievous",
    "name": "Feelin' Mischievous",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/idle_bg.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "feelin_90s",
    "name": "Feelin' 90s",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-70s/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "feelin_pizzazz",
    "name": "Feelin' Pizzazz",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-pizzazz/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "jolly_roger",
    "name": "Jolly Roger",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/jolly-roger/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "forgotten_treasure",
    "name": "Forgotten Treasure",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/forgotten-treasure/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "haunted_man_o_war",
    "name": "Haunted Man O' War",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-13/haunted-man-o-war/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "space_evader",
    "name": "Space Evader",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "turbo_drive",
    "name": "Turbo Drive",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/idle_finish.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "twinkle_trails",
    "name": "Twinkle Trails",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/twinkle-trails/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "saya",
    "name": "Saya",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/saya/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "wake_up",
    "name": "Wake Up!",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/wake-up/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "tocotoco",
    "name": "Tocotoco",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/tocotoco/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "arcane_summons",
    "name": "Arcane Summons",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/arcane-summons/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "vengeance",
    "name": "Vengeance",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/vengeance/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "spirit_flame",
    "name": "Spirit Flame",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/spirit-flame/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "nice_profile",
    "name": "NiCe pRoFiLE",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/nice-profile/idle_a.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "handsome_squidward",
    "name": "Handsome Squidward",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/idle_a.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "doodlebob_takeover",
    "name": "DoodleBob Takeover",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/doodlebob-takeover/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "plankton_splat",
    "name": "Plankton Splat",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-17/plankton-splat/idle.png",
    "price": 2.75,
    "type": "effect"
  },
  {
    "id": "ocean_flowers",
    "name": "Ocean Flowers",
    "img": "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/ocean-flowers/idle.png",
    "price": 2.75,
    "type": "effect"
  }
];
const SHOP_NITRO = [
  { id: 'nitro', name: 'Nitro', img: '/badges/nitro.png', price: 3.00, type: 'nitro', desc: 'Badge Nitro + avantages' }
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

function getWishlist() {
  try {
    const all = JSON.parse(localStorage.getItem('zeyscord_wishlist_by_user') || '{}');
    const key = shopUserKey();
    const list = all[key];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}
function setWishlist(list) {
  try {
    const all = JSON.parse(localStorage.getItem('zeyscord_wishlist_by_user') || '{}');
    all[shopUserKey()] = list;
    localStorage.setItem('zeyscord_wishlist_by_user', JSON.stringify(all));
  } catch {}
}
function isInWishlist(id) {
  return getWishlist().includes(id);
}
function toggleWishlist(id) {
  const list = getWishlist();
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1);
  else list.push(id);
  setWishlist(list);
  if (currentUser) {
    currentUser.wishlist = list.slice();
    try { socket.emit('updateProfile', { wishlist: list }); } catch (e) {}
  }
  return list.includes(id);
}

function getOwnedDecos() {
  if (currentUser && currentUser.isOwner) return (SHOP_DECOS || []).map(i => i.id);
  return shopGet('decos');
}
function setOwnedDecos(list) { shopSet('decos', list); }
function ownDeco(id) {
  const list = getOwnedDecos();
  if (!list.includes(id)) {
    list.push(id);
    setOwnedDecos(list);
  }
  if (typeof refreshDecoOptionsInSettings === 'function') refreshDecoOptionsInSettings();
}
function getOwnedEffects() {
  if (currentUser && currentUser.isOwner) return (SHOP_EFFECTS || []).map(i => i.id);
  return shopGet('effects');
}
function setOwnedEffects(list) { shopSet('effects', list); }
function getOwnedNitro() { return shopGet('nitro'); }
function ownNitro() {
  const list = getOwnedNitro();
  if (!list.includes('nitro')) {
    list.push('nitro');
    setOwnedNitro(list);
  }
  if (currentUser) {
    currentUser.hasNitro = true;
    if (!Array.isArray(currentUser.badges)) currentUser.badges = [];
    if (!currentUser.badges.includes('nitro')) currentUser.badges.push('nitro');
    socket.emit('updateProfile', { hasNitro: true });
  }
  if (typeof updateUserPanel === 'function') updateUserPanel();
  if (typeof renderMembers === 'function') renderMembers();
}
function ownEffect(id) {
  const list = getOwnedEffects();
  if (!list.includes(id)) {
    list.push(id);
    setOwnedEffects(list);
  }
  if (typeof refreshEffectOptionsInSettings === 'function') refreshEffectOptionsInSettings();
}



// ===== Discord-style Effect / Deco picker panels =====
let pickerTempEffect = 'none';
let pickerTempDeco = 'none';

function openEffectPicker() {
  pickerTempEffect = (typeof editSelectedEffect !== 'undefined' ? editSelectedEffect : null) || currentUser?.profileEffect || 'none';
  let modal = document.getElementById('effect-picker-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'effect-picker-modal';
    modal.className = 'picker-modal hidden';
    modal.innerHTML = `
      <div class="picker-overlay" data-close="1"></div>
      <div class="picker-panel">
        <div class="picker-header">
          <div>
            <h2>Changer l'effet de profil</h2>
            <p class="picker-sub">Tes effets</p>
          </div>
          <button type="button" class="picker-x" data-close="1">×</button>
        </div>
        <div class="picker-body">
          <div class="picker-grid" id="effect-picker-grid"></div>
          <div class="picker-preview-col">
            <div class="picker-preview-card" id="effect-picker-preview"></div>
            <div class="picker-item-meta">
              <div class="picker-item-name" id="effect-picker-name">Aucun</div>
            </div>
          </div>
        </div>
        <div class="picker-footer">
          <button type="button" class="btn-secondary" data-close="1">Annuler</button>
          <button type="button" class="btn-primary" id="effect-picker-apply">Appliquer</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => modal.classList.add('hidden')));
    document.getElementById('effect-picker-apply').onclick = () => {
      editSelectedEffect = pickerTempEffect;
      selectedEffect = pickerTempEffect;
      if (typeof refreshEffectOptionsInSettings === 'function') refreshEffectOptionsInSettings();
      if (typeof refreshEditPreview === 'function') refreshEditPreview();
      if (typeof refreshDiscordTiles === 'function') refreshDiscordTiles();
      modal.classList.add('hidden');
    };
  }
  renderEffectPickerGrid();
  modal.classList.remove('hidden');
}

function renderEffectPickerGrid() {
  const grid = document.getElementById('effect-picker-grid');
  const preview = document.getElementById('effect-picker-preview');
  const nameEl = document.getElementById('effect-picker-name');
  if (!grid) return;
  const owned = getOwnedEffects();
  grid.innerHTML = '';

  function select(id, name, img) {
    pickerTempEffect = id;
    grid.querySelectorAll('.picker-tile').forEach(t => t.classList.remove('active'));
    const tile = grid.querySelector('.picker-tile[data-id="'+id+'"]');
    if (tile) tile.classList.add('active');
    if (nameEl) nameEl.textContent = name || 'Aucun';
    if (preview) {
      preview.className = 'picker-preview-card';
      preview.innerHTML = '';
      const card = document.createElement('div');
      card.className = 'picker-fx-preview';
      card.style.cssText = 'position:relative;width:100%;height:100%;border-radius:8px;overflow:hidden;background:#1e1f22;';
      if (img) {
        const fx = document.createElement('img');
        fx.src = img;
        fx.className = 'picker-preview-fx';
        fx.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;pointer-events:none;';
        card.appendChild(fx);
      }
      const av = document.createElement('div');
      av.className = 'picker-preview-av';
      av.style.cssText = 'position:absolute;left:16px;bottom:16px;width:56px;height:56px;border-radius:50%;background:'+(currentUser?.avatarColor||'#5865f2')+';z-index:2;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:22px;overflow:hidden;';
      if (currentUser?.avatarUrl) av.innerHTML = '<img src="'+currentUser.avatarUrl+'" style="width:100%;height:100%;object-fit:cover;">';
      else av.textContent = (currentUser?.username||'Z')[0].toUpperCase();
      card.appendChild(av);
      preview.appendChild(card);
    }
  }

  // Aucun
  const none = document.createElement('button');
  none.type = 'button';
  none.className = 'picker-tile' + (pickerTempEffect === 'none' ? ' active' : '');
  none.dataset.id = 'none';
  none.innerHTML = '<div class="picker-tile-inner none">∅</div><span>Aucun</span>';
  none.onclick = () => select('none', 'Aucun', null);
  grid.appendChild(none);

  // Boutique
  const shop = document.createElement('button');
  shop.type = 'button';
  shop.className = 'picker-tile';
  shop.dataset.id = 'shop';
  shop.innerHTML = '<div class="picker-tile-inner shop">🛒</div><span>Boutique</span>';
  shop.onclick = () => {
    document.getElementById('effect-picker-modal')?.classList.add('hidden');
    if (typeof openShop === 'function') {
      document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'effects'));
      openShop();
    }
  };
  grid.appendChild(shop);

  (SHOP_EFFECTS || []).forEach(item => {
    const isOwned = owned.includes(item.id) || (currentUser && currentUser.isOwner);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'picker-tile' + (pickerTempEffect === item.id ? ' active' : '') + (isOwned ? '' : ' locked');
    btn.dataset.id = item.id;
    btn.innerHTML = '<div class="picker-tile-inner picker-tile-fx"><img src="'+item.img+'" alt=""></div><span>'+item.name+'</span>' + (isOwned ? '' : '<span class="picker-lock">🔒</span>');
    btn.onclick = () => {
      if (!isOwned) {
        document.getElementById('effect-picker-modal')?.classList.add('hidden');
        if (typeof openShop === 'function') {
          document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'effects'));
          openShop();
        }
        return;
      }
      select(item.id, item.name, item.img);
    };
    grid.appendChild(btn);
  });

  const cur = (SHOP_EFFECTS || []).find(i => i.id === pickerTempEffect);
  select(pickerTempEffect, cur ? cur.name : 'Aucun', cur ? cur.img : null);
}

function renderDecoPickerGrid() {
  const grid = document.getElementById('deco-picker-grid');
  const preview = document.getElementById('deco-picker-preview');
  const nameEl = document.getElementById('deco-picker-name');
  if (!grid) return;
  const owned = getOwnedDecos();
  grid.innerHTML = '';

  function select(id, name, img) {
    pickerTempDeco = id;
    grid.querySelectorAll('.picker-tile').forEach(t => t.classList.remove('active'));
    const tile = grid.querySelector('.picker-tile[data-id="'+id+'"]');
    if (tile) tile.classList.add('active');
    if (nameEl) nameEl.textContent = name || 'Aucune';
    if (preview) {
      preview.className = 'picker-preview-card picker-preview-deco';
      preview.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'picker-deco-av-wrap';
      wrap.style.cssText = 'position:relative;width:160px;height:160px;margin:40px auto 0;';
      const av = document.createElement('div');
      av.className = 'picker-preview-av';
      av.style.cssText = 'width:120px;height:120px;border-radius:50%;background:'+(currentUser?.avatarColor||'#5865f2')+';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:42px;overflow:hidden;z-index:1;';
      if (currentUser?.avatarUrl) av.innerHTML = '<img src="'+currentUser.avatarUrl+'" style="width:100%;height:100%;object-fit:cover;">';
      else av.textContent = (currentUser?.username||'Z')[0].toUpperCase();
      wrap.appendChild(av);
      if (img) {
        const deco = document.createElement('img');
        deco.src = img;
        deco.className = 'picker-deco-overlay';
        deco.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:160%;height:160%;object-fit:contain;pointer-events:none;z-index:50;';
        wrap.appendChild(deco);
      }
      preview.appendChild(wrap);
    }
  }

  // Aucun
  const none = document.createElement('button');
  none.type = 'button';
  none.className = 'picker-tile' + (pickerTempDeco === 'none' ? ' active' : '');
  none.dataset.id = 'none';
  none.innerHTML = '<div class="picker-tile-inner none">∅</div><span>Aucun</span>';
  none.onclick = () => select('none', 'Aucune', null);
  grid.appendChild(none);

  // Boutique
  const shop = document.createElement('button');
  shop.type = 'button';
  shop.className = 'picker-tile';
  shop.dataset.id = 'shop';
  shop.innerHTML = '<div class="picker-tile-inner shop">🛒</div><span>Boutique</span>';
  shop.onclick = () => {
    document.getElementById('deco-picker-modal')?.classList.add('hidden');
    if (typeof openShop === 'function') {
      document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'decos'));
      openShop();
    }
  };
  grid.appendChild(shop);

  (SHOP_DECOS || []).forEach(item => {
    const isOwned = owned.includes(item.id) || (currentUser && currentUser.isOwner);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'picker-tile' + (pickerTempDeco === item.id ? ' active' : '') + (isOwned ? '' : ' locked');
    btn.dataset.id = item.id;
    btn.innerHTML = '<div class="picker-tile-inner picker-tile-deco"><img src="'+item.img+'" alt=""></div><span>'+item.name+'</span>' + (isOwned ? '' : '<span class="picker-lock">🔒</span>');
    btn.onclick = () => {
      if (!isOwned) {
        document.getElementById('deco-picker-modal')?.classList.add('hidden');
        if (typeof openShop === 'function') {
          document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'decos'));
          openShop();
        }
        return;
      }
      select(item.id, item.name, item.img);
    };
    grid.appendChild(btn);
  });

  const cur = (SHOP_DECOS || []).find(i => i.id === pickerTempDeco);
  select(pickerTempDeco, cur ? cur.name : 'Aucune', cur ? cur.img : null);
}



function openDecoPicker() {
  pickerTempDeco = (typeof editSelectedDeco !== 'undefined' ? editSelectedDeco : null) || currentUser?.avatarDeco || 'none';
  let modal = document.getElementById('deco-picker-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'deco-picker-modal';
    modal.className = 'picker-modal hidden';
    modal.innerHTML = `
      <div class="picker-overlay" data-close="1"></div>
      <div class="picker-panel">
        <div class="picker-header">
          <div>
            <h2>Changer la déco d'avatar</h2>
            <p class="picker-sub">Tes décorations</p>
          </div>
          <button type="button" class="picker-x" data-close="1">×</button>
        </div>
        <div class="picker-body">
          <div class="picker-grid" id="deco-picker-grid"></div>
          <div class="picker-preview-col">
            <div class="picker-preview-card picker-preview-deco" id="deco-picker-preview"></div>
            <div class="picker-item-meta">
              <div class="picker-item-name" id="deco-picker-name">Aucune</div>
            </div>
          </div>
        </div>
        <div class="picker-footer">
          <button type="button" class="btn-secondary" data-close="1">Annuler</button>
          <button type="button" class="btn-primary" id="deco-picker-apply">Appliquer</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => modal.classList.add('hidden')));
    document.getElementById('deco-picker-apply').onclick = () => {
      editSelectedDeco = pickerTempDeco;
      selectedDeco = pickerTempDeco;
      if (typeof refreshDecoOptionsInSettings === 'function') refreshDecoOptionsInSettings();
      if (typeof refreshEditPreview === 'function') refreshEditPreview();
      if (typeof refreshDiscordTiles === 'function') refreshDiscordTiles();
      modal.classList.add('hidden');
    };
  }
  renderDecoPickerGrid();
  modal.classList.remove('hidden');
}


document.getElementById('edit-deco-tile')?.addEventListener('click', () => openDecoPicker());
document.getElementById('edit-effect-tile')?.addEventListener('click', () => openEffectPicker());
document.getElementById('settings-deco-tile')?.addEventListener('click', () => openDecoPicker());
document.getElementById('settings-effect-tile')?.addEventListener('click', () => openEffectPicker());
document.getElementById('edit-avatar-tile')?.addEventListener('click', () => {
  document.getElementById('edit-avatar-file')?.click();
});


socket.on('giftClaimed', function(data) {
  if (!data) return;
  if (data.itemType === 'deco') ownDeco(data.itemId);
  else if (data.itemType === 'effect') ownEffect(data.itemId);
  else if (data.itemType === 'nitro') {
    ownNitro();
    if (currentUser) {
      currentUser.hasNitro = true;
      if (!Array.isArray(currentUser.badges)) currentUser.badges = [];
      if (!currentUser.badges.includes('nitro')) currentUser.badges.push('nitro');
      socket.emit('updateProfile', { hasNitro: true, badges: currentUser.badges });
      if (typeof updateUserPanel === 'function') updateUserPanel();
      if (typeof renderMembers === 'function') renderMembers();
    }
  }
  alert('Cadeau réclamé : ' + (data.itemName || data.itemId));
});

socket.on('giftSent', function(data) {
  if (data && data.toUsername) {
    // ouvrir le DM du destinataire
    const f = (friends || []).find(x => (x.username || '').toLowerCase() === String(data.toUsername).toLowerCase());
    if (f) openDM(f.id);
  }
});


function openWishlist() {
  const items = getWishlist();
  let modal = document.getElementById('wishlist-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wishlist-modal';
    modal.className = 'picker-modal';
    document.body.appendChild(modal);
  }
  const all = [...(SHOP_DECOS||[]), ...(SHOP_EFFECTS||[]), ...(SHOP_NITRO||[])];
  const cards = items.map(id => {
    const item = all.find(x => x.id === id);
    if (!item) return '';
    const img = item.img || '';
    return '<div class="wish-card" data-id="'+item.id+'">'
      + '<button type="button" class="shop-heart on" data-unwish="'+item.id+'" title="Retirer">♥</button>'
      + '<div class="wish-card-media"><img src="'+img+'" alt=""></div>'
      + '<div class="wish-card-name">'+String(item.name||'').replace(/</g,'')+'</div>'
      + '<div class="wish-card-price">'+(Number(item.price||0).toFixed(2).replace('.',','))+' €</div>'
      + '</div>';
  }).join('');
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="picker-overlay" data-close-wish="1"></div>
    <div class="picker-panel" style="width:min(720px,96vw);max-height:90vh;">
      <div class="picker-header">
        <div>
          <h2>Liste de souhaits</h2>
          <p class="picker-sub">${items.length} article${items.length>1?'s':''}</p>
        </div>
        <button type="button" class="picker-x" data-close-wish="1">×</button>
      </div>
      <div class="picker-body" style="display:block;overflow:auto;">
        <div class="wish-grid">${cards || '<div style="color:#949ba4;padding:24px;text-align:center;">Aucun article — clique le ♡ dans la boutique</div>'}</div>
      </div>
    </div>`;
  modal.querySelectorAll('[data-close-wish]').forEach(el => {
    el.onclick = () => modal.classList.add('hidden');
  });
  modal.querySelectorAll('[data-unwish]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-unwish');
      toggleWishlist(id);
      openWishlist();
    };
  });
}

function openShop() {

  // Bouton liste de souhaits dans le header boutique
  try {
    const header = document.querySelector('#shop-modal .shop-header, .shop-panel-discord .shop-header, .shop-header');
    if (header && !document.getElementById('shop-wishlist-btn')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.id = 'shop-wishlist-btn';
      b.className = 'shop-wishlist-btn';
      b.innerHTML = '♥ Liste de souhaits';
      b.onclick = (e) => { e.stopPropagation(); openWishlist(); };
      header.appendChild(b);
    }
  } catch (e) {}

  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const modal = document.getElementById('shop-modal');
  if (modal) modal.classList.remove('hidden');

  const ownedD = getOwnedDecos();
  const ownedE = getOwnedEffects();
  const ownedN = getOwnedNitro();
  const activeTab = document.querySelector('.shop-tab.active')?.dataset?.tab || 'decos';

  const items = activeTab === 'effects' ? SHOP_EFFECTS
    : activeTab === 'nitro' ? SHOP_NITRO
    : SHOP_DECOS;
  const owned = activeTab === 'effects' ? ownedE
    : activeTab === 'nitro' ? ownedN
    : ownedD;

  grid.className = 'shop-grid shop-grid-discord';
  grid.innerHTML = '';

  items.forEach(item => {
    const isOwned = owned.includes(item.id) || (item.type === 'nitro' && ownedN.includes('nitro'));
    const isFreeForOwner = currentUser && currentUser.isOwner;
    const priceNum = Number(item.price) || 2.75;
    const priceText = isOwned ? 'Possédé' : (isFreeForOwner ? 'Gratuit' : (priceNum.toFixed(2).replace('.', ',') + ' €'));
    const buyLabel = isOwned ? 'Possédé ✓' : ('Acheter pour ' + priceNum.toFixed(2).replace('.', ',') + ' €');

    const el = document.createElement('div');
    el.className = 'shop-card shop-card-v2' + (isOwned ? ' owned' : '') + (item.type === 'deco' ? ' is-deco' : item.type === 'effect' ? ' is-effect' : ' is-nitro');
    el.dataset.id = item.id;

    const avBg = (currentUser && currentUser.avatarColor) || '#5865f2';
    const avInner = (currentUser && currentUser.avatarUrl)
      ? '<img src="' + currentUser.avatarUrl + '" alt="">'
      : '<span class="shop-av-letter">' + (((currentUser && currentUser.username) || 'Z')[0].toUpperCase()) + '</span>';

    if (item.type === 'nitro') {
      el.innerHTML = `
        <button type="button" class="shop-heart" data-wish="${item.id}" title="Liste de souhaits">♡</button><div class="shop-card-media">
          <img class="shop-nitro-logo" src="${item.img}" alt="Nitro">
        </div>
        <div class="shop-card-info">
          <div class="shop-card-name">${item.name}</div>
          <div class="shop-card-price">${priceText}</div>
        </div>
        <div class="shop-card-hover">
          <button type="button" class="shop-buy-btn" data-action="buy">${isOwned ? 'Possédé ✓' : buyLabel}</button>
          <button type="button" class="shop-gift-btn" data-action="gift" title="Offrir en cadeau">🎁</button>
        </div>`;
    } else if (item.type === 'deco') {
      el.innerHTML = `
        <button type="button" class="shop-heart" data-wish="${item.id}" title="Liste de souhaits">♡</button><div class="shop-card-media">
          <div class="shop-card-avatar-wrap">
            <div class="shop-card-avatar" style="background:${avBg}">${avInner}</div>
            <img class="shop-card-deco" src="${item.img}" alt="">
          </div>
        </div>
        <div class="shop-card-info">
          <div class="shop-card-name">${item.name}</div>
          <div class="shop-card-price">${priceText}</div>
        </div>
        <div class="shop-card-hover">
          <button type="button" class="shop-buy-btn" data-action="buy">${isOwned ? 'Possédé ✓' : buyLabel}</button>
          <button type="button" class="shop-gift-btn" data-action="gift" title="Offrir en cadeau">🎁</button>
        </div>`;
    } else {
      // effect
      el.innerHTML = `
        <button type="button" class="shop-heart" data-wish="${item.id}" title="Liste de souhaits">♡</button><div class="shop-card-media shop-card-media-fx">
          <img class="shop-card-effect" src="${item.img}" alt="">
          <div class="shop-card-avatar shop-fx-av" style="background:${avBg}">${avInner}</div>
        </div>
        <div class="shop-card-info">
          <div class="shop-card-name">${item.name}</div>
          <div class="shop-card-price">${priceText}</div>
        </div>
        <div class="shop-card-hover">
          <button type="button" class="shop-buy-btn" data-action="buy">${isOwned ? 'Possédé ✓' : buyLabel}</button>
          <button type="button" class="shop-gift-btn" data-action="gift" title="Offrir en cadeau">🎁</button>
        </div>`;
    }

    
    // Coeur wishlist
    const heart = el.querySelector('.shop-heart');
    if (heart) {
      const on = isInWishlist(item.id);
      heart.classList.toggle('on', on);
      heart.textContent = on ? '♥' : '♡';
      heart.onclick = (e) => {
        e.stopPropagation();
        const now = toggleWishlist(item.id);
        heart.classList.toggle('on', now);
        heart.textContent = now ? '♥' : '♡';
      };
    }

    el.querySelector('[data-action="buy"]').addEventListener('click', (e) => {
      e.stopPropagation();
      if (isOwned) return;
      if (isFreeForOwner) {
        if (item.type === 'deco') ownDeco(item.id);
        else if (item.type === 'effect') ownEffect(item.id);
        else if (item.type === 'nitro') ownNitro();
        openShop();
        return;
      }
      openPaymentModal(item);
    });

    el.querySelector('[data-action="gift"]').addEventListener('click', (e) => {
      e.stopPropagation();
      openGiftModal(item);
    });

    grid.appendChild(el);
  });
}

function openGiftModal(item) {
  let modal = document.getElementById('gift-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'gift-modal';
    modal.className = 'picker-modal';
    document.body.appendChild(modal);
  }
  const priceNum = Number(item.price || 2.75);
  const price = priceNum.toFixed(2).replace('.', ',') + ' €';
  const nameSafe = String(item.name || 'Cadeau').replace(/</g, '');
  const img = item.img || '';
  const isDeco = item.type === 'deco';
  const isFx = item.type === 'effect';

  const friendList = (friends || []).slice().sort((a,b) => (a.username||'').localeCompare(b.username||''));
  let friendRows = '';
  friendList.forEach(f => {
    const av = f.avatarUrl
      ? '<img src="'+f.avatarUrl+'" alt="">'
      : '<span>'+((f.username||'?')[0].toUpperCase())+'</span>';
    const bg = f.avatarColor || '#5865f2';
    friendRows += '<button type="button" class="gift-friend-opt" data-id="'+f.id+'" data-name="'+String(f.username||'').replace(/"/g,'')+'">'
      + '<div class="gift-friend-av" style="background:'+bg+'">'+av+'</div>'
      + '<span class="gift-friend-name">'+String(f.username||'').replace(/</g,'')+'</span></button>';
  });
  if (!friendRows) {
    friendRows = "<div class=\"gift-no-friends\">Aucun ami — ajoute des amis d'abord</div>";
  }

  const previewInner = isDeco
    ? '<div class="gift-item-preview-deco"><div class="gift-av" style="background:'+((currentUser&&currentUser.avatarColor)||'#5865f2')+'">'
      + ((currentUser&&currentUser.avatarUrl)?'<img src="'+currentUser.avatarUrl+'">':((currentUser?.username||'Z')[0].toUpperCase()))
      + '</div><img class="gift-deco-img" src="'+img+'" alt=""></div>'
    : isFx
    ? '<div class="gift-item-preview-fx"><img src="'+img+'" alt=""></div>'
    : '<div class="gift-item-preview-nitro"><img src="'+img+'" alt="Nitro"></div>';

  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="picker-overlay" data-close-gift="1"></div>
    <div class="gift-panel">
      <div class="gift-header">
        <h2>Envoyer un cadeau</h2>
        <button type="button" class="picker-x" data-close-gift="1">×</button>
      </div>
      <div class="gift-body">
        <div class="gift-left">
          <div class="gift-art">
            <div class="gift-art-box">
              <div class="gift-art-emoji">🎁</div>
              <div class="gift-art-title">Zeyscord</div>
              <div class="gift-art-sub">Un cadeau t'attend</div>
            </div>
          </div>
        </div>
        <div class="gift-right">
          <label class="gift-label">Envoyer vers</label>
          <div class="gift-friend-picker" id="gift-friend-picker">
            <button type="button" class="gift-friend-selected" id="gift-friend-selected">
              <span class="gift-friend-placeholder">Sélectionne un(e) ami(e)</span>
            </button>
            <div class="gift-friend-dropdown hidden" id="gift-friend-dropdown">
              ${friendRows}
            </div>
          </div>
          <input type="hidden" id="gift-to-id" value="">
          <input type="hidden" id="gift-to-name" value="">

          <label class="gift-label" style="margin-top:16px;">Ajoute un message (facultatif)</label>
          <textarea id="gift-message" class="gift-textarea" maxlength="190" placeholder=""></textarea>
          <div class="gift-char">190</div>

          <label class="gift-label" style="margin-top:12px;">Ton cadeau</label>
          <div class="gift-item-row">
            ${previewInner}
            <div class="gift-item-meta">
              <div class="gift-item-name">${nameSafe}</div>
              <div class="gift-item-price">${price}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="gift-footer">
        <div class="gift-footer-hint">🎁 Le cadeau sera envoyé en DM — ton ami devra cliquer pour l'ouvrir</div>
        <button type="button" class="btn-primary" id="gift-next-btn">Envoyer</button>
      </div>
      <p id="gift-status" style="display:none;padding:0 20px 12px;font-size:13px;"></p>
    </div>`;

  modal.querySelectorAll('[data-close-gift]').forEach(el => {
    el.onclick = () => modal.classList.add('hidden');
  });

  const selBtn = document.getElementById('gift-friend-selected');
  const drop = document.getElementById('gift-friend-dropdown');
  selBtn.onclick = (e) => {
    e.stopPropagation();
    drop.classList.toggle('hidden');
  };
  drop.querySelectorAll('.gift-friend-opt').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      document.getElementById('gift-to-id').value = btn.dataset.id || '';
      document.getElementById('gift-to-name').value = btn.dataset.name || '';
      selBtn.innerHTML = btn.innerHTML;
      drop.classList.add('hidden');
    };
  });
  modal.querySelector('.picker-overlay')?.addEventListener('click', () => drop.classList.add('hidden'));

  const ta = document.getElementById('gift-message');
  const charEl = modal.querySelector('.gift-char');
  if (ta && charEl) ta.oninput = () => { charEl.textContent = String(190 - (ta.value || '').length); };

  document.getElementById('gift-next-btn').onclick = () => {
    const toId = document.getElementById('gift-to-id').value;
    const toName = document.getElementById('gift-to-name').value;
    const status = document.getElementById('gift-status');
    const msg = (document.getElementById('gift-message')?.value || '').trim();
    if (!toId && !toName) {
      status.style.display = 'block';
      status.style.color = '#ed4245';
      status.textContent = "Sélectionne un ami.";
      return;
    }
    const btn = document.getElementById('gift-next-btn');
    btn.disabled = true;
    btn.textContent = 'Envoi...';
    status.style.display = 'none';

    // Owner / free path OR payment then send — pour l'instant envoi DM direct (owner gratuit)
    const doSend = () => {
      socket.emit('sendGiftDM', {
        toUserId: toId,
        toUsername: toName,
        itemId: item.id,
        itemType: item.type,
        itemName: item.name,
        itemImg: item.img,
        price: item.price,
        message: msg
      });
      status.style.display = 'block';
      status.style.color = '#23a559';
      status.textContent = 'Cadeau envoyé en DM à ' + toName + ' !';
      btn.textContent = 'Envoyé ✓';
      setTimeout(() => {
        modal.classList.add('hidden');
        if (toId) openDM(toId);
      }, 900);
    };

    if (currentUser && currentUser.isOwner) {
      doSend();
      return;
    }
    // Non-owner: ouvrir paiement puis après succès le webhook devrait gérer —
    // en attendant on envoie aussi le lien DM (simulation) après confirm
    if (confirm('Payer ' + price + ' et envoyer le cadeau à ' + toName + ' ?')) {
      // Tente Stripe, sinon envoi local
      fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id, itemName: item.name, itemType: item.type, price: item.price,
          username: currentUser && currentUser.username,
          email: currentUser && currentUser.email,
          giftTo: toName
        })
      }).then(r => r.json()).then(data => {
        if (data.url) window.location.href = data.url;
        else doSend();
      }).catch(() => doSend());
    } else {
      btn.disabled = false;
      btn.textContent = 'Envoyer';
    }
  };
}

function openPaymentModal(item) {
  let modal = document.getElementById('payment-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'payment-modal';
    modal.className = 'picker-modal';
    document.body.appendChild(modal);
  }
  const price = Number(item.price).toFixed(2).replace('.', ',') + ' €';
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="picker-overlay" data-close-pay="1"></div>
    <div class="picker-panel" style="max-width:420px;">
      <div class="picker-header">
        <div>
          <h2>Paiement securise</h2>
          <p class="picker-sub">${escapeHtml(item.name)} — <strong>${price}</strong></p>
        </div>
        <button type="button" class="picker-x" data-close-pay="1">×</button>
      </div>
      <div class="picker-body" style="display:block;padding:16px;">
        <p style="color:#b5bac1;font-size:14px;margin-bottom:16px;">
          Paiement par carte via Stripe. Debloquage automatique apres paiement.
        </p>
        <button type="button" class="btn-primary" id="pay-stripe" style="width:100%;padding:14px;font-size:15px;">
          Payer ${price} avec Stripe
        </button>
        <p id="pay-status" style="color:#ed4245;font-size:13px;margin-top:12px;display:none;"></p>
      </div>
    </div>`;
  modal.querySelectorAll('[data-close-pay]').forEach(el => {
    el.onclick = () => modal.classList.add('hidden');
  });
  document.getElementById('pay-stripe').onclick = async () => {
    const btn = document.getElementById('pay-stripe');
    const status = document.getElementById('pay-status');
    btn.disabled = true;
    btn.textContent = 'Redirection...';
    status.style.display = 'none';
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          itemName: item.name,
          itemType: item.type,
          price: item.price,
          username: currentUser && currentUser.username,
          email: currentUser && currentUser.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur Stripe');
      if (data.url) window.location.href = data.url;
      else throw new Error('Pas URL de paiement');
    } catch (e) {
      status.style.display = 'block';
      status.textContent = e.message || 'Erreur Stripe';
      btn.disabled = false;
      btn.textContent = 'Payer ' + price + ' avec Stripe';
    }
  };
}

(function handleStripeReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('paid') === '1') {
    const sessionId = params.get('session_id');
    const itemId = params.get('item');
    const itemType = params.get('type') || 'deco';
    try { history.replaceState({}, '', window.location.pathname); } catch (e) {}
    // Sauvegarder pour apres reconnexion
    if (sessionId || itemId) {
      localStorage.setItem('zeyscord_pending_unlock', JSON.stringify({
        sessionId: sessionId || '',
        itemId: itemId || '',
        itemType: itemType
      }));
    }
  }
})();

async function processPendingUnlock() {
  let pending = null;
  try { pending = JSON.parse(localStorage.getItem('zeyscord_pending_unlock') || 'null'); } catch (e) {}
  if (!pending) return;
  try {
    let itemId = pending.itemId;
    let itemType = pending.itemType || 'deco';
    if (pending.sessionId) {
      const res = await fetch('/api/confirm-session?session_id=' + encodeURIComponent(pending.sessionId));
      const data = await res.json();
      if (data.paid && data.itemId) {
        itemId = data.itemId;
        itemType = data.itemType || itemType;
      } else {
        return; // pas encore valide
      }
    }
    if (!itemId) return;
    if (itemType === 'deco') ownDeco(itemId);
    else if (itemType === 'effect') ownEffect(itemId);
    else if (itemType === 'nitro') ownNitro();
    localStorage.removeItem('zeyscord_pending_unlock');
    if (typeof openShop === 'function') openShop();
    alert('Paiement reussi ! Article debloque : ' + itemId);
  } catch (e) {
    console.log('pending unlock error', e);
  }
}

// Apres init (connexion), appliquer le debloquage en attente
socket.on('init', function onInitUnlock() {
  setTimeout(processPendingUnlock, 500);
});
// Aussi au chargement si deja connecte plus tard
setTimeout(processPendingUnlock, 3000);

socket.on('purchaseUnlocked', function(data) {
  if (!data || !data.itemId) return;
  if (data.itemType === 'deco') ownDeco(data.itemId);
  else if (data.itemType === 'effect') ownEffect(data.itemId);
  else if (data.itemType === 'nitro') ownNitro();
  if (typeof openShop === 'function') openShop();
});

function closeShop() {
  document.getElementById('shop-modal').classList.add('hidden');
}
document.getElementById('shop-overlay')?.addEventListener('click', closeShop);
document.getElementById('shop-close')?.addEventListener('click', closeShop);
document.getElementById('shop-btn')?.addEventListener('click', openShop);

document.querySelectorAll('.shop-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    openShop();
  });
});


// Filter profile deco options in settings to only owned (+ none)

function refreshEffectOptionsInSettings() {
  const owned = getOwnedEffects();
  const grids = [
    { el: document.getElementById('profile-effect-grid'), mode: 'settings' },
    { el: document.getElementById('edit-effect-grid'), mode: 'edit' }
  ];
  grids.forEach(({ el: grid, mode }) => {
    if (!grid) return;
    const current = mode === 'edit' ? (editSelectedEffect || 'none') : (selectedEffect || 'none');
    grid.innerHTML = '';
    grid.classList.add('effect-grid-owned');

    function makeOpt(id, name, img) {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'effect-tile' + (current === id ? ' active' : '');
      opt.dataset.effect = id;
      if (id === 'none') {
        opt.innerHTML = '<div class="effect-tile-preview effect-tile-none">∅</div><span>Aucun</span>';
      } else {
        opt.innerHTML = '<div class="effect-tile-preview"><img src="' + img + '" alt=""></div><span>' + name + '</span>';
      }
      opt.onclick = () => {
        grid.querySelectorAll('.effect-tile').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        if (mode === 'edit') {
          editSelectedEffect = id;
          if (typeof updateEditPreview === 'function') updateEditPreview();
          else if (typeof refreshEditPreview === 'function') refreshEditPreview();
        } else {
          selectedEffect = id;
        }
      };
      grid.appendChild(opt);
    }

    makeOpt('none', 'Aucun', null);
    SHOP_EFFECTS.forEach(item => {
      if (!owned.includes(item.id)) return;
      makeOpt(item.id, item.name, item.img);
    });
    if (owned.length === 0) {
      const hint = document.createElement('div');
      hint.className = 'effect-owned-hint';
      hint.textContent = 'Aucun effet possédé. Ouvre la Boutique pour en obtenir.';
      grid.appendChild(hint);
    }
    grid.style.display = 'none';
  });
  if (typeof refreshDiscordTiles === 'function') refreshDiscordTiles();
}

function refreshDecoOptionsInSettings() {
  const owned = getOwnedDecos();
  const grids = [
    { el: document.getElementById('avatar-deco-grid'), mode: 'settings' },
    { el: document.getElementById('edit-deco-grid'), mode: 'edit' }
  ];
  grids.forEach(({ el: grid, mode }) => {
    if (!grid) return;
    const current = mode === 'edit' ? (editSelectedDeco || 'none') : (selectedDeco || 'none');
    grid.innerHTML = '';
    grid.classList.add('deco-grid-owned');

    function makeOpt(id, name, img) {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'deco-option' + (current === id ? ' active' : '');
      opt.dataset.deco = id;
      opt.title = name;
      if (id === 'none') {
        opt.innerHTML = '<div class="deco-preview none"></div>';
      } else {
        opt.innerHTML = '<img class="deco-img" src="' + img + '" alt="">';
      }
      opt.onclick = () => {
        grid.querySelectorAll('.deco-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        if (mode === 'edit') {
          editSelectedDeco = id;
          if (typeof updateEditPreview === 'function') updateEditPreview();
        } else {
          selectedDeco = id;
        }
      };
      grid.appendChild(opt);
    }

    makeOpt('none', 'Aucune', null);
    (typeof SHOP_DECOS !== 'undefined' ? SHOP_DECOS : []).forEach(item => {
      if (!owned.includes(item.id)) return;
      makeOpt(item.id, item.name, item.img);
    });
    if (owned.length === 0) {
      const hint = document.createElement('div');
      hint.style.cssText = 'grid-column:1/-1;color:#b5bac1;font-size:13px;padding:8px 0';
      hint.textContent = 'Aucune déco possédée. Ouvre la Boutique pour en obtenir.';
      grid.appendChild(hint);
    }
    grid.style.display = 'none';
  });
  if (typeof refreshDiscordTiles === 'function') refreshDiscordTiles();
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
  pendingServerIcon = undefined;
  const iconPrev = document.getElementById('ss-icon-preview');
  if (iconPrev) {
    if (guild.iconUrl) {
      iconPrev.style.backgroundImage = 'url("' + guild.iconUrl + '")';
      iconPrev.style.backgroundSize = 'cover';
      iconPrev.style.backgroundPosition = 'center';
      iconPrev.innerHTML = '';
    } else {
      iconPrev.style.backgroundImage = '';
      iconPrev.style.background = '#5865f2';
      iconPrev.innerHTML = (guild.icon || guild.name || 'S').toString().substring(0, 2).toUpperCase();
    }
  }
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

let pendingServerIcon = undefined;

document.getElementById('ss-icon-upload')?.addEventListener('click', () => {
  document.getElementById('ss-icon-file')?.click();
});
document.getElementById('ss-icon-file')?.addEventListener('change', () => {
  const input = document.getElementById('ss-icon-file');
  const f = input && input.files && input.files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) {
    alert('Image trop lourde (max 5 Mo)');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    pendingServerIcon = reader.result;
    const prev = document.getElementById('ss-icon-preview');
    if (prev) {
      prev.style.backgroundImage = 'url("' + reader.result + '")';
      prev.style.backgroundSize = 'cover';
      prev.style.backgroundPosition = 'center';
      prev.innerHTML = '';
    }
  };
  reader.readAsDataURL(f);
  input.value = '';
});
document.getElementById('ss-icon-clear')?.addEventListener('click', () => {
  pendingServerIcon = null;
  const prev = document.getElementById('ss-icon-preview');
  const letters = ((document.getElementById('ss-icon') && document.getElementById('ss-icon').value) || 'S').substring(0, 2).toUpperCase();
  if (prev) {
    prev.style.backgroundImage = '';
    prev.style.background = '#5865f2';
    prev.innerHTML = letters;
  }
});

document.getElementById('ss-save-overview')?.addEventListener('click', () => {
  const payload = {
    guildId: currentGuild,
    name: document.getElementById('ss-name').value.trim(),
    icon: document.getElementById('ss-icon').value.trim()
  };
  if (pendingServerIcon !== undefined) payload.iconUrl = pendingServerIcon;
  socket.emit('updateGuild', payload);
  pendingServerIcon = undefined;
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

function openServerBoostMenu(anchor) {
  let menu = document.getElementById('server-boost-menu');
  if (menu) menu.remove();
  menu = document.createElement('div');
  menu.id = 'server-boost-menu';
  menu.className = 'server-context-menu';
  const nitro = hasNitroForBoost();
  menu.innerHTML = `
    <button type="button" class="scm-item scm-boost" id="scm-boost-btn">
      <span class="scm-icon">💎</span>
      <span>Boost de serveur</span>
      ${nitro ? '' : '<span class="scm-lock">Nitro requis</span>'}
    </button>
    <button type="button" class="scm-item" id="scm-invite-btn">
      <span class="scm-icon">👥</span>
      <span>Inviter sur le serveur</span>
    </button>
  `;
  document.body.appendChild(menu);
  const rect = (anchor || document.getElementById('boost-server-btn')).getBoundingClientRect();
  menu.style.left = Math.min(rect.left, window.innerWidth - 260) + 'px';
  menu.style.top = (rect.bottom + 6) + 'px';
  document.getElementById('scm-boost-btn').onclick = () => {
    menu.remove();
    boostCurrentServer();
  };
  document.getElementById('scm-invite-btn').onclick = () => {
    menu.remove();
    const link = location.origin + '/?invite=' + (currentGuild || 'zeyscord');
    navigator.clipboard?.writeText(link);
    alert('Lien d\'invitation copié !\n' + link);
  };
  const close = (ev) => {
    if (!menu.contains(ev.target) && ev.target !== anchor) {
      menu.remove();
      document.removeEventListener('click', close);
    }
  };
  setTimeout(() => document.addEventListener('click', close), 0);
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

document.getElementById('boost-server-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openServerBoostMenu(e.currentTarget); });


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

let friendsTab = 'online';

function setHomeTab(tab) {
  document.querySelectorAll('.home-nav-item').forEach(el => el.classList.remove('active'));
  const nitroPanel = document.getElementById('nitro-panel');
  const homeFriendsPanel = document.getElementById('home-friends-panel');
  const friendsPanel = document.getElementById('friends-panel');
  const messagesContainer = document.getElementById('messages-container');
  const messageForm = document.getElementById('message-form');
  const chatHeader = document.querySelector('.chat-header');

  if (tab === 'friends') {
    document.getElementById('nav-friends')?.classList.add('active');
    nitroPanel?.classList.add('hidden');
    if (homeFriendsPanel) homeFriendsPanel.style.display = '';
    friendsPanel?.classList.remove('hidden');
    messagesContainer?.classList.add('hidden');
    messageForm?.classList.add('hidden');
    if (chatHeader) chatHeader.style.display = 'none';
    renderFriendsMain();
  } else if (tab === 'nitro') {
    document.getElementById('nav-nitro')?.classList.add('active');
    updateNitroCard();
    nitroPanel?.classList.remove('hidden');
    friendsPanel?.classList.add('hidden');
    if (homeFriendsPanel) homeFriendsPanel.style.display = 'none';
    messagesContainer?.classList.add('hidden');
    messageForm?.classList.add('hidden');
    if (chatHeader) chatHeader.style.display = 'none';
  } else if (tab === 'shop') {
    document.getElementById('nav-shop')?.classList.add('active');
    nitroPanel?.classList.add('hidden');
    friendsPanel?.classList.add('hidden');
    if (homeFriendsPanel) homeFriendsPanel.style.display = '';
    openShop();
  }
}

function renderFriendsMain() {
  const list = document.getElementById('friends-main-list');
  const addPanel = document.getElementById('friends-add-panel');
  const search = (document.getElementById('friends-search')?.value || '').toLowerCase().trim();
  const badge = document.getElementById('friends-pending-badge');
  if (badge) {
    if (friendRequests.length) {
      badge.textContent = friendRequests.length;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
  if (!list) return;

  if (friendsTab === 'add') {
    list.innerHTML = '';
    addPanel?.classList.remove('hidden');
    return;
  }
  addPanel?.classList.add('hidden');

  let items = [];
  if (friendsTab === 'online') {
    items = friends.filter(f => (f.presenceStatus || 'online') !== 'invisible');
    // also include onlineUsers who are friends
    const onlineIds = new Set(onlineUsers.map(u => u.id));
    items = items.filter(f => onlineIds.has(f.id) || true);
    // merge live presence from onlineUsers
    items = items.map(f => {
      const live = onlineUsers.find(u => u.id === f.id);
      return live ? { ...f, ...live } : f;
    }).filter(f => (f.presenceStatus || 'online') !== 'invisible');
  } else if (friendsTab === 'all') {
    items = friends.map(f => {
      const live = onlineUsers.find(u => u.id === f.id);
      return live ? { ...f, ...live } : f;
    });
  } else if (friendsTab === 'pending') {
    list.innerHTML = '';
    if (!friendRequests.length) {
      list.innerHTML = '<div class="friends-empty">Aucune demande en attente</div>';
      return;
    }
    const label = document.createElement('div');
    label.className = 'friends-section-label';
    label.textContent = 'Demandes en attente — ' + friendRequests.length;
    list.appendChild(label);
    friendRequests.forEach(r => {
      const el = document.createElement('div');
      el.className = 'friends-main-row';
      el.innerHTML = `
        <div class="friend-row-av">
          <div class="friend-av-fallback" style="background:#5865f2">${(r.fromUsername||'?')[0].toUpperCase()}</div>
        </div>
        <div class="friend-row-info">
          <div class="friend-row-name">${escapeHtml(r.fromUsername)}</div>
          <div class="friend-row-status">Demande d'ami</div>
        </div>
        <div class="friend-row-actions" style="opacity:1">
          <button type="button" data-accept="${r.fromId}" title="Accepter" style="background:#23a559;color:#fff">✓</button>
          <button type="button" data-decline="${r.fromId}" title="Refuser" style="background:#f23f43;color:#fff">✕</button>
        </div>`;
      el.querySelector('[data-accept]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        socket.emit('acceptFriendRequest', r.fromId);
      });
      el.querySelector('[data-decline]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        socket.emit('declineFriendRequest', r.fromId);
        friendRequests = friendRequests.filter(x => x.fromId !== r.fromId);
        renderFriendsMain();
        renderFriends();
      });
      list.appendChild(el);
    });
    return;
  }

  if (search) {
    items = items.filter(f => (f.username || '').toLowerCase().includes(search));
  }

  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<div class="friends-empty">' +
      (friendsTab === 'online' ? 'Personne n\'est en ligne pour le moment.' : 'Aucun ami pour le moment.') +
      '</div>';
    return;
  }

  const label = document.createElement('div');
  label.className = 'friends-section-label';
  label.textContent = (friendsTab === 'online' ? 'En ligne' : 'Tous les amis') + ' — ' + items.length;
  list.appendChild(label);

  items.forEach(f => {
    const st = f.presenceStatus || 'online';
    const stLabel = (STATUS_LABELS && STATUS_LABELS[st]) || 'En ligne';
    const custom = f.customStatus || stLabel;
    const el = document.createElement('div');
    el.className = 'friends-main-row';
    const av = f.avatarUrl
      ? `<img src="${esc(f.avatarUrl)}" alt="">`
      : `<div class="friend-av-fallback" style="background:${f.avatarColor||'#5865f2'}">${(f.username||'?')[0].toUpperCase()}</div>`;
    el.innerHTML = `
      <div class="friend-row-av">
        ${av}
        <div class="status-dot status-${st}"></div>
      </div>
      <div class="friend-row-info">
        <div class="friend-row-name">${escapeHtml(f.username)}</div>
        <div class="friend-row-status">${escapeHtml(custom)}</div>
      </div>
      <div class="friend-row-actions">
        <button type="button" class="friend-msg-btn" title="Message">
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
      </div>`;
    el.addEventListener('click', (e) => {
      if (e.target.closest('.friend-msg-btn')) return;
      openProfile(f.id);
    });
    el.querySelector('.friend-msg-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openDM(f.id);
      // show chat
      document.getElementById('friends-panel')?.classList.add('hidden');
      document.getElementById('messages-container')?.classList.remove('hidden');
      document.getElementById('message-form')?.classList.remove('hidden');
      const ch = document.querySelector('.chat-header');
      if (ch) ch.style.display = '';
    });
    list.appendChild(el);
  });
}

// Friends tabs
document.querySelectorAll('.friends-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.friends-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    friendsTab = tab.dataset.ftab || 'online';
    renderFriendsMain();
  });
});
document.getElementById('friends-search')?.addEventListener('input', () => renderFriendsMain());
document.getElementById('friends-add-btn')?.addEventListener('click', () => {
  const input = document.getElementById('friends-add-input');
  const name = input?.value.trim();
  if (name) {
    socket.emit('sendFriendRequest', name);
    if (input) input.value = '';
  }
});



// Pencil buttons in profile editor preview
document.getElementById('edit-avatar-pencil')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('edit-avatar-file')?.click();
});
document.getElementById('edit-banner-pencil')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('edit-banner-file')?.click();
});

document.getElementById('nav-friends')?.addEventListener('click', () => setHomeTab('friends'));
document.getElementById('nav-shop')?.addEventListener('click', () => {
  switchView('home');
  setHomeTab('shop');
});
document.getElementById('nav-nitro')?.addEventListener('click', () => {
  switchView('home');
  setHomeTab('nitro');
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
        const sess = JSON.parse(sessionStorage.getItem('zeyscord_session') || localStorage.getItem('zeyscord_session') || 'null');
        if (sess && sess.username) socket.emit('join', { username: sess.username, email: sess.email || '' });
        else socket.emit('join', { username: saved, email: localStorage.getItem('zeyscord_email') || '' });
      } else {
        socket.once('connect', () => socket.emit('join', saved));
      }
    };
    tryJoin();
  }
})();


// ===== GÉRER LES COMPTES (Discord style) =====
function openAccountsManager() {
  const modal = document.getElementById('accounts-modal');
  if (!modal) return;
  renderAccountsManager();
  modal.classList.remove('hidden');
}
function closeAccountsManager() {
  document.getElementById('accounts-modal')?.classList.add('hidden');
  document.querySelectorAll('.acc-more-menu').forEach(m => m.remove());
}
function renderAccountsManager() {
  const list = document.getElementById('accounts-list');
  if (!list) return;
  list.innerHTML = '';
  const accounts = getRecentAccounts();
  // ensure current user is in list
  if (currentUser && !accounts.some(a => a.username.toLowerCase() === currentUser.username.toLowerCase())) {
    saveRecentAccount(currentUser);
  }
  const all = getRecentAccounts();
  all.forEach(acc => {
    const isCurrent = currentUser && acc.username.toLowerCase() === currentUser.username.toLowerCase();
    const row = document.createElement('div');
    row.className = 'acc-row' + (isCurrent ? ' active' : '');
    const letter = (acc.username || '?')[0].toUpperCase();
    const bg = acc.avatarUrl ? 'transparent' : (acc.avatarColor || '#5865f2');
    row.innerHTML = `
      <div class="acc-av" style="background:${bg}">${acc.avatarUrl ? `<img src="${acc.avatarUrl}" alt="">` : letter}</div>
      <div class="acc-info">
        <div class="acc-name">${escapeHtml(acc.username)}</div>
        ${isCurrent ? '<div class="acc-active">Compte actif</div>' : ''}
      </div>
      ${isCurrent ? '' : '<button type="button" class="acc-switch">Changer</button>'}
      <button type="button" class="acc-more" title="Plus">⋯</button>
    `;
    if (!isCurrent) {
      row.querySelector('.acc-switch').onclick = () => {
        closeAccountsManager();
        switchAccount(acc.username);
      };
    }
    row.querySelector('.acc-more').onclick = (e) => {
      e.stopPropagation();
      document.querySelectorAll('.acc-more-menu').forEach(m => m.remove());
      const menu = document.createElement('div');
      menu.className = 'acc-more-menu';
      menu.innerHTML = `<button type="button" class="acc-logout-btn">Déconnexion</button>`;
      document.body.appendChild(menu);
      const r = e.currentTarget.getBoundingClientRect();
      menu.style.left = (r.right - 140) + 'px';
      menu.style.top = (r.bottom + 4) + 'px';
      menu.querySelector('.acc-logout-btn').onclick = () => {
        // remove from saved accounts
        const next = getRecentAccounts().filter(a => a.username.toLowerCase() !== acc.username.toLowerCase());
        localStorage.setItem('zeyscord_accounts', JSON.stringify(next));
        if (isCurrent) {
          sessionStorage.removeItem('zeyscord_autojoin');
          localStorage.removeItem('zeyscord_username');
          if (socket) socket.disconnect();
          location.reload();
        } else {
          menu.remove();
          renderAccountsManager();
        }
      };
      const close = (ev) => {
        if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', close); }
      };
      setTimeout(() => document.addEventListener('click', close), 0);
    };
    list.appendChild(row);
  });
}
document.getElementById('accounts-overlay')?.addEventListener('click', closeAccountsManager);
document.getElementById('accounts-close')?.addEventListener('click', closeAccountsManager);
document.getElementById('accounts-add')?.addEventListener('click', () => {
  closeAccountsManager();
  sessionStorage.removeItem('zeyscord_autojoin');
  localStorage.removeItem('zeyscord_username');
  if (socket) socket.disconnect();
  location.reload();
});

// Fix switchAccount to set autojoin BEFORE reload
function switchAccount(username) {
  closeAccountMenu();
  closeAccountsManager();
  sessionStorage.setItem('zeyscord_autojoin', username);
  localStorage.setItem('zeyscord_username', username);
  if (socket) socket.disconnect();
  location.reload();
}


// ===== MOBILE NAV (téléphone) =====
(function setupMobileNav() {
  const overlay = document.getElementById('mobile-sidebar-overlay');
  const btnCh = document.getElementById('mobile-channels-btn');
  const btnMb = document.getElementById('mobile-members-btn');

  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function showChannelsList() {
    document.body.classList.remove('mobile-in-chat', 'mobile-members-open', 'mobile-channels-open');
    if (overlay) overlay.classList.add('hidden');
    updateMobileBackBtn();
  }

  function showChat() {
    if (!isMobile()) return;
    document.body.classList.add('mobile-in-chat');
    document.body.classList.remove('mobile-members-open', 'mobile-channels-open');
    if (overlay) overlay.classList.add('hidden');
    updateMobileBackBtn();
  }

  function showMembers() {
    if (!isMobile()) return;
    document.body.classList.add('mobile-members-open');
    if (overlay) overlay.classList.remove('hidden');
  }

  function closeMembers() {
    document.body.classList.remove('mobile-members-open');
    if (overlay) overlay.classList.add('hidden');
  }

  function updateMobileBackBtn() {
    if (!btnCh) return;
    const inChat = document.body.classList.contains('mobile-in-chat');
    if (inChat) {
      btnCh.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';
      btnCh.title = 'Retour';
    } else {
      btnCh.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>';
      btnCh.title = 'Menu';
    }
  }

  // Expose for other handlers
  window.__zeyMobile = { isMobile, showChannelsList, showChat, showMembers, closeMembers };

  btnCh?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isMobile()) return;
    if (document.body.classList.contains('mobile-in-chat')) {
      showChannelsList();
    } else {
      // deja sur la liste
      showChannelsList();
    }
  });

  btnMb?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isMobile()) return;
    if (document.body.classList.contains('mobile-members-open')) closeMembers();
    else showMembers();
  });

  overlay?.addEventListener('click', () => {
    closeMembers();
  });

  // Clic salon / DM → vue chat (style Discord mobile)
  function bindChatOpen(root) {
    if (!root) return;
    root.addEventListener('click', (e) => {
      if (!isMobile()) return;
      const item = e.target.closest('.channel-item, .dm-item, [data-channel], .home-nav-item');
      if (!item) return;
      // home-nav (amis/nitro/shop) reste sur panel principal
      if (item.classList.contains('home-nav-item')) {
        showChat();
        return;
      }
      setTimeout(showChat, 30);
    });
  }
  bindChatOpen(document.getElementById('channels-list'));
  bindChatOpen(document.getElementById('dm-list'));
  bindChatOpen(document.getElementById('home-view'));

  // Serveur → liste des salons
  document.getElementById('servers-list')?.addEventListener('click', () => {
    if (isMobile()) setTimeout(showChannelsList, 40);
  });
  document.getElementById('home-btn')?.addEventListener('click', () => {
    if (isMobile()) setTimeout(showChannelsList, 40);
  });

  window.addEventListener('resize', () => {
    if (!isMobile()) {
      document.body.classList.remove('mobile-in-chat', 'mobile-members-open', 'mobile-channels-open');
      if (overlay) overlay.classList.add('hidden');
    }
    updateMobileBackBtn();
  });

  updateMobileBackBtn();
})();

document.addEventListener('click', function(ev) {
  const claimBtn = ev.target && ev.target.closest && ev.target.closest('[data-claim]');
  if (!claimBtn) return;
  const gid = claimBtn.getAttribute('data-claim');
  if (!gid || !socket) return;
  claimBtn.disabled = true;
  claimBtn.textContent = 'Ouverture...';
  socket.emit('claimGift', gid);
});
