# Ollama Migration Guide

This document describes the migration from OpenAI GPT-4 to Ollama with the gpt-oss:20b model for the VibeManager application.

## Summary of Changes

### 1. Modified Files

#### `src/server/services/ai.ts`
- **Changed**: OpenAI client initialization to use Ollama's endpoint
- **Changed**: Model references from `"gpt-4"` to `"gpt-oss:20b"`
- **Added**: Support for environment variables:
  - `OLLAMA_BASE_URL`: Base URL for Ollama API (default: `http://localhost:11434/v1`)
  - `OLLAMA_MODEL`: Model name to use (default: `gpt-oss:20b`)
  - `OLLAMA_API_KEY`: API key placeholder (Ollama doesn't require auth, but SDK needs a value)

#### `.env` and `.env.example`
- **Deprecated**: `OPENAI_API_KEY` (commented out)
- **Added**: Ollama configuration variables:
  ```env
  OLLAMA_BASE_URL="http://localhost:11434/v1"
  OLLAMA_MODEL="gpt-oss:20b"
  OLLAMA_API_KEY="ollama"
  ```

#### `test-ollama.js`
- **Added**: New test script to verify Ollama integration

### 2. Technical Approach

The migration uses Ollama's **OpenAI-compatible API**, which means:
- ✅ No need to install additional packages
- ✅ Minimal code changes required
- ✅ Existing OpenAI SDK continues to work
- ✅ Easy to switch back to OpenAI if needed

## Prerequisites

### Step 1: Install Ollama

**On Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**On macOS:**
```bash
brew install ollama
```

**On Windows:**
Download and install from [ollama.com](https://ollama.com)

### Step 2: Start Ollama Service

```bash
# Start Ollama in the background
ollama serve &

# Or if Ollama is installed as a system service, ensure it's running
systemctl status ollama  # Linux
```

### Step 3: Pull the Required Model

```bash
# Pull the gpt-oss:20b model
ollama pull gpt-oss:20b

# Verify the model is available
ollama list
```

**Note**: The model download may take some time depending on your internet connection. The gpt-oss:20b model is approximately 11-12 GB.

### Step 4: Verify Ollama is Running

```bash
# Check if Ollama API is accessible
curl http://localhost:11434/api/tags

# Expected output: JSON with list of available models
```

## Testing the Integration

### Quick Test

Run the provided test script:

```bash
cd /home/ubuntu/VibeManager
node test-ollama.js
```

The test script will:
1. ✅ Check if Ollama service is running
2. ✅ Verify the gpt-oss:20b model is available
3. ✅ Test basic chat completion
4. ✅ Test JSON response format

### Full Application Test

1. **Start the database** (if not already running):
   ```bash
   # Ensure PostgreSQL is running
   sudo systemctl status postgresql
   ```

2. **Start the development server**:
   ```bash
   cd /home/ubuntu/VibeManager
   npm run dev
   ```

3. **Test AI features**:
   - Navigate to the application at `http://localhost:3000`
   - Try creating a new feature mindmap
   - Verify that PRD generation works
   - Check that responses are coming from Ollama

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_BASE_URL` | Ollama API endpoint | `http://localhost:11434/v1` |
| `OLLAMA_MODEL` | Model to use for AI generation | `gpt-oss:20b` |
| `OLLAMA_API_KEY` | API key (not used by Ollama) | `ollama` |

### Using a Different Model

To use a different Ollama model:

1. Pull the model:
   ```bash
   ollama pull <model-name>
   ```

2. Update `.env`:
   ```env
   OLLAMA_MODEL="<model-name>"
   ```

### Using Remote Ollama Instance

If Ollama is running on a different machine:

1. Update `.env`:
   ```env
   OLLAMA_BASE_URL="http://<remote-host>:11434/v1"
   ```

2. Ensure the remote Ollama instance allows external connections

## Troubleshooting

### Issue: "Ollama service is not accessible"

**Solution:**
```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama if not running
ollama serve &
```

### Issue: "Model not found" or "model not available"

**Solution:**
```bash
# List available models
ollama list

# Pull the required model
ollama pull gpt-oss:20b
```

### Issue: "Connection refused to localhost:11434"

**Solution:**
```bash
# Check if Ollama is listening on the correct port
netstat -tuln | grep 11434

# Or use lsof
lsof -i :11434

# Restart Ollama
pkill ollama
ollama serve &
```

### Issue: Slow response times

**Possible causes:**
- Model is too large for your system
- Insufficient RAM or VRAM
- CPU-only inference (GPU acceleration not enabled)

**Solutions:**
1. Use a smaller model (e.g., `gpt-oss:7b` or `llama2:13b`)
2. Ensure GPU drivers are installed if you have a compatible GPU
3. Allocate more system resources to Ollama

### Issue: JSON format responses not working

Some Ollama models may not support the `response_format` parameter. If you encounter issues:

1. Try a model that supports JSON mode
2. Or modify the prompt to explicitly request JSON format in the message content

## Performance Considerations

### Model Comparison

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| `gpt-oss:20b` | ~11GB | Moderate | High | Production |
| `gpt-oss:7b` | ~4GB | Fast | Good | Development |
| `llama2:70b` | ~39GB | Slow | Excellent | High-quality results |

### Hardware Requirements

For `gpt-oss:20b`:
- **Minimum**: 16GB RAM (CPU inference)
- **Recommended**: 24GB VRAM (GPU inference) or 32GB RAM (CPU)
- **Storage**: 15GB free space

## Reverting to OpenAI

If you need to switch back to OpenAI:

1. **Restore the AI service**:
   ```typescript
   // src/server/services/ai.ts
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
   });
   ```

2. **Update model references**:
   ```typescript
   model: "gpt-4"  // or "gpt-3.5-turbo"
   ```

3. **Update `.env`**:
   ```env
   OPENAI_API_KEY="sk-your-actual-api-key"
   ```

## Benefits of Ollama

✅ **Cost-effective**: No API usage fees  
✅ **Privacy**: Data stays on your infrastructure  
✅ **Offline capable**: Works without internet connection  
✅ **Customizable**: Can fine-tune models for your use case  
✅ **No rate limits**: Only limited by your hardware  

## Limitations

⚠️ **Hardware requirements**: Needs significant RAM/VRAM  
⚠️ **Setup complexity**: Requires model downloads and configuration  
⚠️ **Response time**: May be slower than cloud APIs depending on hardware  
⚠️ **Model availability**: Fewer models compared to OpenAI  

## Additional Resources

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Ollama Models Library](https://ollama.com/library)
- [OpenAI API Compatibility](https://github.com/ollama/ollama/blob/main/docs/openai.md)

## Support

If you encounter issues not covered in this guide:
1. Check Ollama logs: `journalctl -u ollama -f` (Linux with systemd)
2. Verify environment variables are loaded: `echo $OLLAMA_BASE_URL`
3. Test Ollama directly: `ollama run gpt-oss:20b "Hello"`

---

**Last Updated**: December 19, 2025  
**VibeManager Version**: 0.1.0
