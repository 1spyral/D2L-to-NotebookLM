const ACTION_BLUE = "#1A73E8";
const ACTION_BLUE_HOVER = "#1765CC";
const ACTION_TEXT = "#FFFFFF";

export function queryAllDeep(selector: string, root: ParentNode = document): Element[] {
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

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function copyD2LButtonClasses(target: HTMLButtonElement, template: HTMLButtonElement): void {
  const styleClasses = Array.from(template.classList).filter(
    (className) => className === "d2l-button" || className.startsWith("d2l-button-")
  );

  if (styleClasses.length === 0) {
    target.classList.add("d2l-button");
    return;
  }

  target.classList.add(...styleClasses);
}

function findAnyD2LButtonTemplate(): HTMLButtonElement | null {
  const candidates = queryAllDeep("button.d2l-button");
  for (const candidate of candidates) {
    if (candidate instanceof HTMLButtonElement) {
      return candidate;
    }
  }
  return null;
}

function styleActionButton(button: HTMLButtonElement, templateButton?: HTMLButtonElement): void {
  const template = templateButton ?? findAnyD2LButtonTemplate();
  if (template) {
    copyD2LButtonClasses(button, template);
  } else {
    button.classList.add("d2l-button");
  }

  button.style.backgroundColor = ACTION_BLUE;
  button.style.borderColor = ACTION_BLUE;
  button.style.color = ACTION_TEXT;
  button.style.marginLeft = "0.5rem";
  button.style.whiteSpace = "nowrap";
  button.style.transition = "background-color 120ms ease, border-color 120ms ease";

  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = ACTION_BLUE_HOVER;
    button.style.borderColor = ACTION_BLUE_HOVER;
  });

  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = ACTION_BLUE;
    button.style.borderColor = ACTION_BLUE;
  });

  button.addEventListener("focus", () => {
    button.style.backgroundColor = ACTION_BLUE_HOVER;
    button.style.borderColor = ACTION_BLUE_HOVER;
  });

  button.addEventListener("blur", () => {
    button.style.backgroundColor = ACTION_BLUE;
    button.style.borderColor = ACTION_BLUE;
  });
}

export function createActionButton(
  label: string,
  templateButton?: HTMLButtonElement
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  styleActionButton(button, templateButton);
  return button;
}

export function setButtonBusy(button: HTMLButtonElement, busyLabel: string): () => void {
  const originalLabel = button.textContent ?? "";
  button.disabled = true;
  button.textContent = busyLabel;
  button.style.opacity = "0.85";
  button.dataset.originalLabel = originalLabel;

  return () => {
    button.disabled = false;
    button.textContent = originalLabel;
    button.style.opacity = "1";
    delete button.dataset.originalLabel;
  };
}

export function setButtonStatus(button: HTMLButtonElement, label: string, ms = 1800): void {
  const originalLabel = button.dataset.originalLabel ?? button.textContent ?? "";
  button.textContent = label;
  globalThis.setTimeout(() => {
    button.textContent = originalLabel;
  }, ms);
}
