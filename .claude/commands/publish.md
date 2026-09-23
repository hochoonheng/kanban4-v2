---
description: Security-scan, update README (with a Playwright screenshot) + repo About, set up the GitHub Pages workflow, then commit and push to a GitHub repo
argument-hint: <owner/repo or https://github.com/owner/repo> [branch]
allowed-tools: Bash, PowerShell, Read, Write, Edit, Glob, Grep, AskUserQuestion, mcp__playwright
---

# Publish this project to GitHub

Target repo and optional branch: `$ARGUMENTS`

Work through the steps below **in order**. Stop and report if any step fails; never skip the security scan. Keep the user informed with one short line per step.

## 0. Resolve the target

1. Parse `$ARGUMENTS` into `OWNER/REPO` and `BRANCH` (default `main`). Accept `owner/repo`, `https://github.com/owner/repo(.git)` or `git@github.com:owner/repo.git`.
   - If no repo was given, show the current `git remote -v` and use **AskUserQuestion** to ask which repo to push to. Do not guess.
2. Check tooling:
   - `git --version` is required.
   - `gh --version` and `gh auth status` are needed for steps 3 and 5 (About section and Pages settings). If `gh` is missing or not logged in, tell the user to run `winget install --id GitHub.cli` then `gh auth login`, and carry on with the steps that do not need it. At the end, print the manual steps for anything that was skipped.
3. If the repo does not exist on GitHub (`gh repo view OWNER/REPO` fails), ask whether to create it (`gh repo create OWNER/REPO --public --source . --remote origin`). Creating a public repo is outward-facing: wait for a clear yes.
4. Make sure `origin` points to `https://github.com/OWNER/REPO.git` (`git remote add` or `git remote set-url`). If `origin` already points somewhere else, confirm before changing it.

## 1. Security scan (blocking gate)

Everything pushed becomes public on the internet. Scan the **files that would be committed** (tracked files plus the untracked files you intend to add, excluding `.git/`).

1. **Inventory.** Run `git status --porcelain` and list every untracked or modified file. Classify each as *site/source*, *repo docs/config*, or *unrelated* (e.g. `.docx`, `.xlsx`, `.pdf`, screenshots, assessment or personal documents, archives). The README screenshot `docs/screenshot.png` (step 2a) is *repo docs*, not unrelated. Unrelated files must **not** be staged; propose adding them to `.gitignore` and ask the user before doing so.
2. **Secrets.** Grep the candidate files (case-insensitive) for:
   - Keys and tokens: `api[_-]?key`, `secret`, `token`, `password`, `passwd`, `bearer`, `authorization:`, `-----BEGIN .*PRIVATE KEY-----`, `ghp_[A-Za-z0-9]{36}`, `github_pat_`, `gho_`, `sk-[A-Za-z0-9]{20,}`, `sk-ant-`, `AKIA[0-9A-Z]{16}`, `AIza[0-9A-Za-z_-]{35}`, `xox[baprs]-`.
   - Connection strings: `mongodb(\+srv)?://`, `postgres(ql)?://`, `mysql://`, `://[^/\s:]+:[^@\s]+@` (credentials in URLs).
   - Sensitive files by name: `.env*`, `*.pem`, `*.key`, `*.pfx`, `*.p12`, `id_rsa*`, `*.kdbx`, `credentials*`, `secrets*`.
   - If `gitleaks` or `trufflehog` is installed, run it as well (`gitleaks detect --no-banner -v` or `gitleaks dir .`), including git history.
3. **Personal data.** Grep for email addresses, phone numbers and NRIC/ID-like patterns (`[STFGM]\d{7}[A-Z]`). For this project, the email in `FORMSUBMIT_ENDPOINT` in `index.html` is expected to be public by design — flag it so the user consciously confirms it, but it is not a blocker. It must not be a real personal address the user did not intend to publish.
4. **Code-level checks for `index.html`** (see `CLAUDE.md` hard constraints):
   - Every value interpolated into `innerHTML` goes through `escapeHtml()` (XSS). Look for template-literal interpolation into HTML that bypasses it.
   - No `eval(`, `new Function(`, `document.write(`, inline `on*=` handlers built from user input, or `javascript:` URLs.
   - No external `<script src>`, `<link href>`, CDN, font or image URLs (the only allowed network call is the FormSubmit `fetch`).
   - No `localStorage`, `sessionStorage`, `indexedDB` or `document.cookie`.
   - External links opened with `target="_blank"` also have `rel="noopener noreferrer"`.
5. **Workflow checks** for `.github/workflows/*.yml`: permissions are least-privilege (`contents: read`, `pages: write`, `id-token: write`), no secrets are echoed, and no `pull_request_target` with a checkout of PR code.
6. **Report** a table: check · result (PASS / WARN / FAIL) · file:line · note.
   - Any **FAIL** (a real secret, key, private file, or unescaped XSS sink): stop, explain how to fix it, and do not push. If a secret was already committed in history, say so plainly: it must be rotated, and removing it from history needs `git filter-repo` — do not rewrite history without explicit approval.
   - **WARN** only: summarise and ask the user whether to continue.
   - All **PASS**: continue.

## 2. README.md

