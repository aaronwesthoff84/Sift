# Sift - Local AI File Sorter

Universal cross-platform AI-powered file sorting desktop application powered by local **Ollama** models and local heuristic processing. No external API keys or cloud connections required.

## Prerequisites

- **Node.js**: v18 or later
- **Ollama** (optional for LLM classification): Download from [ollama.com](https://ollama.com) and pull a model:
  ```bash
  ollama pull llama3.2
  ```

## Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Ollama (Local AI engine):**
   ```bash
   ollama serve
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.