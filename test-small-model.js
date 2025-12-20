import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama'
});

try {
  console.log('Testing llama3.2:3b model...');
  const response = await client.chat.completions.create({
    model: 'llama3.2:3b',
    messages: [{ role: 'user', content: 'Say "Hello from Ollama!" in one sentence.' }],
    max_tokens: 50
  });
  
  console.log('✅ Success!');
  console.log('Response:', response.choices[0].message.content);
} catch (error) {
  console.log('❌ Error:', error.message);
}
