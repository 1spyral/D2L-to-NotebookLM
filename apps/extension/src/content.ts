import browser from "webextension-polyfill";
import { scrapeCourseTOC, downloadFileAsBase64, ScrapedItem } from "./lib/d2l-scraper";

alert("D2L to NotebookLM Content Script Loaded!");
console.log("D2L Scraper: Content script active on", window.location.hostname, window.location.pathname);

/**
 * Finds all elements matching a selector, even those inside Shadow DOM.
 */
function querySelectorAllDeep(selector: string, root: Node = document): Element[] {
  const elements: Element[] = [];
  
  function find(node: Node) {
    if (node instanceof Element) {
      if (node.matches(selector)) {
        elements.push(node);
      }
      
      if (node.shadowRoot) {
        find(node.shadowRoot);
      }
    }
    
    // Check all children
    const children = node instanceof Element && node.shadowRoot 
      ? Array.from(node.shadowRoot.childNodes) 
      : Array.from(node.childNodes);
      
    for (const child of children) {
      find(child);
    }
  }
  
  find(root);
  return Array.from(new Set(elements));
}

async function handleScrapeAndUpload(orgUnitId: string, button: HTMLButtonElement) {
  const originalText = button.innerText;
  button.innerText = "⌛ Scraping...";
  button.disabled = true;

  try {
    const items = await scrapeCourseTOC(orgUnitId);
    if (items.length === 0) {
      alert("No items found to scrape in this course TOC.");
      button.innerText = originalText;
      button.disabled = false;
      return;
    }

    button.innerText = `⬇️ 0/${items.length}`;
    
    const downloadedItems: ScrapedItem[] = [];
    for (let i = 0; i < items.length; i++) {
      button.innerText = `⬇️ ${i + 1}/${items.length}`;
      const item = items[i];
      const extra = await downloadFileAsBase64(item, orgUnitId);
      downloadedItems.push({ ...item, ...extra } as ScrapedItem);
    }

    // Mark these items as pending for NotebookLM
    await browser.storage.local.set({
      pendingUpload: {
        items: downloadedItems,
        timestamp: Date.now(),
        orgUnitId,
        courseName: document.title // Best effort course name
      }
    });

    button.innerText = "✅ Ready!";
    button.style.background = "#28a745";
    
    if (confirm(`Successfully scraped ${downloadedItems.length} items. Open NotebookLM to complete upload?`)) {
      window.open("https://notebooklm.google.com/", "_blank");
    }

    setTimeout(() => {
      button.innerText = originalText;
      button.style.background = "#4285f4";
      button.disabled = false;
    }, 5000);

  } catch (error) {
    console.error("D2L Scraper: Export failed", error);
    alert("Scraping failed. See console for details.");
    button.innerText = "❌ Failed";
    button.style.background = "#d93025";
    button.disabled = false;
  }
}

function createButton(orgUnitId: string, size: 'small' | 'large' = 'small') {
  const btn = document.createElement('button');
  btn.innerText = 'Upload to NotebookLM';
  btn.className = 'nblm-scrape-btn';
  
  const padding = size === 'large' ? '8px 16px' : '4px 8px';
  const fontSize = size === 'large' ? '13px' : '11px';

  btn.style.cssText = `
    background: #4285f4;
    color: white;
    border: none;
    padding: ${padding};
    border-radius: 4px;
    cursor: pointer;
    font-size: ${fontSize};
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: background 0.2s;
    font-family: inherit;
    pointer-events: auto;
    margin: 5px;
    z-index: 9999;
  `;

  btn.onmouseover = () => { if (!btn.disabled) btn.style.background = "#357ae8"; };
  btn.onmouseout = () => { if (!btn.disabled && btn.innerText !== "✅ Ready!") btn.style.background = "#4285f4"; };

  btn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleScrapeAndUpload(orgUnitId, btn);
  };

  return btn;
}

