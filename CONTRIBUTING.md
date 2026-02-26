# Contributing

Bug reports, feature requests, and pull requests are all welcome — including AI-assisted contributions. Using Copilot, Cursor, or similar tools to write or improve code is fine; just review what you submit and make sure it actually works.

---

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/D2LToNotebookLM.git
cd D2LToNotebookLM
pnpm install
```

Start a dev build:

```bash
pnpm run dev:chrome   # or dev:firefox
```

Load the unpacked extension from `dist/chrome` (or `dist/firefox`) in your browser — see [README.md](README.md#load-extension-in-browser).

---

## Workflow

1. Fork the repo and create a branch off `main`
2. Make your changes and test in the browser
3. Run checks before committing:
   ```bash
   pnpm run format
   pnpm run lint
   pnpm run typecheck
   pnpm run test
   pnpm run build
   ```
4. Open a pull request with a short description of what changed and how you tested it

Keep PRs focused — one thing per PR is easier to review and merges faster.

---

## Reporting Issues

Open an issue and include what you did, what you expected, what happened, and your browser/OS. Console errors and screenshots help.

---

## Feature Requests

Open an issue before writing code. It's worth a quick discussion to make sure the idea fits the project before you invest time in it.
