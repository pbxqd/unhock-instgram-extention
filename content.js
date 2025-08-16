// content.js

// Default settings
const DEFAULTS = {
  hideReels: true,
  hideExplore: true,
  hideSuggested: true,
  blockReelPage: true,
  blockExplorePage: true
};

// Load settings from storage
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULTS, (res) => {
      resolve({ ...DEFAULTS, ...res });
    });
  });
}

function hideElements(settings) {

  // إذا صفحة ريلز → اعرض الحديث ثم بعد 6 ثوانٍ انتقل إلى موقع تعليمي عشوائي
  if (settings.blockReelPage && (location.pathname.includes("/reel/") || location.pathname.startsWith("/reels"))) {
    document.body.innerHTML = `
      <div style="height:100vh;display:flex;justify-content:center;align-items:center;background:#000;color:#fff;font-size:22px;text-align:center;direction:rtl;font-family:Tahoma">
        قال رسول الله صلى الله عليه وسلم:<br>
        "نعمتان مغبون فيهما كثير من الناس الصحة والفراغ"
      </div>`;

    // قائمة المواقع التعليمية
    const links = [
      "https://chat.openai.com",
      "https://academy.tcm-sec.com",
      "https://elearn.squ.edu.om",
      "https://courses.davidbombal.com",
      "https://tryhackme.com",
      "https://www.hackthebox.com"
    ];

    setTimeout(() => {
      const randomLink = links[Math.floor(Math.random() * links.length)];
      window.location.href = randomLink;
    }, 6000);

    return;
  }





  // إذا صفحة Explore → ارجعه للصفحة الرئيسية
  if (settings.blockExplorePage && location.pathname.startsWith("/explore")) {
    location.href = "/";
    return;
  }

  // إخفاء زر Reels
  if (settings.hideReels) {
    const reelsSelectors = [
      'a[href="/reels/"]',
      'svg[aria-label="Reels"]',
      'svg[aria-label="Reel"]'
    ];
    reelsSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.parentElement) el.parentElement.style.display = "none";
        el.style.display = "none";
      });
    });
  }

  // إخفاء زر Explore
  if (settings.hideExplore) {
    const exploreSelectors = [
      'a[href="/explore/"]',
      'svg[aria-label="Explore"]',
      'svg[aria-label="Search & Explore"]'
    ];
    exploreSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.parentElement) el.parentElement.style.display = "none";
        el.style.display = "none";
      });
    });
  }

  // إخفاء خانة البحث
  const searchSelectors = [
    'a[href="/explore/search/"]',
    'svg[aria-label="Search"]',
    'svg[aria-label="بحث"]',
    'input[placeholder*="Search"]'
  ];

  // Remove any clickable sidebar item that opens search
  document.querySelectorAll('a[href="/explore/search/"], a[href="#"], svg[aria-label="Search"], svg[aria-label="بحث"]').forEach((el) => {
  let node = el;
  while (node && node.tagName !== 'NAV') {
    if (node.tagName === 'LI' || node.tagName === 'DIV' || node.tagName === 'BUTTON') {
      node.style.display = 'none';
      break;
    }
    node = node.parentElement;
  }
});



  document.querySelectorAll('a[href="/explore/search/"], svg[aria-label="Search"], svg[aria-label="بحث"]').forEach((el) => {
    let node = el;
    while (node && node.tagName !== 'NAV') {
      // find the clickable block (li/div)
      if (node.tagName === 'LI' || node.tagName === 'DIV') {
        node.style.display = 'none';
        break;
      }
      node = node.parentElement;
    }
  });
  


  // إخفاء المنشورات المُقترحة
  if (settings.hideSuggested) {
    const suggestionHints = [/suggest(ed)?/i, /for you/i, /اقتراح|مقترح/];
    document.querySelectorAll("article").forEach((article) => {
      const t = article.innerText || "";
      if (suggestionHints.some((rx) => rx.test(t))) {
        article.style.display = "none";
      }
    });
  }
}

// init
async function run() {
  const settings = await getSettings();
  hideElements(settings);
  setInterval(() => hideElements(settings), 1500);
}

run();
