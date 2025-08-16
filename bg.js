browser.commands.onCommand.addListener(async (cmd)=>{
  if (cmd !== "toggle-master") return;
  const st = await browser.storage.local.get(["enabled"]);
  const enabled = st.enabled !== false; // default ON
  await browser.storage.local.set({ enabled: !enabled });
  const tabs = await browser.tabs.query({ url: "*://www.instagram.com/*" });
  for (const t of tabs) {
    try { await browser.tabs.reload(t.id); } catch(e){}
  }
});
