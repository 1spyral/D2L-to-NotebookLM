const LEGACY_NAVBAR_BUTTON_ID = "d2l-to-notebooklm-navbar-button";

const POPUP_PRIMARY = "#1A73E8";
const POPUP_PRIMARY_HOVER = "#1765CC";
const POPUP_ON_PRIMARY = "#FFFFFF";
const POPUP_BUTTON_SHADOW = "0 1px 3px rgba(26, 115, 232, 0.3)";
const POPUP_BUTTON_SHADOW_HOVER = "0 4px 12px rgba(26, 115, 232, 0.35)";

function queryAllDeep(selector: string, root: ParentNode = document): Element[] {
  const results: Element[] = [];
  const seen = new Set<Element>();

  const visit = (node: ParentNode) => {
    for (const element of Array.from(node.querySelectorAll(selector))) {
      if (!seen.has(element)) {
        seen.add(element);
        results.push(element);
      }
    }

    for (const host of Array.from(node.querySelectorAll("*"))) {
      const shadowRoot = (host as HTMLElement).shadowRoot;
      if (shadowRoot) {
        visit(shadowRoot);
      }
    }
  };

  visit(root);
  return results;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function styleActionButton(button: HTMLButtonElement): void {
  button.classList.add("d2l-button");
  button.style.backgroundColor = POPUP_PRIMARY;
  button.style.border = `1px solid ${POPUP_PRIMARY}`;
  button.style.borderRadius = "999px";
  button.style.color = POPUP_ON_PRIMARY;
  button.style.fontWeight = "700";
  button.style.lineHeight = "1.2";
  button.style.padding = "0.35rem 0.85rem";
  button.style.marginLeft = "0.5rem";
  button.style.boxShadow = POPUP_BUTTON_SHADOW;
  button.style.textDecoration = "none";
  button.style.transition = "background-color 140ms ease, box-shadow 140ms ease";

  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = POPUP_PRIMARY_HOVER;
    button.style.borderColor = POPUP_PRIMARY_HOVER;
    button.style.boxShadow = POPUP_BUTTON_SHADOW_HOVER;
  });

  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = POPUP_PRIMARY;
    button.style.borderColor = POPUP_PRIMARY;
    button.style.boxShadow = POPUP_BUTTON_SHADOW;
  });

  button.addEventListener("focus", () => {
    button.style.backgroundColor = POPUP_PRIMARY_HOVER;
    button.style.borderColor = POPUP_PRIMARY_HOVER;
    button.style.boxShadow = POPUP_BUTTON_SHADOW_HOVER;
  });

  button.addEventListener("blur", () => {
    button.style.backgroundColor = POPUP_PRIMARY;
    button.style.borderColor = POPUP_PRIMARY;
    button.style.boxShadow = POPUP_BUTTON_SHADOW;
  });
}

function createActionButton(label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  styleActionButton(button);
  button.addEventListener("click", (event) => {
    event.preventDefault();
  });
  return button;
}

function cleanupLegacyNavbarButton(): void {
  const oldButton = queryAllDeep(`#${LEGACY_NAVBAR_BUTTON_ID}`);
  for (const element of oldButton) {
    element.remove();
  }
}

function insertDownloadButtons(): void {
  const candidates = queryAllDeep("button.d2l-button");

  for (const element of candidates) {
    if (!(element instanceof HTMLButtonElement)) {
      continue;
    }

    if (element.dataset.d2lToNotebooklmDownloadEnhanced === "1") {
      continue;
    }

    if (normalizeText(element.textContent ?? "") !== "Download") {
      continue;
    }

    const existingSibling = element.nextElementSibling;
    if (
      existingSibling instanceof HTMLElement &&
      existingSibling.dataset.d2lToNotebooklmDownloadButton === "1"
    ) {
      element.dataset.d2lToNotebooklmDownloadEnhanced = "1";
      continue;
    }

    const button = createActionButton("Download to D2L");
    button.dataset.d2lToNotebooklmDownloadButton = "1";
    element.insertAdjacentElement("afterend", button);

    element.dataset.d2lToNotebooklmDownloadEnhanced = "1";
  }
}

function getCourseIdFromHref(href: string): string | null {
  try {
    const parsed = new URL(href, window.location.origin);
    const match = parsed.pathname.match(/\/home\/(\d+)(?:\/|$)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function isInOrUnderHost(node: Node, host: Element): boolean {
  let current: Node | null = node;

  while (current) {
    if (current === host) {
      return true;
    }

    const rootNode = current.getRootNode();
    if (rootNode instanceof ShadowRoot) {
      current = rootNode.host;
      continue;
    }

    current = current.parentNode;
  }

  return false;
}

function findCourseLinkTargets(hosts: Element[]): HTMLAnchorElement[] {
  const targets: HTMLAnchorElement[] = [];

  for (const element of queryAllDeep("a[href]")) {
    if (!(element instanceof HTMLAnchorElement)) {
      continue;
    }

    if (!getCourseIdFromHref(element.href)) {
      continue;
    }

    if (!hosts.some((host) => isInOrUnderHost(element, host))) {
      continue;
    }

    targets.push(element);
  }

  return targets;
}

function insertCourseBoxButtons(): void {
  const myCoursesHosts = queryAllDeep("d2l-my-courses");
  if (myCoursesHosts.length === 0) {
    return;
  }

  const courseLinks = findCourseLinkTargets(myCoursesHosts);

  for (const courseLink of courseLinks) {
    const courseId = getCourseIdFromHref(courseLink.href);
    if (!courseId) {
      continue;
    }

    if (courseLink.dataset.d2lToNotebooklmCourseEnhanced === "1") {
      continue;
    }

    const existingSibling = courseLink.nextElementSibling;
    if (
      existingSibling instanceof HTMLElement &&
      existingSibling.dataset.d2lToNotebooklmCourseButton === courseId
    ) {
      courseLink.dataset.d2lToNotebooklmCourseEnhanced = "1";
      continue;
    }

    const wrapper = document.createElement("span");
    wrapper.dataset.d2lToNotebooklmCourseButton = courseId;
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";

    const button = createActionButton("Add to D2L");
    wrapper.append(button);

    courseLink.insertAdjacentElement("afterend", wrapper);
    courseLink.dataset.d2lToNotebooklmCourseEnhanced = "1";
  }
}

function runInjections(): void {
  cleanupLegacyNavbarButton();
  insertDownloadButtons();
  insertCourseBoxButtons();
}

function init(): void {
  runInjections();

  const observer = new MutationObserver(() => {
    runInjections();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  for (let i = 0; i < 10; i += 1) {
    setTimeout(runInjections, 300 * (i + 1));
  }
}

init();
