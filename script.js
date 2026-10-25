// State & Elements
let apiKey = localStorage.getItem('GEMINI_API_KEY') || '';

const btnKey = document.getElementById('btn-key');
const apiModal = document.getElementById('api-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnSaveKey = document.getElementById('btn-save-key');
const apiKeyInput = document.getElementById('api-key-input');
const aiStatus = document.getElementById('ai-status');

const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const chatMessages = document.getElementById('chat-messages');

const codeInput = document.getElementById('code-input');
const codeOutput = document.getElementById('code-output');
const btnRun = document.getElementById('btn-run');

// Initialize UI Status on startup
updateStatus();

// Modal Controls
function openModal() {
  apiKeyInput.value = apiKey;
  apiModal.style.display = 'flex';
}

function closeModal() {
  apiModal.style.display = 'none';
}

btnKey.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
  if (e.target === apiModal) closeModal();
});

// Save Key Action
btnSaveKey.addEventListener('click', () => {
  const inputKey = apiKeyInput.value.trim();
  if (!inputKey) {
    apiKeyInput.style.borderColor = '#ef4444';
    return;
  }
  
  apiKey = inputKey;
  localStorage.setItem('GEMINI_API_KEY', apiKey);
  apiKeyInput.style.borderColor = 'var(--border)';
  
  updateStatus();
  closeModal();
});

function updateStatus() {
  if (apiKey) {
    aiStatus.textContent = 'Gemini Live';
    aiStatus.style.background = 'rgba(16, 185, 129, 0.3)';
    aiStatus.style.color = '#10b981';
  } else {
    aiStatus.textContent = 'Simulation Mode';
    aiStatus.style.background = 'rgba(245, 158, 11, 0.3)';
    aiStatus.style.color = '#f59e0b';
  }
}

// Live Playground Execution
btnRun.addEventListener('click', () => {
  codeOutput.srcdoc = codeInput.value;
});

// Initial Auto-run Code
btnRun.click();

// Chat Mechanics
btnSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Direct & Fast Fetch Function
async function fetchGeminiResponse(text) {
  // Using direct fast model endpoint
  const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  // Timeout controller (8 seconds max wait)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: text }] }]
      })
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return { success: true, text: data.candidates[0].content.parts[0].text };
    }

    return { success: false, error: "Empty response received from server." };

  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      return { success: false, error: "Request timeout ho gaya. Internet connection slow ho sakta hai." };
    }
    return { success: false, error: "Network error. Connection reset ho gaya." };
  }
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage(text, 'user-msg');
  chatInput.value = '';

  const loadingMsg = appendMessage('Thinking...', 'ai-msg');

  if (apiKey) {
    const result = await fetchGeminiResponse(text);

    if (result.success) {
      loadingMsg.innerHTML = formatMarkdown(result.text);
    } else {
      loadingMsg.innerHTML = `<span style="color: #ef4444;">API Error: ${escapeHtml(result.error)}</span>`;
    }
  } else {
    setTimeout(() => {
      loadingMsg.textContent = "System (Simulation): API Key missing hai. Top bar se key save karein.";
    }, 400);
  }
}

// Helpers
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMarkdown(text) {
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre style="background: #0d1117; padding: 12px; border-radius: 8px; font-family: monospace; overflow-x: auto; margin: 10px 0; border: 1px solid rgba(255,255,255,0.15);"><code>$1</code></pre>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

function appendMessage(text, className) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${className}`;
  msgDiv.textContent = text;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msgDiv;
}

// Background Canvas Effect
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const particles = Array.from({ length: 40 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 2 + 1,
  speedY: Math.random() * 0.5 + 0.2
}));

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 242, 254, 0.3)';
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    p.y -= p.speedY;
    if (p.y < 0) p.y = canvas.height;
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();