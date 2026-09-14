// Google AI Studio API Key
const API_KEY = "AQ.Ab8RN6JO1RglXWdFLKS0DNNv-Ry5_hkn019cZDMEiWnLCpRTVg"; 

// Passcode Protection Logic (KINGVON - 3 Attempts)
let attemptsLeft = 3;
const lockScreen = document.getElementById('lockScreen');
const passcodeInput = document.getElementById('passcodeInput');
const unlockBtn = document.getElementById('unlockBtn');
const attemptsLeftSpan = document.getElementById('attemptsLeft');
const lockError = document.getElementById('lockError');

if (localStorage.getItem('zenUnlocked') === 'true') {
    lockScreen.classList.add('hidden');
}

function handleUnlock() {
    const val = passcodeInput.value.trim().toUpperCase();
    if (val === "KINGVON") {
        localStorage.setItem('zenUnlocked', 'true');
        lockScreen.classList.add('hidden');
    } else {
        attemptsLeft--;
        attemptsLeftSpan.textContent = attemptsLeft;
        if (attemptsLeft <= 0) {
            lockError.textContent = "Locked out. Too many incorrect attempts.";
            passcodeInput.disabled = true;
            unlockBtn.disabled = true;
        } else {
            lockError.textContent = "Incorrect password. Try again.";
        }
    }
}

unlockBtn.onclick = handleUnlock;
passcodeInput.onkeypress = (e) => { if (e.key === 'Enter') handleUnlock(); };

// Main Chat UI elements
const chatArea = document.getElementById('chatArea');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const welcomeScreen = document.getElementById('welcomeScreen');
const plusBtn = document.getElementById('plusBtn');
const attachMenu = document.getElementById('attachMenu');
const imageUpload = document.getElementById('imageUpload');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeImage = document.getElementById('removeImage');
const fileName = document.getElementById('fileName');

let currentChatId = null;
let chats = JSON.parse(localStorage.getItem('zenChats')) || [];
let currentImageBase64 = null;
let currentImageMimeType = null;

// UI Handlers
document.getElementById('openSidebar').onclick = () => { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.remove('hidden'); };
document.getElementById('closeSidebar').onclick = document.getElementById('sidebarOverlay').onclick = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.add('hidden'); };

plusBtn.onclick = () => attachMenu.classList.toggle('hidden');
document.addEventListener('click', (e) => { if(!plusBtn.contains(e.target) && !attachMenu.contains(e.target)) attachMenu.classList.add('hidden'); });

// File Handling
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        currentImageBase64 = event.target.result.split(',')[1];
        currentImageMimeType = file.type;
        imagePreview.src = event.target.result;
        fileName.textContent = file.name;
        imagePreviewContainer.className = 'image-preview-visible';
        attachMenu.classList.add('hidden');
    };
    reader.readAsDataURL(file);
});

removeImage.onclick = () => {
    currentImageBase64 = null;
    currentImageMimeType = null;
    imagePreview.src = '';
    imageUpload.value = '';
    imagePreviewContainer.className = 'image-preview-hidden';
};

// Auto-grow textbox
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
sendBtn.onclick = sendMessage;

// Chat Logic & History
function loadHistoryUI() {
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    chats.forEach(chat => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<span>${chat.title}</span> <button class="delete-chat"><i class="fas fa-trash"></i></button>`;
        div.onclick = (e) => { if(e.target.closest('.delete-chat')) deleteChat(chat.id); else openChat(chat.id); };
        list.appendChild(div);
    });
}

function openChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    chatArea.innerHTML = '';
    if(chat && chat.messages) {
        chat.messages.forEach(msg => appendMessage(msg.text, msg.role, false));
    }
    if (window.innerWidth < 768) document.getElementById('closeSidebar').click();
}

document.getElementById('newChatBtn').onclick = () => {
    currentChatId = null;
    chatArea.innerHTML = '';
    chatArea.appendChild(welcomeScreen);
    if (window.innerWidth < 768) document.getElementById('closeSidebar').click();
};

function deleteChat(id) {
    chats = chats.filter(c => c.id !== id);
    localStorage.setItem('zenChats', JSON.stringify(chats));
    if(currentChatId === id) document.getElementById('newChatBtn').click();
    loadHistoryUI();
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text && !currentImageBase64) return;

    if (!currentChatId) {
        currentChatId = Date.now().toString();
        chats.unshift({ id: currentChatId, title: text || "Image Upload", messages: [] });
    }

    const currentChat = chats.find(c => c.id === currentChatId);
    
    let userMsgDisplay = text;
    if (currentImageBase64) userMsgDisplay += '<br>[Image Attached]';
    appendMessage(userMsgDisplay, 'user');
    currentChat.messages.push({ role: 'user', text: userMsgDisplay });
    
    userInput.value = '';
    userInput.style.height = 'auto';
    const payloadParts = [{ text: text || "Describe this image" }];
    
    if (currentImageBase64) {
        payloadParts.push({ inline_data: { mime_type: currentImageMimeType, data: currentImageBase64 } });
        removeImage.click(); 
    }

    appendMessage('<i class="fas fa-circle-notch fa-spin"></i> Thinking...', 'ai', true);

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-goog-api-key": API_KEY
            },
            body: JSON.stringify({ contents: [{ parts: payloadParts }] })
        });
        
        const data = await res.json();
        
        const aiText = data.candidates ? data.candidates[0].content.parts[0].text : (data.error ? data.error.message : "API Error occurred.");
        appendMessage(aiText, 'ai');
        currentChat.messages.push({ role: 'ai', text: aiText });
        
        localStorage.setItem('zenChats', JSON.stringify(chats));
        loadHistoryUI();

    } catch (err) {
        appendMessage("Network Error: Please check your connection.", 'ai');
    } finally {
        const loadingEls = chatArea.querySelectorAll('.ai-msg');
        loadingEls.forEach(el => {
            if (el.innerHTML.includes('fa-spinner') || el.innerHTML.includes('Thinking...')) {
                el.remove();
            }
        });
    }
}

function appendMessage(text, role, isLoading = false) {
    if (welcomeScreen.parentNode) welcomeScreen.remove();
    const div = document.createElement('div');
    div.className = `message ${role}-msg`;
    if (role === 'ai' && !isLoading && typeof marked !== 'undefined') {
        div.innerHTML = marked.parse(text);
    } else {
        div.innerHTML = text;
    }
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

document.querySelectorAll('.suggestion-btn').forEach(btn => {
    btn.onclick = () => { userInput.value = btn.innerText; sendMessage(); };
});

loadHistoryUI();
                          
