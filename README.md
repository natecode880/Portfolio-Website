# nathandelaportas.com

My personal portfolio site — built as a dark, code-editor-themed single-page-feeling experience, with a persistent Spotify jukebox that survives navigation across the whole site.

**Live:** [nathandelaportas.com](https://nathandelaportas.com)

---

## What's in here

The site is presented like a code editor: file tabs (`about.py`, `education.md`, `experience.log`, `skills.yaml`, `contact.sh`), a boot-sequence terminal, and a `git log`–styled work history.

| Page | What it shows |
|---|---|
| **Home** (`index.html`) | About, education, experience, featured projects, skills, contact |
| **Projects** (`projects.html`) | All 16 projects, grouped into tabs by category, linking to GitHub where a repo is public |
| **Music** (`music.html`) | A Spotify playlist that plays in the background — a compact version of the player follows you to every other page until you pause it |

### Features

- 🖥️ Terminal boot animation and `git log`–styled experience timeline
- 🗂️ Tabbed project browser (Quant & Trading, AI/ML, Full-Stack, Systems, Automation)
- 🎵 Persistent, draggable, resizable Spotify jukebox widget — implemented with a lightweight client-side router so navigating between pages never interrupts playback
- ♿ Respects `prefers-reduced-motion`, keyboard-focus visible throughout
- 📱 Responsive down to mobile

---

## Tech stack

No build step, no framework, no dependencies — just static files:

- **HTML / CSS / vanilla JS**
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts
- [Spotify iFrame API](https://developer.spotify.com/documentation/embeds) for the jukebox
- Hosted on **GitHub Pages** with a custom domain

## Project structure

```
.
├── index.html       # Home page
├── projects.html    # Full project list
├── music.html       # Jukebox page
├── style.css         # Shared styles for all pages
├── jukebox.js        # Persistent player, drag/resize widget, in-app router
├── home.js            # Home page logic (boot terminal, git log, tabs)
├── projects.js        # Projects page category-tab logic
└── CNAME               # Custom domain config for GitHub Pages
```

`jukebox.js` is the one doing the interesting work: clicking between pages doesn't trigger a normal browser navigation. It fetches the target page in the background and swaps only the `#page-content` region, while the jukebox widget lives outside that region — so the Spotify player is never destroyed while browsing. Opening any page directly (a bookmark, a shared link) still works as a normal page load.

---

## Running it locally

Because the router uses `fetch()`, opening `index.html` directly (`file://…`) won't work — browsers block that for local files. Use a local server instead:

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve
```

Then visit `http://localhost:8000`.

## Deployment

This repo is deployed via **GitHub Pages**:

1. Pages is enabled on the `main` branch, serving from `/` (root)
2. `CNAME` points the custom domain at `nathandelaportas.com`
3. DNS is configured with GitHub Pages' A records + a `CNAME` record for `www`

---

## Contact

**Nathan Delaportas**
[nathandelaportas.com](https://nathandelaportas.com) · [GitHub](https://github.com/natecode880) · [LinkedIn](https://www.linkedin.com/in/nathan-delaportas1/)

© 2026 Nathan Delaportas
