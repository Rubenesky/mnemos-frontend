# Mnemos — Frontend

> *Open memory for organizations that matter*

[![Backend Tests](https://img.shields.io/badge/backend%20tests-90%20passed-brightgreen.svg)](https://github.com/rubenesky/mnemos-backend)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883.svg?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg?logo=vite)](https://vitejs.dev/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%99%A5-red.svg)](https://github.com/rubenesky/mnemos-frontend)

---

## Overview

Mnemos is an open-source digital asset management system built for NGOs, cultural organizations, and educational institutions that need to preserve and share their visual and documentary memory. This repository contains the Vue 3 single-page application that powers the Mnemos user interface. It requires [mnemos-backend](https://github.com/rubenesky/mnemos-backend) as its API layer, which handles authentication, asset storage, and AI processing.

---

## 🖼️ Features

Mnemos ships with a set of screens designed for both technical administrators and non-technical volunteers:

| Screen | Description |
|---|---|
| **Login** | Clean entry point with Mnemos branding and token-based authentication via Laravel Sanctum |
| **Dashboard** | Overview of assets, processing statuses, and recent uploads at a glance |
| **Asset Gallery** | Browse, filter, and search your entire archive with AI-powered natural language search |
| **Asset Upload** | Drag-and-drop file upload with real-time AI processing status and duplicate detection |
| **Asset Detail** | Full metadata view including AI-generated tags, descriptions, and GDPR consent status |
| **Asset Edit** | Update metadata and apply AI-suggested variants for titles, descriptions, and tags with one click |
| **Public Gallery** | Share collections publicly without requiring visitor login |
| **GDPR Consent Panel** | Track and manage consent per asset with color-coded badges and CSV export |
| **Consent Request Form** | Generate a shareable token link for any pending consent; recipient responds without an account |
| **AI Chat (RAG)** | Ask questions about your archive in plain language and get answers grounded in your data |
| **Notification Bell** | Topbar bell with unread badge — fires on volunteer uploads and consent responses |
| **Onboarding Modal** | 3-step guided modal on first login; shown once, tracked in localStorage |

### Screenshots

| Dashboard | Asset Gallery | GDPR Consent Panel |
|---|---|---|
| ![Dashboard](docs/screenshots/01-dashboard.png) | ![Assets](docs/screenshots/02-assets.png) | ![Consents](docs/screenshots/04-consent-panel.png) |

| Asset Upload | AI Chat | Onboarding Modal |
|---|---|---|
| ![Upload](docs/screenshots/03-upload.png) | ![RAG](docs/screenshots/05-ai-chat.png) | ![Onboarding](docs/screenshots/07-onboarding.png) |

---

## ⚡ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API) |
| State management | Pinia |
| Routing | Vue Router 5 |
| Styles | Tailwind CSS v4 |
| Build tool | Vite 8 |
| HTTP client | Axios |
| Unit tests | Vitest + Vue Test Utils |
| Linting | ESLint + Oxlint |
| Formatting | Prettier |

---

## 🔧 Installation

### Prerequisites

- **Node.js** 20.19+ or 22.12+
- **[mnemos-backend](https://github.com/rubenesky/mnemos-backend)** running and accessible

### Steps

```bash
git clone https://github.com/rubenesky/mnemos-frontend
cd mnemos-frontend
npm install
cp .env.example .env
# Edit .env: set VITE_API_URL to your backend URL
npm run dev
```

Open `http://localhost:5173` in your browser.

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | URL of the mnemos-backend API | `http://localhost:8000/api` |
| `VITE_APP_NAME` | Application name shown in the browser tab | `Mnemos` |

---

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run test      # Run unit tests (Vitest)
npm run lint      # Lint with ESLint + Oxlint
npm run format    # Format with Prettier
```

---

## Project Structure

```
src/
├── api/          # Axios instance and interceptors (auth token, error handling)
├── components/   # Shared UI components (AppLayout, ToastNotification)
├── router/       # Vue Router configuration and navigation guards
├── stores/       # Pinia stores (auth, toast, theme)
└── views/        # Page-level Vue components
```

Navigation guards redirect unauthenticated users to `/login` and prevent authenticated users from reaching guest-only routes. The Axios instance automatically attaches the Bearer token from `localStorage` and handles common HTTP error codes (401, 403, 404, 422, 500+) with user-visible toast notifications.

---

## Roadmap

- [ ] Social media preview cards for public gallery
- [ ] Dark/light mode toggle in public gallery
- [ ] Drag-and-drop asset reordering in collections
- [ ] Email notification preferences UI
- [ ] Mobile-responsive improvements

---

## Contributing

Contributions are welcome from developers and non-developers alike. To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes following the guidelines below
4. Open a pull request against `main`

**Code style:** Run `npm run lint` and `npm run format` before opening a PR. The project uses ESLint + Oxlint with Prettier. Please follow Vue 3 Composition API patterns consistently.

**Tests:** Run `npm run test` to make sure all unit tests pass. New features should include tests where appropriate.

---

## License

MIT License — see the [LICENSE](LICENSE) file for details.
