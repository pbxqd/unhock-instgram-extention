// ================= Settings =================
const DEFAULTS = {
  enabled: true,        // master enable/disable
  mode: "css",          // "css" | "remove"
  reels: true,
  suggested: true,
  homepage: true,       // kept separate in case you want to treat differently later
  explore: true,
  stories: true,
  sidebar: true,
  allowlist: "",        // comma-separated usernames (no @)
  snoozeUntil: 0,       // timestamp (ms)
  debug: false
};

let settings = { ...DEFAULTS };
let lastPath = "";

// ================= Utils =================
function dbg(...a){ if (settings.debug) console.debug("[MyUnhock]", ...a); }
function removeNode(n){ if (n && n.parentNode) n.parentNode.removeChild(n); }
function snoozed(){ return (settings.snoozeUntil || 0) > Date.now(); }

async function loadSettings(){
  const res = await browser.storage.local.get(Object.keys(DEFAULTS));
  settings = { ...DEFAULTS, ...res };
}

function isAllowedAccount(){
  const m = location.pathname.match(/^\/([^/]+)\/?$/);
  const user = m?.[1]?.toLowerCase();
  const list = (settings.allowlist || "")
    .toLowerCase()
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  return user && list.includes(user);
}

function setRouteClasses(){
  document.documentElement.classList.toggle("ig-route-explore", location.pathname.startsWith("/explore"));
}

// ================= CSS-only mode =================
function applyCSSClasses(){
  const html = document.documentElement;
  const active = settings.enabled && !snoozed() && !isAllowedAccount();
  html.classList.toggle("ig-hide-reels",     active && settings.reels);
  html.classList.toggle("ig-hide-explore",   active && settings.explore);
  html.classList.toggle("ig-hide-stories",   active && settings.stories);
  html.classList.toggle("ig-hide-sidebar",   active && settings.sidebar);
  html.classList.toggle("ig-hide-homepage",  active && (settings.suggested || settings.homepage));
  setRouteClasses();
}

// ================= Removal mode (DOM) =================
const SUGGEST_HINTS = [/suggest(ed)?/i, /for you/i, /اقتراح|مقترح/];

function hideReels(root=document){
  if (!settings.reels) return;
  root.querySelectorAll('a[href*="/reel/"]').forEach(a=>{
    removeNode(a.closest('article') || a.closest('div'));
  });
}

function hideExplore(root=document){
  if (!settings.explore) return;
  // hide Explore button
  root.querySelectorAll('a[href="/explore/"]').forEach(a=>{
    removeNode(a.closest('li') || a.closest('div') || a);
  });
  // hide Explore page content
  if (location.pathname.startsWith("/explore")) {
    root.querySelectorAll('main article, main a[href^="/p/"], main a[href*="/reel/"]')
      .forEach(el => removeNode(el.closest('article') || el.closest('div') || el));
  }
}

function hideStories(root=document){
  if (!settings.stories) return;
  ['section div[role="presentation"]','div[aria-label*="stories" i]']
    .forEach(sel => root.querySelectorAll(sel).forEach(removeNode));
}

function hideSidebar(root=document){
  if (!settings.sidebar) return;
  root.querySelectorAll('aside').forEach(removeNode);
}

function looksSuggested(article){
  if (article.querySelector('a[href^="/explore/people/"]')) return true;
  if (article.querySelector('a[href*="/reel/"]')) return true;
  const t = (article.innerText || "");
  return SUGGEST_HINTS.some(rx => rx.test(t));
}

function hideSuggested(root=document){
  if (!(settings.suggested || settings.homepage)) return;
  // dialogs with video (generic suggestions)
  root.querySelectorAll('div[role="dialog"] video').forEach(v=>{
    const box = v.closest('div[role="dialog"]') || v.closest('div');
    if (box) removeNode(box);
  });
  // suggestion-like posts in feed
  root.querySelectorAll('article').forEach(article=>{
    if (looksSuggested(article)) removeNode(article);
  });
}

function applyRemoval(root=document){
  if (!settings.enabled || snoozed() || isAllowedAccount()) return;
  hideReels(root);
  hideExplore(root);
  hideStories(root);
  hideSidebar(root);
  hideSuggested(root);
}

// ================= SPA routing + observer =================
let routeTimer;

function onRouteChange(){
  if (location.pathname === lastPath) return;
  lastPath = location.pathname;
  setRouteClasses();
  clearTimeout(routeTimer);
  routeTimer = setTimeout(()=>{
    if (!settings.enabled || snoozed() || isAllowedAccount()) {
      applyCSSClasses(); // clear route classes if disabled
      return;
    }
    if (settings.mode === "css") {
      applyCSSClasses();
    } else {
      const run = ()=>applyRemoval(document);
      if ("requestIdleCallback" in window) requestIdleCallback(run, {timeout: 500});
      else setTimeout(run, 150);
    }
  }, 200);
}

function hookSpaRouting(){
  const _push = history.pushState;
  history.pushState = function(){
    const ret = _push.apply(this, arguments);
    onRouteChange();
    return ret;
  };
  window.addEventListener("popstate", onRouteChange);
}

let obs;
function startObserver(){
  if (obs) obs.disconnect();
  const target = document.querySelector('main') || document.documentElement;
  obs = new MutationObserver(muts=>{
    if (!settings.enabled || snoozed() || isAllowedAccount()) return;
    if (settings.mode === "css") {
      applyCSSClasses();
      return;
    }
    // Removal mode: optimize heavy batches
    let heavy = false;
    for (const m of muts) {
      if (m.addedNodes && m.addedNodes.length > 50) { heavy = true; break; }
    }
    if (heavy) {
      applyRemoval(document);
    } else {
      muts.forEach(m=>{
        m.addedNodes?.forEach(n=>{
          if (n.nodeType === 1) applyRemoval(n);
        });
      });
    }
  });
  obs.observe(target, { childList: true, subtree: true });
}

// live respond to popup changes
browser.storage.onChanged.addListener(changes=>{
  let changed = false;
  for (const k in changes) {
    if (k in settings) {
      settings[k] = changes[k].newValue;
      changed = true;
    }
  }
  if (!changed) return;
  if (settings.mode === "css") applyCSSClasses();
  else applyRemoval(document);
});

// ================= Init =================
(async function init(){
  await loadSettings();
  lastPath = location.pathname;
  setRouteClasses();
  if (settings.mode === "css") applyCSSClasses();
  else applyRemoval(document);
  hookSpaRouting();
  startObserver();
})();