Read `index.html`, `CLAUDE.md` and the existing `README.md`. Create or rewrite `README.md` (keep any user-written content that is still accurate) with:

- Title and a one-paragraph description of what the board is (an internal demo/training Kanban board; no official branding).
- **Live demo** link: `https://OWNER.github.io/REPO/` (lower-case owner).
- **Features** (short bullets taken from the actual code: columns, add/move/delete, drag and drop, filters, overdue badge, summary, FormSubmit email notification, responsive layout, accessibility).
- **Run locally**: open `index.html` in a browser; no build or server needed. Note that refreshing resets to seed data (no persistence, by design).
- **Email notifications**: how to set `FORMSUBMIT_ENDPOINT`, the one-time FormSubmit activation email, and that `file://` may send `Origin: null` so serving over http(s)/GitHub Pages is more reliable.
- **Deployment**: GitHub Pages via `.github/workflows/pages.yml` on push to `main`.
- **Tech constraints**: vanilla HTML/CSS/JS, single file, no dependencies.
- **Security**: a line noting the pre-publish scan and how to report issues.

Keep it concise and factual — do not invent features that are not in the code.

### 2a. Screenshot

Capture a fresh screenshot of the board with the **Playwright MCP** server (configured in `.mcp.json`) and show it in the README.

1. Call `browser_resize` with 1440×900.
2. Call `browser_navigate` to `file:///<absolute path to index.html>`, URL-encoding spaces as `%20`.
3. Call `browser_console_messages` and stop if the page logged any errors.
4. Call `browser_take_screenshot` with `type: "png"` and `filename: "screenshot.png"`. Leave `fullPage` off so the image shows the viewport only.
5. Call `browser_close`.
6. The server saves the file relative to its own working directory, so find `screenshot.png` and move it to `docs/screenshot.png`. Delete any `page-*.yml` snapshot files it left behind.
7. Look at the image (Read it) to confirm it shows the board with its seed data and has no error toast or blank area.
8. Make sure `README.md` shows it directly under the **Live demo** line:
   `![Kanban board with Backlog, In Progress, Blocked and Done columns](docs/screenshot.png)`

If the Playwright MCP tools are not loaded in this session, fall back to the Playwright CLI:
`npx -y playwright screenshot --viewport-size=1440,900 "file:///<path>/index.html" docs/screenshot.png`
If neither works (for example, Node.js is missing), keep the existing screenshot and list this as a manual step in the final report.

The screenshot is repo documentation only. It is committed in step 5, but the Pages workflow does not publish it.

## 3. GitHub "About" section

Requires `gh`. Set description, homepage and topics:

```
gh repo edit OWNER/REPO \
  --description "Single-file vanilla JS Kanban board demo for IT project tracking — no build, no dependencies" \
  --homepage "https://OWNER.github.io/REPO/" \
  --add-topic kanban --add-topic vanilla-javascript --add-topic html-css-js \
  --add-topic github-pages --add-topic project-management --add-topic demo
```

Adjust the description to match the README (max ~350 chars). If the user supplied their own description or topics, use those instead. Verify with `gh repo view OWNER/REPO --json description,homepageUrl,repositoryTopics`.

## 4. GitHub Pages workflow

1. Ensure `.github/workflows/pages.yml` exists and deploys on push to `BRANCH` plus `workflow_dispatch`, using the current major versions of `actions/checkout`, `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`, with `permissions: contents: read, pages: write, id-token: write` and a `concurrency: pages` group.
2. The artifact must contain **only the site** (copy `index.html` — and any other site assets — into `_site/`). Never upload the repo root, so docs, `.claude/` and stray files are not published.
3. If the workflow already matches, leave it unchanged. If `BRANCH` is not `main`, update the trigger.
4. Enable Pages with the Actions source (requires `gh`; ignore "already exists" errors):
   ```
   gh api -X POST repos/OWNER/REPO/pages -f build_type=workflow
   gh api -X PUT  repos/OWNER/REPO/pages -f build_type=workflow
   ```

## 5. Commit and push

1. Stage **explicitly by path** — never `git add -A` / `git add .`. Only the files that passed the scan (e.g. `index.html`, `README.md`, `docs/screenshot.png`, `CLAUDE.md`, `.mcp.json`, `.gitignore`, `.github/workflows/pages.yml`, `.claude/commands/*.md`).
2. Show `git status` and `git diff --cached --stat`, then re-run the secret grep from step 1.2 on the staged content (`git diff --cached`) as a final check.
3. Commit with a clear message describing what changed (end with the attribution line required by the current session, if any).
4. Pushing publishes to the internet: summarise what will be pushed (repo, branch, files) and get a clear yes before `git push -u origin BRANCH`. Never force-push; if the push is rejected, fetch and explain the divergence instead.

## 6. Verify and report

- If `gh` is available: `gh run list --workflow pages.yml --limit 1`, then `gh run watch <id> --exit-status` to wait for the deploy.
- Open or fetch `https://OWNER.github.io/REPO/` and confirm it returns the board (the first deploy can take a minute or two).
- Final summary: security scan result, README changes, About section values, workflow status, commit SHA, Pages URL, and any manual steps left for the user (e.g. install `gh`, activate FormSubmit, Settings → Pages → Source: GitHub Actions).
