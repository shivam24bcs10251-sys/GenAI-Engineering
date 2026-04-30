import { sendChatMessage } from './api.js';

// ---------------------------------------------------------
// Persona Data
// ---------------------------------------------------------
const PERSONAS = {
  anshuman: {
    id: 'anshuman',
    name: 'Anshuman Singh',
    role: 'Co-founder, InterviewBit & Scaler',
    initial: 'A',
    color: '#f59e0b',
    greeting: "Hey! I'm Anshuman Singh, co-founder of InterviewBit and Scaler. Whether you want to talk DSA, cracking FAANG, or building something from scratch — I'm here. What's on your mind?",
    suggestions: [
      "How should I approach learning DSA from scratch?",
      "What's the most important skill for FAANG interviews?",
      "How did you build InterviewBit from scratch?"
    ]
  },
  abhimanyu: {
    id: 'abhimanyu',
    name: 'Abhimanyu Saxena',
    role: 'Co-founder, InterviewBit & Scaler',
    initial: 'A',
    color: '#10b981',
    greeting: "Hi! I'm Abhimanyu Saxena, co-founder of Scaler. Whether you're navigating a career transition, thinking about growth, or wondering about the bigger picture — let's talk. What's on your mind?",
    suggestions: [
      "How do I know if I'm growing in my career?",
      "What made you leave Facebook to start Scaler?",
      "How should a fresher think about their first job?"
    ]
  },
  kshitij: {
    id: 'kshitij',
    name: 'Kshitij Mishra',
    role: 'Lead Instructor, Scaler Academy',
    initial: 'K',
    color: '#3b82f6',
    greeting: "Arre! I'm Kshitij, instructor at Scaler — backend, databases, system design, all the good stuff. Ask me anything, bhai. No judgment here, only good vibes and great explanations. What do you want to learn today?",
    suggestions: [
      "Explain system design to me like I'm a beginner",
      "How do I get better at backend development?",
      "What's the difference between SQL and NoSQL?"
    ]
  }
};

// ---------------------------------------------------------
// Application State
// ---------------------------------------------------------
let currentPersona = 'anshuman';
let conversationHistory = [];
let isLoading = false;

// ---------------------------------------------------------
// DOM References (resolved after DOMContentLoaded)
// ---------------------------------------------------------
let messagesEl;
let messageInput;
let sendButton;
let chatAvatar;
let personaNameEl;
let personaRoleEl;
let typingContainer;
let typingNameEl;

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

/** Escape user-supplied text so it cannot inject HTML. */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ---------------------------------------------------------
// Welcome State
// ---------------------------------------------------------
function showWelcomeState(persona) {
  const chipsHtml = persona.suggestions
    .map(s => `<button class="suggestion-chip" type="button">${escapeHtml(s)}</button>`)
    .join('');

  messagesEl.innerHTML = `
    <div class="welcome-state">
      <div class="welcome-avatar" style="background: ${persona.color};">${escapeHtml(persona.initial)}</div>
      <p class="welcome-greeting">${escapeHtml(persona.greeting)}</p>
      <div class="suggestions">
        ${chipsHtml}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------
// Switch Persona
// ---------------------------------------------------------
function switchPersona(personaId) {
  const persona = PERSONAS[personaId];
  if (!persona) return;

  currentPersona = personaId;
  conversationHistory = [];

  // Update tab states
  document.querySelectorAll('.persona-tab').forEach(tab => {
    const isActive = tab.dataset.persona === personaId;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-pressed', String(isActive));
  });

  // Update chat header
  chatAvatar.textContent = persona.initial;
  chatAvatar.style.background = persona.color;
  personaNameEl.textContent = persona.name;
  personaRoleEl.textContent = persona.role;

  // Update typing indicator name (first word of persona name)
  typingNameEl.textContent = persona.name.split(' ')[0];

  // Show welcome state
  showWelcomeState(persona);
}

// ---------------------------------------------------------
// Append Message
// ---------------------------------------------------------
function appendMessage(role, htmlContent) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'bubble';
  bubbleEl.innerHTML = htmlContent;

  messageEl.appendChild(bubbleEl);
  messagesEl.appendChild(messageEl);
  scrollToBottom();
}

// ---------------------------------------------------------
// Send Message
// ---------------------------------------------------------
async function sendMessage() {
  if (isLoading) return;

  const message = messageInput.value.trim();
  if (!message) return;

  // Lock UI
  isLoading = true;
  sendButton.disabled = true;

  // Clear and reset input
  messageInput.value = '';
  messageInput.style.height = 'auto';

  // Remove welcome state if still visible
  const welcomeState = messagesEl.querySelector('.welcome-state');
  if (welcomeState) {
    welcomeState.remove();
  }

  // Show user message (HTML-escaped, not markdown)
  appendMessage('user', escapeHtml(message));

  // Update conversation history
  conversationHistory.push({ role: 'user', content: message });

  // Show typing indicator
  typingContainer.style.display = 'flex';
  scrollToBottom();

  try {
    const responseText = await sendChatMessage(currentPersona, conversationHistory);

    // Hide typing indicator
    typingContainer.style.display = 'none';

    // Render assistant response as sanitized markdown
    const renderedHtml = DOMPurify.sanitize(marked.parse(responseText));
    appendMessage('assistant', renderedHtml);

    // Push assistant turn to history
    conversationHistory.push({ role: 'assistant', content: responseText });

    scrollToBottom();
  } catch (err) {
    // Hide typing indicator
    typingContainer.style.display = 'none';

    // Show error bubble
    const errorMessage = err.message || 'Something went wrong. Please try again.';
    appendMessage('error', escapeHtml(errorMessage));
  } finally {
    isLoading = false;
    sendButton.disabled = false;
    messageInput.focus();
  }
}

// ---------------------------------------------------------
// Auto-resize Textarea
// ---------------------------------------------------------
function autoResize() {
  messageInput.style.height = 'auto';
  const newHeight = Math.min(messageInput.scrollHeight, 120);
  messageInput.style.height = `${newHeight}px`;
}

// ---------------------------------------------------------
// DOMContentLoaded — Wire up everything
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Resolve DOM references
  messagesEl = document.getElementById('messages');
  messageInput = document.getElementById('messageInput');
  sendButton = document.getElementById('sendButton');
  chatAvatar = document.getElementById('chatAvatar');
  personaNameEl = document.getElementById('personaName');
  personaRoleEl = document.getElementById('personaRole');
  typingContainer = document.getElementById('typingContainer');
  typingNameEl = document.getElementById('typingName');

  // Persona tab click listeners
  document.querySelectorAll('.persona-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchPersona(tab.dataset.persona);
    });
  });

  // Auto-resize textarea on input
  messageInput.addEventListener('input', autoResize);

  // Send on Enter (without Shift)
  messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Send button click
  sendButton.addEventListener('click', () => {
    sendMessage();
  });

  // Delegated click listener for suggestion chips
  document.addEventListener('click', e => {
    if (e.target.classList.contains('suggestion-chip')) {
      messageInput.value = e.target.textContent;
      autoResize();
      sendMessage();
    }
  });

  // Initialize with default persona
  switchPersona('anshuman');
});
