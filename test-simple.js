const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-oss:20b',
    prompt: 'Hi',
    stream: false,
    options: {
      num_ctx: 512,
      num_predict: 10
    }
  })
});

const data = await response.json();
console.log('Response:', data);
