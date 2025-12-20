/**
 * Test script to verify Ollama integration
 * Run with: node test-ollama.js
 */

const OpenAI = require('openai').default;
require('dotenv').config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';

console.log('🧪 Testing Ollama Integration');
console.log('================================');
console.log(`Base URL: ${OLLAMA_BASE_URL}`);
console.log(`Model: ${OLLAMA_MODEL}`);
console.log('================================\n');

async function testOllamaConnection() {
  try {
    // Check if Ollama is running
    console.log('1️⃣  Checking Ollama service...');
    const baseResponse = await fetch('http://localhost:11434/api/tags');
    if (!baseResponse.ok) {
      throw new Error('Ollama service is not accessible');
    }
    const models = await baseResponse.json();
    console.log('✅ Ollama service is running');
    console.log(`   Available models: ${models.models?.map(m => m.name).join(', ') || 'None'}\n`);
    
    // Check if the required model is available
    const hasModel = models.models?.some(m => m.name === OLLAMA_MODEL);
    if (!hasModel) {
      console.log(`⚠️  Model "${OLLAMA_MODEL}" is not available`);
      console.log(`   Run: ollama pull ${OLLAMA_MODEL}\n`);
    } else {
      console.log(`✅ Model "${OLLAMA_MODEL}" is available\n`);
    }

    // Test OpenAI SDK with Ollama
    console.log('2️⃣  Testing OpenAI SDK with Ollama...');
    const client = new OpenAI({
      baseURL: OLLAMA_BASE_URL,
      apiKey: 'ollama',
    });

    const response = await client.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from Ollama!" and nothing else.',
        },
      ],
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content;
    console.log('✅ Successfully received response from Ollama');
    console.log(`   Response: ${reply}\n`);

    // Test JSON mode
    console.log('3️⃣  Testing JSON response format...');
    const jsonResponse = await client.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: 'user',
          content: 'Return a JSON object with fields: name (value: "Test"), status (value: "success")',
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const jsonReply = jsonResponse.choices[0]?.message?.content;
    console.log('✅ Successfully received JSON response');
    console.log(`   Response: ${jsonReply}\n`);

    try {
      JSON.parse(jsonReply);
      console.log('✅ Response is valid JSON\n');
    } catch (e) {
      console.log('⚠️  Response is not valid JSON\n');
    }

    console.log('================================');
    console.log('🎉 All tests passed!');
    console.log('================================');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure Ollama is installed and running');
    console.error('2. Check if the model is pulled: ollama list');
    console.error(`3. Pull the model if needed: ollama pull ${OLLAMA_MODEL}`);
    console.error('4. Verify Ollama is accessible: curl http://localhost:11434/api/tags');
    process.exit(1);
  }
}

testOllamaConnection();
