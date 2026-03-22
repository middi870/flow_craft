// templates.js — Pre-built pipeline templates for FlowCraft
// Each template has nodes + edges fully configured, ready to load

import { MarkerType } from 'reactflow';

const edge = (id, source, target, srcHandle, tgtHandle, label) => ({
  id,
  source,
  target,
  sourceHandle: `${source}-${srcHandle}`,
  targetHandle: `${target}-${tgtHandle}`,
  type: 'flowEdge',
  animated: true,
  label: label || undefined,
  labelStyle: { fontSize: 9, fill: 'var(--tx2)', fontFamily: 'var(--mono)' },
  labelBgStyle: { fill: 'var(--s2)', fillOpacity: .9 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#3a3a60', width: 14, height: 14 },
});

export const TEMPLATES = [

  // ── 1. Hello AI — simplest possible pipeline ────────────────────────────────
  {
    id: 'hello-ai',
    name: 'Hello AI',
    description: 'The simplest pipeline — type a question, get an AI answer. Perfect for first-timers.',
    icon: '◈',
    color: '#a78bfa',
    category: 'Beginner',
    tags: ['starter', 'llm', 'chat'],
    nodes: [
      {
        id: 'n1', type: 'customInput',
        position: { x: 80, y: 180 },
        data: { id: 'n1', inputName: 'question', inputType: 'Text', description: 'Type your question here' },
      },
      {
        id: 'n2', type: 'llm',
        position: { x: 380, y: 160 },
        data: { id: 'n2', model: 'llama3.2', systemPrompt: 'You are a friendly, helpful assistant. Give clear, concise answers.', temperature: '0.7', maxTokens: '500' },
      },
      {
        id: 'n3', type: 'customOutput',
        position: { x: 700, y: 180 },
        data: { id: 'n3', outputName: 'answer', outputType: 'Text' },
      },
    ],
    edges: [
      edge('e1', 'n1', 'n2', 'value',    'prompt'),
      edge('e2', 'n2', 'n3', 'response', 'value'),
    ],
  },

  // ── 2. Text Summarizer ──────────────────────────────────────────────────────
  {
    id: 'text-summarizer',
    name: 'Text Summarizer',
    description: 'Paste any long text — an article, report, or email — and get a clean summary.',
    icon: '≡',
    color: '#60a5fa',
    category: 'Productivity',
    tags: ['summarize', 'text', 'llm'],
    nodes: [
      {
        id: 'n1', type: 'customInput',
        position: { x: 60, y: 180 },
        data: { id: 'n1', inputName: 'long_text', inputType: 'Text', description: 'Paste text to summarize' },
      },
      {
        id: 'n2', type: 'text',
        position: { x: 340, y: 140 },
        data: { id: 'n2', text: 'Please summarize the following text in 3-5 bullet points. Be concise and capture the key ideas:\n\n{{long_text}}' },
      },
      {
        id: 'n3', type: 'llm',
        position: { x: 640, y: 160 },
        data: { id: 'n3', model: 'llama3.2', systemPrompt: 'You are a professional summarizer. Return clean, easy-to-read bullet points.', temperature: '0.3', maxTokens: '400' },
      },
      {
        id: 'n4', type: 'customOutput',
        position: { x: 940, y: 180 },
        data: { id: 'n4', outputName: 'summary', outputType: 'Text' },
      },
    ],
    edges: [
      edge('e1', 'n1', 'n2', 'value',    'long_text', 'input text'),
      edge('e2', 'n2', 'n3', 'output',   'prompt',    'prompt'),
      edge('e3', 'n3', 'n4', 'response', 'value',     'summary'),
    ],
  },

  // ── 3. Local TTS with Piper ────────────────────────────────────────────────
  {
    id: 'piper-tts',
    name: 'Text → Speech (Piper)',
    description: 'Convert text to natural-sounding audio using Piper TTS running locally on your machine.',
    icon: '♪',
    color: '#fb7185',
    category: 'Audio',
    tags: ['tts', 'audio', 'piper', 'local'],
    nodes: [
      {
        id: 'n1', type: 'customInput',
        position: { x: 60, y: 200 },
        data: { id: 'n1', inputName: 'text_to_speak', inputType: 'Text', description: 'Text you want to convert to speech' },
      },
      {
        id: 'n2', type: 'transform',
        position: { x: 350, y: 160 },
        data: {
          id: 'n2',
          operation: 'custom',
          expression: `// Clean and prepare text for TTS
// Remove markdown, trim whitespace
return input
  .replace(/[*_~\`#]/g, '')
  .replace(/\\s+/g, ' ')
  .trim();`,
        },
      },
      {
        id: 'n3', type: 'api',
        position: { x: 660, y: 140 },
        data: {
          id: 'n3',
          method: 'POST',
          url: 'http://localhost:5500/tts',
          headers: '{"Content-Type": "application/json"}',
          body: '{"text": "{{input}}", "model": "en_US-lessac-high", "output": "speech.wav"}',
        },
      },
      {
        id: 'n4', type: 'note',
        position: { x: 640, y: 360 },
        data: {
          id: 'n4',
          content: `💡 Run Piper directly in terminal:\n\necho "Your text here" | piper-tts \\\n  --model ~/.piper/en_US-lessac-high.onnx \\\n  --output_file speech.wav\n\nOr start a local wrapper:\npiper-tts --model ~/.piper/en_US-lessac-high.onnx --json-input`,
        },
      },
      {
        id: 'n5', type: 'audioInput',
        position: { x: 980, y: 160 },
        data: { id: 'n5', source: 'url', url: 'file://speech.wav', format: 'wav' },
      },
      {
        id: 'n6', type: 'customOutput',
        position: { x: 1280, y: 180 },
        data: { id: 'n6', outputName: 'audio_file', outputType: 'File' },
      },
    ],
    edges: [
      edge('e1', 'n1', 'n2', 'value',    'in',     'raw text'),
      edge('e2', 'n2', 'n3', 'out',      'body',   'clean text'),
      edge('e3', 'n3', 'n5', 'response', 'audio',  'audio data'),
      edge('e4', 'n5', 'n6', 'audio',    'value',  'output'),
    ],
  },

  // ── 4. gTTS (Google Text-to-Speech — free) ──────────────────────────────────
  {
    id: 'gtts-pipeline',
    name: 'Text → Speech (gTTS)',
    description: 'Free Google Text-to-Speech via the gTTS Python library. Needs internet.',
    icon: '🔊',
    color: '#34d399',
    category: 'Audio',
    tags: ['tts', 'audio', 'google', 'free'],
    nodes: [
      {
        id: 'n1', type: 'customInput',
        position: { x: 60, y: 200 },
        data: { id: 'n1', inputName: 'text', inputType: 'Text', description: 'Text to convert to speech' },
      },
      {
        id: 'n2', type: 'transform',
        position: { x: 340, y: 160 },
        data: {
          id: 'n2', operation: 'custom',
          expression: 'return input.replace(/[*_~`#]/g, "").trim();',
        },
      },
      {
        id: 'n3', type: 'api',
        position: { x: 640, y: 140 },
        data: {
          id: 'n3',
          method: 'POST',
          url: 'http://localhost:5500/gtts',
          headers: '{"Content-Type": "application/json"}',
          body: '{"text": "{{input}}", "lang": "en", "slow": false}',
        },
      },
      {
        id: 'n4', type: 'note',
        position: { x: 620, y: 360 },
        data: {
          id: 'n4',
          content: `💡 Python gTTS setup:\n\npip install gtts\n\nfrom gtts import gTTS\ntts = gTTS(text="Hello", lang="en")\ntts.save("speech.mp3")\n\nOr run the Flask wrapper:\npython gtts_server.py`,
        },
      },
      {
        id: 'n5', type: 'customOutput',
        position: { x: 940, y: 180 },
        data: { id: 'n5', outputName: 'speech_mp3', outputType: 'File' },
      },
    ],
    edges: [
      edge('e1', 'n1', 'n2', 'value',    'in',    'input'),
      edge('e2', 'n2', 'n3', 'out',      'body',  'clean text'),
      edge('e3', 'n3', 'n5', 'response', 'value', 'audio'),
    ],
  },

  // ── 5. AI Image Generation ────────────────────────────────────────────────
  {
    id: 'image-gen',
    name: 'AI Image Generator',
    description: 'Describe an image in plain English → AI enhances the prompt → generates the image locally via Stable Diffusion.',
    icon: '⬛',
    color: '#2dd4bf',
    category: 'Creative',
    tags: ['image', 'stable-diffusion', 'ai', 'local'],
    nodes: [
      {
        id: 'n1', type: 'customInput',
        position: { x: 60, y: 200 },
        data: { id: 'n1', inputName: 'description', inputType: 'Text', description: 'Describe what you want to create' },
      },
      {
        id: 'n2', type: 'text',
        position: { x: 340, y: 140 },
        data: {
          id: 'n2',
          text: 'Convert this image description into a detailed Stable Diffusion prompt. Add style, lighting, quality tags. Keep it under 77 tokens. Original description: {{description}}',
        },
      },
      {
        id: 'n3', type: 'llm',
        position: { x: 640, y: 130 },
        data: {
          id: 'n3', model: 'llama3.2',
          systemPrompt: 'You are an expert at writing Stable Diffusion prompts. Output only the prompt, nothing else. Include quality tags like: masterpiece, best quality, detailed, 8k.',
          temperature: '0.8', maxTokens: '200',
        },
      },
      {
        id: 'n4', type: 'api',
        position: { x: 940, y: 130 },
        data: {
          id: 'n4',
          method: 'POST',
          url: 'http://127.0.0.1:7860/sdapi/v1/txt2img',
          headers: '{"Content-Type": "application/json"}',
          body: '{"prompt": "{{enhanced_prompt}}", "negative_prompt": "blurry, low quality, ugly", "steps": 20, "width": 512, "height": 512}',
        },
      },
      {
        id: 'n5', type: 'note',
        position: { x: 920, y: 380 },
        data: {
          id: 'n5',
          content: `💡 Requires AUTOMATIC1111:\n\ngit clone https://github.com/AUTOMATIC1111/stable-diffusion-webui\ncd stable-diffusion-webui\n./webui.sh --api\n\nOr use ComfyUI on port 8188`,
        },
      },
      {
        id: 'n6', type: 'imageOutput',
        position: { x: 1250, y: 170 },
        data: { id: 'n6', displayMode: 'inline', filename: 'generated.png' },
      },
    ],
    edges: [
      edge('e1', 'n1', 'n2', 'value',    'description', 'description'),
      edge('e2', 'n2', 'n3', 'output',   'prompt',      'raw prompt'),
      edge('e3', 'n3', 'n4', 'response', 'body',        'enhanced prompt'),
      edge('e4', 'n4', 'n6', 'response', 'image',       'image data'),
    ],
  },

  // ── 6. AI Writing Assistant ───────────────────────────────────────────────
  {
    id: 'writing-assistant',
    name: 'AI Writing Assistant',
    description: 'Give a topic and tone → get a polished draft. Great for emails, blog posts, social captions.',
    icon: '✍',
    color: '#f472b6',
    category: 'Productivity',
    tags: ['writing', 'email', 'blog', 'llm'],
    nodes: [
      {
        id: 'n1', type: 'customInput',
        position: { x: 60, y: 120 },
        data: { id: 'n1', inputName: 'topic', inputType: 'Text', description: 'What to write about' },
      },
      {
        id: 'n2', type: 'customInput',
        position: { x: 60, y: 280 },
        data: { id: 'n2', inputName: 'tone', inputType: 'Text', description: 'Tone: professional, casual, funny…' },
      },
      {
        id: 'n3', type: 'text',
        position: { x: 340, y: 180 },
        data: {
          id: 'n3',
          text: 'Write a well-structured piece about: {{topic}}\n\nTone: {{tone}}\n\nInclude a strong opening, key points, and a clear conclusion.',
        },
      },
      {
        id: 'n4', type: 'llm',
        position: { x: 660, y: 160 },
        data: {
          id: 'n4', model: 'llama3.2',
          systemPrompt: 'You are an expert writer. Produce polished, engaging content tailored to the requested tone. Format with clear paragraphs.',
          temperature: '0.8', maxTokens: '800',
        },
      },
      {
        id: 'n5', type: 'customOutput',
        position: { x: 960, y: 180 },
        data: { id: 'n5', outputName: 'draft', outputType: 'Text' },
      },
    ],
    edges: [
      edge('e1', 'n1', 'n3', 'value',    'topic',    'topic'),
      edge('e2', 'n2', 'n3', 'value',    'tone',     'tone'),
      edge('e3', 'n3', 'n4', 'output',   'prompt',   'instructions'),
      edge('e4', 'n4', 'n5', 'response', 'value',    'draft'),
    ],
  },

  // ── 7. Data Transformer ───────────────────────────────────────────────────
  {
    id: 'data-transformer',
    name: 'JSON Data Transformer',
    description: 'Fetch data from any API, clean and transform it, then output structured results.',
    icon: '⟳',
    color: '#60a5fa',
    category: 'Data',
    tags: ['json', 'api', 'transform', 'data'],
    nodes: [
      {
        id: 'n1', type: 'customInput',
        position: { x: 60, y: 200 },
        data: { id: 'n1', inputName: 'api_url', inputType: 'Text', description: 'The API endpoint to fetch data from' },
      },
      {
        id: 'n2', type: 'api',
        position: { x: 340, y: 170 },
        data: { id: 'n2', method: 'GET', url: '{{api_url}}', headers: '{"Accept": "application/json"}', body: '' },
      },
      {
        id: 'n3', type: 'transform',
        position: { x: 640, y: 150 },
        data: {
          id: 'n3', operation: 'custom',
          expression: `// Transform the API response
// input is the raw JSON response
const data = JSON.parse(input);
// Example: extract just the first 5 items
return JSON.stringify(data.slice ? data.slice(0, 5) : data, null, 2);`,
        },
      },
      {
        id: 'n4', type: 'condition',
        position: { x: 940, y: 150 },
        data: { id: 'n4', condition: 'input && input.length > 0', trueLabel: 'Has Data', falseLabel: 'Empty' },
      },
      {
        id: 'n5', type: 'customOutput',
        position: { x: 1200, y: 100 },
        data: { id: 'n5', outputName: 'result', outputType: 'JSON' },
      },
      {
        id: 'n6', type: 'customOutput',
        position: { x: 1200, y: 260 },
        data: { id: 'n6', outputName: 'empty_result', outputType: 'Text' },
      },
    ],
    edges: [
      edge('e1', 'n1', 'n2', 'value',    'body',     'url'),
      edge('e2', 'n2', 'n3', 'response', 'in',       'raw data'),
      edge('e3', 'n3', 'n4', 'out',      'in',       'transformed'),
      edge('e4', 'n4', 'n5', 'true',     'value',    'Has Data'),
      edge('e5', 'n4', 'n6', 'false',    'value',    'Empty'),
    ],
  },

  // ── 8. TTS + Image — Multimedia Story Creator ────────────────────────────
  {
    id: 'multimedia-story',
    name: 'Multimedia Story Creator',
    description: 'Give a story prompt → AI writes the story → generates a matching image + audio narration.',
    icon: '✦',
    color: '#c084fc',
    category: 'Creative',
    tags: ['story', 'tts', 'image', 'creative', 'ai'],
    nodes: [
      {
        id: 'n1', type: 'customInput',
        position: { x: 60, y: 220 },
        data: { id: 'n1', inputName: 'story_prompt', inputType: 'Text', description: 'Story idea or theme' },
      },
      {
        id: 'n2', type: 'llm',
        position: { x: 340, y: 200 },
        data: {
          id: 'n2', model: 'llama3.2',
          systemPrompt: 'You are a creative story writer. Write short, vivid stories (2-3 paragraphs). Always end with a memorable line.',
          temperature: '0.9', maxTokens: '400',
        },
      },
      {
        id: 'n3', type: 'merge',
        position: { x: 660, y: 100 },
        data: { id: 'n3', strategy: 'first', separator: '' },
      },
      {
        id: 'n4', type: 'api',
        position: { x: 940, y: 60 },
        data: {
          id: 'n4', method: 'POST',
          url: 'http://localhost:5500/tts',
          headers: '{"Content-Type": "application/json"}',
          body: '{"text": "{{story}}", "model": "en_US-lessac-high", "output": "story.wav"}',
        },
      },
      {
        id: 'n5', type: 'text',
        position: { x: 660, y: 310 },
        data: { id: 'n5', text: 'Create a cinematic illustration for this story: {{story_prompt}}. Style: digital art, atmospheric, detailed.' },
      },
      {
        id: 'n6', type: 'api',
        position: { x: 940, y: 310 },
        data: {
          id: 'n6', method: 'POST',
          url: 'http://127.0.0.1:7860/sdapi/v1/txt2img',
          headers: '{"Content-Type": "application/json"}',
          body: '{"prompt": "{{scene_prompt}}", "steps": 20, "width": 512, "height": 512}',
        },
      },
      {
        id: 'n7', type: 'customOutput',
        position: { x: 1220, y: 60 },
        data: { id: 'n7', outputName: 'audio_story', outputType: 'File' },
      },
      {
        id: 'n8', type: 'imageOutput',
        position: { x: 1220, y: 310 },
        data: { id: 'n8', displayMode: 'inline', filename: 'story_image.png' },
      },
    ],
    edges: [
      edge('e1', 'n1', 'n2', 'value',    'prompt',  'prompt'),
      edge('e2', 'n2', 'n3', 'response', 'a',       'story'),
      edge('e3', 'n3', 'n4', 'out',      'body',    'story text'),
      edge('e4', 'n1', 'n5', 'value',    'story_prompt', 'prompt'),
      edge('e5', 'n5', 'n6', 'output',   'body',    'image prompt'),
      edge('e6', 'n4', 'n7', 'response', 'value',   'audio'),
      edge('e7', 'n6', 'n8', 'response', 'image',   'image'),
    ],
  },

];

export const TEMPLATE_CATEGORIES = ['All', ...new Set(TEMPLATES.map(t => t.category))];

// ── 9. Ollama Direct Generate (matches the curl example exactly) ─────────────
TEMPLATES.push({
  id: 'ollama-direct',
  name: 'Ollama Direct Generate',
  description: 'Calls POST /api/generate — exactly like the curl example. Type a prompt, run it, see the response.',
  icon: '◈',
  color: '#7c6fcd',
  category: 'Beginner',
  tags: ['ollama', 'generate', 'local', 'starter'],
  nodes: [
    {
      id: 'n1', type: 'customInput',
      position: { x: 80, y: 200 },
      data: { id: 'n1', inputName: 'prompt', inputType: 'Text', description: 'Your prompt — e.g. "Say hello"' },
    },
    {
      id: 'n2', type: 'ollamaGenerate',
      position: { x: 380, y: 170 },
      data: {
        id: 'n2', model: 'llama3',
        prompt: '',
        systemPrompt: 'You are a helpful assistant.',
        temperature: '0.7', maxTokens: '500',
      },
    },
    {
      id: 'n3', type: 'customOutput',
      position: { x: 700, y: 200 },
      data: { id: 'n3', outputName: 'response', outputType: 'Text' },
    },
    {
      id: 'n4', type: 'note',
      position: { x: 360, y: 380 },
      data: {
        id: 'n4',
        content: `This is equivalent to:\n\ncurl http://localhost:11434/api/generate \\\n  -d '{"model":"llama3","prompt":"Say hello"}'\n\nMake sure Ollama is running:\n  ollama serve`,
      },
    },
  ],
  edges: [
    edge('e1', 'n1', 'n2', 'value',    'prompt'),
    edge('e2', 'n2', 'n3', 'response', 'value'),
  ],
});

// ── 10. Smart Q&A with context ────────────────────────────────────────────────
TEMPLATES.push({
  id: 'smart-qa',
  name: 'Smart Q&A with Context',
  description: 'Provide a context document + a question. The AI reads the context and answers specifically.',
  icon: '?',
  color: '#60a5fa',
  category: 'Productivity',
  tags: ['qa', 'context', 'rag-lite', 'llm'],
  nodes: [
    {
      id: 'n1', type: 'customInput',
      position: { x: 60, y: 120 },
      data: { id: 'n1', inputName: 'context', inputType: 'Text', description: 'Paste a document, article, or notes' },
    },
    {
      id: 'n2', type: 'customInput',
      position: { x: 60, y: 300 },
      data: { id: 'n2', inputName: 'question', inputType: 'Text', description: 'Your question about the context' },
    },
    {
      id: 'n3', type: 'text',
      position: { x: 340, y: 190 },
      data: { id: 'n3', text: 'Context:\n{{context}}\n\nQuestion: {{question}}\n\nAnswer based only on the context above.' },
    },
    {
      id: 'n4', type: 'ollamaGenerate',
      position: { x: 640, y: 170 },
      data: {
        id: 'n4', model: 'llama3',
        systemPrompt: 'Answer questions accurately based only on the provided context. If the answer is not in the context, say so.',
        temperature: '0.3', maxTokens: '600',
      },
    },
    {
      id: 'n5', type: 'customOutput',
      position: { x: 940, y: 195 },
      data: { id: 'n5', outputName: 'answer', outputType: 'Text' },
    },
  ],
  edges: [
    edge('e1', 'n1', 'n3', 'value',    'context',  'context'),
    edge('e2', 'n2', 'n3', 'value',    'question', 'question'),
    edge('e3', 'n3', 'n4', 'output',   'prompt',   'prompt'),
    edge('e4', 'n4', 'n5', 'response', 'value',    'answer'),
  ],
});
