const GEMINI_MODEL = "gemini-3.6-flash";

const products = [
  { id: 1, name: "Neural Link Headset", price: 299.99, desc: "Direct-brain interface for zero-latency control.", img: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400" },
  { id: 2, name: "Quantum Smartwatch", price: 199.99, desc: "Holographic display with health monitoring.", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400" },
  { id: 3, name: "Cyber-Grip Keyboard", price: 129.99, desc: "Mechanical switches with dynamic rgb lighting.", img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400" },
  { id: 4, name: "Holo-Display Glasses", price: 499.99, desc: "AR glasses with lightweight spatial displays.", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400" },
  { id: 5, name: "Aero-Glide Drone", price: 349.99, desc: "4K AI tracking drone with auto-obstacle avoidance.", img: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=400" },
  { id: 6, name: "Pulse Portable Speaker", price: 89.99, desc: "360-degree spatial audio with sub-bass matrix.", img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400" }
  { id: 7, name: "Cyberpunk Gaming Mouse", price: 79.99, desc: "Ultra-lightweight mouse with 26K DPI sensor.", img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400" },
  { id: 8, name: "Holographic Studio Mic", price: 159.99, desc: "Studio-grade USB microphone with active noise cancellation.", img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400" }
];

let cart = [];
let userApiKey = localStorage.getItem('gemini_api_key') || '';

// Render Products
const productsGrid = document.getElementById('products-grid');
productsGrid.innerHTML = products.map(p => `
  <div class="product-card">
    <img src="${p.img}" alt="${p.name}">
    <div>
      <h3>${p.name}</h3>
      <p class="desc">${p.desc}</p>
    </div>
    <div class="card-footer">
      <span class="price">$${p.price}</span>
      <button class="add-cart-btn" onclick="addToCart(${p.id})">Add to Cart</button>
    </div>
  </div>
`).join('');

// Cart Logic
function addToCart(id) {
  const product = products.find(p => p.id === id);
  cart.push(product);
  updateCartUI();
}

// Function to remove an item by index
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function updateCartUI() {
  document.getElementById('cart-count').innerText = cart.length;
  const cartItems = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  
  cartItems.innerHTML = cart.length === 0 ? '<p>Cart is empty</p>' : 
    cart.map((item, index) => `
      <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span>${item.name}</span>
          <span style="color: var(--accent-cyan); margin-left: 10px;">$${item.price}</span>
        </div>
        <button 
          onclick="removeFromCart(${index})" 
          style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem;">
          Remove
        </button>
      </div>
    `).join('');

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  totalEl.innerText = `$${total.toFixed(2)}`;
}

// Modal Control
const modal = document.getElementById('cart-modal');
document.getElementById('open-cart').onclick = () => modal.style.display = 'flex';
document.getElementById('close-modal').onclick = () => modal.style.display = 'none';

document.getElementById('checkout-form').onsubmit = (e) => {
  e.preventDefault();
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  alert('Order processed successfully! Thank you for buying from NEXUS.');
  cart = [];
  updateCartUI();
  modal.style.display = 'none';
};

// AI API Setup & Chat Logic
const apiKeyInput = document.getElementById('api-key-input');
if (userApiKey) apiKeyInput.value = userApiKey;

document.getElementById('save-key-btn').onclick = () => {
  userApiKey = apiKeyInput.value.trim();
  localStorage.setItem('gemini_api_key', userApiKey);
  appendMessage(userApiKey ? "API key saved." : "Key cleared.", 'bot-message');
};

const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

document.getElementById('send-btn').onclick = handleChat;
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChat(); });

async function handleChat() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage(text, 'user-message');
  userInput.value = '';

  if (!userApiKey) {
    appendMessage("Please add your Gemini API key above to talk with AI Assistant.", 'error-message');
    return;
  }

  appendMessage('Processing query...', 'bot-message', 'loading-msg');

  try {
    const reply = await callGeminiAPI(text);
    appendMessage(reply, 'bot-message');
  } catch (error) {
    appendMessage(`Error: ${error.message}`, 'error-message');
  } finally {
    document.getElementById('loading-msg')?.remove();
  }
}

function appendMessage(text, className, id = null) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${className}`;
  if (id) msgDiv.id = id;
  msgDiv.innerText = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function callGeminiAPI(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${userApiKey}`;
  
  const storeContext = JSON.stringify(products);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ 
        parts: [{ text: `You are NEXUS AI assistant. Help customers choose tech from this store inventory: ${storeContext}. Keep replies under 2 sentences. Question: ${prompt}` }] 
      }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
  return data.candidates[0].content.parts[0].text;
}
