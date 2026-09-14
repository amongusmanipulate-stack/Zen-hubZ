const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    if (sender === 'user') {
        messageDiv.classList.add('user-message');
    } else {
        messageDiv.classList.add('ai-message');
    }
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';

    // Simulate AI response logic (You can plug an actual API endpoint here later)
    setTimeout(() => {
        let reply = "Got it! Working on that for you.";
        const lower = text.toLowerCase();
        
        if (lower.includes('hello') || lower.includes('hi')) {
            reply = "Hey! What's up?";
        } else if (lower.includes('zen') || lower.includes('project')) {
            reply = "Zen Hub is looking clean with this purple theme.";
        }

        addMessage(reply, 'ai');
    }, 600);
}

sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});
