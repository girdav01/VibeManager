# 🚀 Quick Start: Ollama Integration

## What Changed?

VibeManager now uses **Ollama** instead of OpenAI for AI processing.

### Benefits
- ✅ **Free**: No API costs
- ✅ **Private**: Data stays on your machine
- ✅ **Offline**: Works without internet
- ✅ **Fast**: No network latency

---

## Get Started in 3 Steps

### Step 1: Install Ollama

**Automated (Recommended):**
```bash
cd /home/ubuntu/VibeManager
./setup-ollama.sh
```

**Manual:**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start service
ollama serve &

# Pull model (~11GB download)
ollama pull gpt-oss:20b
```

### Step 2: Verify Installation

```bash
# Test the integration
node test-ollama.js
```

Expected output:
```
✅ Ollama service is running
✅ Model "gpt-oss:20b" is available
✅ Successfully received response from Ollama
✅ Response is valid JSON
🎉 All tests passed!
```

### Step 3: Run the Application

```bash
npm run dev
```

Open http://localhost:3000 and test:
- Create a mindmap from an idea
- Generate a PRD
- Export to AI tools

---

## Troubleshooting

### "Ollama service is not accessible"
```bash
# Start Ollama
ollama serve &
```

### "Model not found"
```bash
# Pull the model
ollama pull gpt-oss:20b
```

### Check if Ollama is running
```bash
# Should return JSON with models
curl http://localhost:11434/api/tags
```

---

## Configuration

Edit `.env` to customize:

```env
OLLAMA_BASE_URL="http://localhost:11434/v1"
OLLAMA_MODEL="gpt-oss:20b"
```

### Use a Different Model

```bash
# List available models
ollama list

# Pull a different model
ollama pull llama2:13b

# Update .env
OLLAMA_MODEL="llama2:13b"
```

---

## Need More Help?

- 📖 Detailed guide: [OLLAMA_MIGRATION.md](./OLLAMA_MIGRATION.md)
- 🧪 Test script: `node test-ollama.js`
- 🔧 Setup script: `./setup-ollama.sh`

---

**Ready to go!** 🎉
