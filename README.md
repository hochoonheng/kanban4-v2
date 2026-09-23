# kanban4 — IT PMO Project Kanban (Demo)

A single-file Kanban board for tracking IT project tasks, built for internal demo and training use. It is not an official system and carries no official branding.

**Live demo:** https://hochoonheng.github.io/kanban4/

## Features

- Four columns: **Backlog**, **In Progress**, **Blocked** and **Done**
- Add tasks from a slide-out form with title, description, project/workstream, category, assignee, priority, status and due date, with inline validation
- Move cards by drag and drop, or with the keyboard-friendly **Move ▸** menu
- Delete cards with an inline Yes/No confirmation
- Filter by project, assignee and priority; column badges show the filtered counts
- Header summary of all tasks by status, plus an overdue count
- Priority pills and an **Overdue** badge that use text as well as colour
- Optional email notification for each new task via [FormSubmit](https://formsubmit.co/)
- Responsive layout that stacks to one column below 768px
- Accessible: labelled inputs, visible focus rings, `aria-live` announcements, Esc closes menus and the form

## Run locally

Open `index.html` in any modern browser. There is no build step, server or dependency.

The board starts with seed data dated relative to today. Nothing is saved: refreshing the page resets the board (this is by design).

## Email notifications

1. In `index.html`, set `FORMSUBMIT_ENDPOINT` to `https://formsubmit.co/ajax/<your-address>`.
2. Add a task. FormSubmit sends a one-time activation email; click the link in it. Nothing is delivered until you do.

While the endpoint still holds the `YOUR_EMAIL@example.com` placeholder, no request is sent and the board shows a warning toast. A failed notification never breaks the board — the card is still added locally.

Pages opened from `file://` send `Origin: null`, which FormSubmit may reject. Use the GitHub Pages site (or any http(s) server) for reliable delivery.

## Deployment

Every push to `main` deploys the site to GitHub Pages through [`.github/workflows/pages.yml`](.github/workflows/pages.yml). Only `index.html` is published.

## Tech

- Vanilla HTML, CSS and JavaScript in one file — no frameworks, libraries, CDNs or web fonts
- All colours and spacing come from CSS custom properties
- All user input is HTML-escaped before rendering

## Security

The repository is scanned for secrets, personal data and unsafe code before each publish. Please report any security issue by opening a GitHub issue (without including sensitive details) or contacting the repository owner.
