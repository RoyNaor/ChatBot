# 🤖 ChatBot Monorepo

Welcome to **ChatBot**, a Bun-powered monorepo that runs a full-stack chatbot experience with:

- 🖥️ **Client** app (React + Vite)
- 🛠️ **Server** app (Bun API)
- 🚀 **Single-command local development**

---

## ✨ Project Overview

This repository is organized as a workspace-based monorepo:

- `packages/client` → frontend application
- `packages/server` → backend API
- `index.ts` → root development orchestrator using `concurrently`

When you run development from the root, both client and server start together so you can build and test quickly. ⚡

---

## 🧱 Tech Stack

- **Runtime:** [Bun](https://bun.com)
- **Language:** TypeScript
- **Monorepo:** Bun workspaces (`packages/*`)
- **Frontend:** React + Vite
- **Backend:** Bun server architecture

---

## 📁 Repository Structure

```text
.
├── index.ts               # Runs client + server concurrently
├── package.json           # Root workspace + scripts
├── packages/
│   ├── client/            # Frontend app
│   └── server/            # Backend API
└── README.md              # You are here 👋
```

---

## ⚙️ Prerequisites

Before starting, make sure you have:

- ✅ **Bun** installed (recommended latest stable version)

Check your Bun version:

```bash
bun --version
```

---

## 🚀 Getting Started

### 1) Install dependencies

```bash
bun install
```

### 2) Run the full project (client + server)

```bash
bun run dev
```

This root command launches both packages in parallel using `concurrently`.

---

## 🧪 Development Notes

- Root script is defined in `package.json` as:
  - `dev`: `bun run index.ts`
- `index.ts` starts:
  - `packages/server` as **server**
  - `packages/client` as **client**

If one package fails to boot, check that package’s own `README.md` and `package.json` for package-specific setup details. 🧭

---

## 🌱 Environment Setup

The server package provides an example environment file:

- `packages/server/.env.example`

Copy it and configure values as needed for local development.

---

## 📝 Useful Commands

From the **repository root**:

```bash
# Install all workspace dependencies
bun install

# Start both client and server
bun run dev
```

From package folders (if needed):

```bash
# Run inside a specific workspace
cd packages/client && bun run dev
cd packages/server && bun run dev
```

---

## 🤝 Contributing

Contributions are welcome! 🎉

A good flow is:

1. Create a feature branch
2. Make focused changes
3. Test locally
4. Open a PR with clear description

---

## 💡 Tip

If you are new to monorepos, start by running the root `dev` command and watching both logs side-by-side—you’ll quickly see how client/server interactions happen in real time. 🔍

Happy building! 🚀
