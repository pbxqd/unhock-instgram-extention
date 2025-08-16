const KEYS = [
  "enabled","mode","reels","suggested","homepage",
  "explore","stories","sidebar","allowlist","debug","snoozeUntil"
];
const DEFAULTS = {
  enabled:true, mode:"css", reels:true, suggested:true, homepage:true,
  explore:true, stories:true, sidebar:true, allowlist:"", debug:false, snoozeUntil:0
};

function $(id){ return document.getElementById(id); }

async function load(){
  const res = await browser.storage.local.get(KEYS);
  const s = { ...DEFAULTS, ...res };

  $("enabled").checked = s.enabled;
  document.querySelectorAll('input[name="mode"]').forEach(r => r.checked = (r.value === s.mode));

  ["reels","suggested","homepage","explore","stories","sidebar","debug"].forEach(k=>{
    $(k).checked = !!s[k];
  });

  $("allowlist").value = s.allowlist || "";
}

async function save(){
  const data = {
    enabled: $("enabled").checked,
    mode: document.querySelector('input[name="mode"]:checked').value,
    reels: $("reels").checked,
    suggested: $("suggested").checked,
    homepage: $("homepage").checked,
    explore: $("explore").checked,
    stories: $("stories").checked,
    sidebar: $("sidebar").checked,
    allowlist: $("allowlist").value.trim(),
    debug: $("debug").checked
  };
  await browser.storage.local.set(data);
}

$("snooze10").addEventListener("click", async ()=>{
  await browser.storage.local.set({ snoozeUntil: Date.now() + 10*60*1000 });
});

// Export settings
$("export").addEventListener("click", async ()=>{
  const all = await browser.storage.local.get(null);
  const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  await browser.downloads.download({ url, filename: "my-unhock-settings.json", saveAs: true });
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
});

// Import settings
$("import").addEventListener("change", async (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const data = JSON.parse(text);
  await browser.storage.local.set(data);
  await load();
});

// Debounced save
let t;
document.addEventListener("input", ()=>{
  clearTimeout(t); t = setTimeout(save, 150);
});
document.addEventListener("change", ()=>{
  clearTimeout(t); t = setTimeout(save, 0);
});

document.addEventListener("DOMContentLoaded", load);
