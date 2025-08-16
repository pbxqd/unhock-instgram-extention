// popup.js

const checkboxes = {
  hideReels: document.getElementById("hideReels"),
  hideExplore: document.getElementById("hideExplore"),
  hideSuggested: document.getElementById("hideSuggested"),
  blockReelPage: document.getElementById("blockReelPage")
};

// Load saved settings
chrome.storage.local.get(Object.keys(checkboxes), (res) => {
  for (const key in checkboxes) {
    checkboxes[key].checked = Boolean(res[key]);
  }
});

// Save on change
for (const key in checkboxes) {
  checkboxes[key].addEventListener("change", () => {
    const value = checkboxes[key].checked;
    chrome.storage.local.set({ [key]: value });
  });
}
