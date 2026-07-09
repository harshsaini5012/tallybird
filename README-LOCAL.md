# 🕊️ Tallybird - Local VS Code Execution Guide

We have fully reorganized and separated the code into clean, dedicated `frontend/` (React SPA) and `backend/` (Express API Server) subdirectories. 

Follow these steps to set up and run Tallybird locally in your VS Code environment!

---

## 📂 Project Structure Overview

```text
INVOICE_GENERATOR_FINAL/
├── frontend/                # React / Vite Client Application
│   ├── src/                 # React UI components, styles & hooks
│   ├── package.json         # Frontend dependencies & run scripts
│   ├── vite.config.ts       # Vite build & local API proxy configuration
│   └── .env.example         # Template for client-side keys (Firebase, etc.)
│
└── backend/                 # Express API / AI Processing Server
    ├── server.ts            # REST endpoints, Gemini API, and OCR scanning
    ├── package.json         # Backend dependencies & run scripts
    └── .env.example         # Template for server secrets (GEMINI_API_KEY, etc.)
```

---

## 🚀 How to Run Locally

### 1. Prerequisites
Make sure you have [Node.js (v18 or higher)](https://nodejs.org/) installed on your machine.

---

### 2. Run the Backend Server
The backend handles the AI-powered OCR scanning, financial chatbot analysis, and database interactions.

1. Open your terminal and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Install the server dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example template:
   ```bash
   cp .env.example .env
   ```
4. Open the newly created `.env` file and insert your **Gemini API Key**:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   ```
5. Start the backend developer server:
   ```bash
   npm run dev
   ```
   *The server will successfully start listening on `http://localhost:3000`!*

---

### 3. Run the Frontend Client
The frontend is built with React, Vite, and Tailwind CSS. It communicates securely with your backend via a built-in dev proxy.

1. Open a new terminal tab/window and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install the client-side dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the template if you use custom keys (optional):
   ```bash
   cp .env.example .env
   ```
4. Start the Vite client application:
   ```bash
   npm run dev
   ```
   *The client will start running, usually at `http://localhost:5173`!*

---

## 🔗 How They Connect
In development mode, Vite is pre-configured via `vite.config.ts` to automatically proxy all client-side requests starting with `/api` to the backend server running on `http://localhost:3000`. 

This eliminates CORS issues and ensures that your server-side API keys (like `GEMINI_API_KEY`) stay completely hidden and protected from the browser.

---

## 📦 Exporting as a ZIP
To get these files onto your computer:
1. Click on the **Settings** menu gear icon in the top right corner of the AI Studio UI.
2. Select **Export to ZIP** or click **Download ZIP**.
3. Unzip the file on your computer, open the folder in **VS Code**, and follow the steps above!