function injectFixedTrigger() {
  if (document.getElementById('nblm-floating-trigger')) return;

  const fab = document.createElement('div');
  fab.id = 'nblm-floating-trigger';
  fab.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: #4285f4;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    z-index: 2147483647; /* Top-most possible */
    font-size: 24px;
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    transition: transform 0.2s, background 0.2s;
    user-select: none;
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  `;
  fab.innerHTML = '🚀';
  fab.title = 'Scrape Current Page for NotebookLM';

  fab.onmouseover = () => { fab.style.transform = 'scale(1.1)'; fab.style.background = '#357ae8'; };
  fab.onmouseout = () => { fab.style.transform = 'scale(1.0)'; fab.style.background = '#4285f4'; };

  fab.onclick = async () => {
    // 1. Check URL for orgUnitId
    let orgUnitId = window.location.pathname.match(/\/home\/(\d+)/)?.[1] || 
                     window.location.pathname.match(/\/le\/content\/(\d+)/)?.[1];
    
    // 2. Check if a course card link is found on page
    if (!orgUnitId) {
      const firstCourseLink = querySelectorAllDeep('a[href*="/d2l/home/"]')[0];
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      orgUnitId = firstCourseLink?.getAttribute('href')?.match(/\/home\/(\d+)/)?.[1];
    }

    if (orgUnitId) {
      const confirmScrape = confirm(`Found Course ID: ${orgUnitId}. Start scraping this course?`);
      if (confirmScrape) {
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      orgUnitId = (firstCourseLink as any)?.getAttribute('href')?.match(/\/home\/(\d+)/)?.[1];
    }

    if (orgUnitId) {
      if (confirm('Found Course ID: ' + orgUnitId + '. Start scraping this course?')) {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        const dummyBtn = document.createElement('button');
        handleScrapeAndUpload(orgUnitId, dummyBtn);
      }
    } else {
      const manualId = prompt("Could not auto-detect Course ID. Please enter the D2L OrgUnitId from the course URL:");
      if (manualId && /^\d+$/.test(manualId)) {
        const dummyBtn = document.createElement('button');
        handleScrapeAndUpload(manualId, dummyBtn);
      }
    }
  };

  document.body.appendChild(fab);
}

function injectToCourseCards() {
  const cards = querySelectorAllDeep('d2l-enrollment-card');
  cards.forEach((card: any) => {
    if (card.querySelector('.nblm-scrape-btn') || card.shadowRoot?.querySelector('.nblm-scrape-btn')) return;

    let orgUnitId = card.getAttribute('org-unit-id');
    if (!orgUnitId) {
      const href = card.href || card.shadowRoot?.querySelector('a.d2l-link')?.getAttribute('href');
      const match = href?.match(/\/home\/(\d+)/) || href?.match(/\/content\/(\d+)/);
      if (match) orgUnitId = match[1];
    }

    if (orgUnitId) {
      const btn = createButton(orgUnitId);
      if (card.shadowRoot) {
        const container = card.shadowRoot.querySelector('.d2l-card-container') || card.shadowRoot.firstChild;
        if (container) {
          (container as HTMLElement).style.position = 'relative';
          container.appendChild(btn);
        }
      } else {
        card.style.position = 'relative';
        card.appendChild(btn);
      }
    }
  });
}

function injectToContentDownloadButton() {
  // Find d2l-buttons and check their text/description for "Download"
  const d2lButtons = querySelectorAllDeep('d2l-button');
  d2lButtons.forEach((btn: any) => {
    const text = btn.innerText || btn.getAttribute('description') || '';
    if (text.toLowerCase().includes('download') && !btn.parentNode?.querySelector('.nblm-content-btn')) {
      const orgUnitId = window.location.pathname.match(/\/le\/content\/(\d+)/)?.[1];
      if (orgUnitId) {
        const nblmBtn = createButton(orgUnitId, 'large');
        nblmBtn.classList.add('nblm-content-btn');
        nblmBtn.style.marginLeft = '10px';
        nblmBtn.style.verticalAlign = 'middle';
        btn.parentNode?.insertBefore(nblmBtn, btn.nextSibling);
        console.log("D2L Scraper: Injected button beside native Download button.");
      }
    }
  });
}

// NotebookLM Side Logic
function handleNotebookLM() {
  if (!window.location.hostname.includes('notebooklm.google.com')) return;

  async function checkPending() {
    const data = await browser.storage.local.get('pendingUpload');
    const pendingUpload = data.pendingUpload as { items: ScrapedItem[], timestamp: number, orgUnitId: string, courseName: string } | undefined;
    
    if (pendingUpload && Date.now() - pendingUpload.timestamp < 600000) { // 10 mins
      showImportUI(pendingUpload);
    }
  }

  function showImportUI(data: any) {
    if (document.getElementById('nblm-import-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'nblm-import-banner';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #4285f4;
      color: white;
      padding: 10px 20px;
      z-index: 10000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: Google Sans, Roboto, sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;

    banner.innerHTML = `
      <span>🚀 <b>D2L to NotebookLM:</b> Found ${data.items.length} items ready to import.</span>
      <div>
        <button id="nblm-import-btn" style="background: white; color: #4285f4; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 10px;">Get Import Files</button>
        <button id="nblm-close-banner" style="background: transparent; color: white; border: 1px solid white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Dismiss</button>
      </div>
    `;
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #4285f4; color: white; padding: 10px 20px; z-index: 10000; display: flex; justify-content: space-between; align-items: center; font-family: Google Sans, Roboto, sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.3);';

    banner.innerHTML = '<span>🚀 <b>D2L to NotebookLM:</b> Found ' + data.items.length + ' items ready to import.</span>' +
      '<div>' +
        '<button id="nblm-import-btn" style="background: white; color: #4285f4; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 10px;">Get Import Files</button>' +
        '<button id="nblm-close-banner" style="background: transparent; color: white; border: 1px solid white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Dismiss</button>' +
      '</div>';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

    document.body.appendChild(banner);

    document.getElementById('nblm-close-banner')?.addEventListener('click', () => {
      banner.remove();
      browser.storage.local.remove('pendingUpload');
    });

    document.getElementById('nblm-import-btn')?.addEventListener('click', async () => {
      const items = data.items;
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      const links = items.filter((i: any) => i.type === 'link').map((i: any) => i.url).join('\\n');
      
      if (links) {
        await navigator.clipboard.writeText(links);
        alert('Copied links to clipboard! \\n\\n1. Click "Add Source" in NotebookLM.\\n2. Select "Website".\\n3. Paste links and click Insert.');
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      const nl = String.fromCharCode(10);
      const links = items.filter((i: any) => i.type === 'link').map((i: any) => i.url).join(nl);
      
      if (links) {
        await navigator.clipboard.writeText(links);
        alert('Copied links to clipboard!' + nl + nl + '1. Click "Add Source" in NotebookLM.' + nl + '2. Select "Website".' + nl + '3. Paste links and click Insert.');
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      } else {
        alert('Found files. Please download them from D2L and upload manually for now.');
      }
    });
  }

  setInterval(checkPending, 2000);
}

// Initialization
try {
  if (window.location.hostname.includes('notebooklm.google.com')) {
    console.log("D2L Scraper: NotebookLM mode");
    handleNotebookLM();
  } else {
    console.log("D2L Scraper: D2L mode");
    const runInjections = () => {
      injectToCourseCards();
      injectFixedTrigger();
      injectToContentDownloadButton();
    };
    const observer = new MutationObserver(runInjections);
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      setInterval(runInjections, 3000);
      runInjections();
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
        setInterval(runInjections, 3000);
        runInjections();
      });
    }
  }
} catch (e) {
  console.error("D2L Scraper: Init error", e);
}
