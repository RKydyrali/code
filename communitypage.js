document.addEventListener('DOMContentLoaded', () => {

    // --- Элементы Модального окна Чата ---
    const chatModal = document.getElementById('chatModal');
    const closeChatModalBtn = document.getElementById('close-chat-modal');
    const chatTitle = document.getElementById('chat-title');
    const chatAvatar = document.getElementById('chat-avatar');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    let currentChatContext = null; 

    // --- Элементы Страницы ---
    const clanPanel = document.getElementById('open-clan-chat');
    const friendListContainer = document.getElementById('friend-list-container');
    
    // --- 1. ЗАГРУЗКА ДРУЗЕЙ (Имитация) ---
    const friends = [
        { id: 1, name: 'Friend_One', avatar: 'avatar.png' },
        { id: 2, name: 'Friend_Two', avatar: 'avatar.png' },
        { id: 3, name: 'Friend_Three', avatar: 'avatar.png' },
        { id: 4, name: 'Friend_Four', avatar: 'avatar.png' },
        { id: 5, name: 'Friend_Five', avatar: 'avatar.png' },
    ];

    friends.forEach(friend => {
        const friendDiv = document.createElement('div');
        friendDiv.className = 'friend-item';
        friendDiv.innerHTML = `<img src="${friend.avatar}" alt="${friend.name}">`;
        
        friendDiv.addEventListener('click', (e) => {
            e.stopPropagation(); 
            openChat('friend', friend);
        });
        
        friendListContainer.appendChild(friendDiv);
    });

    // --- 2. ОБРАБОТЧИКИ ОТКРЫТИЯ/ЗАКРЫТИЯ ЧАТА ---
    
    clanPanel.addEventListener('click', () => {
        openChat('clan', { name: 'CLAN NAME', avatar: 'avatar.png' });
    });

    closeChatModalBtn.addEventListener('click', () => chatModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === chatModal) {
            chatModal.style.display = 'none';
        }
    });

    // --- 3. ФУНКЦИЯ ОТКРЫТИЯ ЧАТА ---
    function openChat(type, data) {
        currentChatContext = type === 'clan' ? 'clan' : data.id;
        chatTitle.innerText = data.name;
        chatAvatar.src = data.avatar;
        
        chatMessages.innerHTML = ''; 
        if (type === 'clan') {
            addMessageToChat('Вы вошли в чат клана. (AI-модератор на связи)', 'ai');
        } else {
            addMessageToChat(`Начат чат с ${data.name}. (AI имитирует вашего друга)`, 'ai');
        }
        
        chatModal.style.display = 'flex';
    }

    // --- 4. ЛОГИКА ОТПРАВКИ И ВЫЗОВА API ---

    sendChatBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    async function handleSendMessage() {
        const messageText = chatInput.value;
        if (messageText.trim() === '') return;

        addMessageToChat(messageText, 'user');
        chatInput.value = '';

        // Вызываем реальный API
        await getGeminiResponse(messageText);
    }

    function addMessageToChat(text, senderType, elementId = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${senderType}`; 
        if (elementId) {
            messageDiv.id = elementId;
        }
        messageDiv.innerText = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- 5. НОВАЯ ФУНКЦИЯ GEMINI API ---

    async function getGeminiResponse(userText) {
        // Добавляем индикатор "печатает..."
        const typingId = 'typing-' + Date.now();
        addMessageToChat('...', 'ai typing', typingId);
        
        let systemPrompt = '';

        // Определяем "личность" ИИ
        if (currentChatContext === 'clan') {
            systemPrompt = "Ты - AI-модератор игрового клана. Твоя задача - отвечать на вопросы игроков, поддерживать порядок и говорить в слегка роботизированном, но дружелюбном стиле. Говори кратко (1-2 предложения).";
        } else {
            systemPrompt = "Ты имитиешь друга пользователя в мобильной игре. Твоя задача - отвечать очень неформально, кратко (одно предложение), использовать игровой сленг (например: 'го в бой', 'нужна помощь?', 'круто', 'гг вп'). Не говори, что ты ИИ.";
        }

        const apiKey = "YOUR_GEMINI_API_KEY_HERE"; // Используйте ваш реальный API ключ
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        const payload = {
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [
                {
                    role: "user",
                    parts: [{ text: userText }]
                }
            ]
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            const typingIndicator = document.getElementById(typingId);

            if (result.candidates && result.candidates.length > 0) {
                const aiText = result.candidates[0].content.parts[0].text;
                if (typingIndicator) {
                    typingIndicator.innerText = aiText;
                    typingIndicator.classList.remove('typing'); 
                    typingIndicator.id = ''; 
                } else {
                    addMessageToChat(aiText, 'ai');
                }
            } else {
                if (typingIndicator) {
                    typingIndicator.innerText = "(Ошибка API: нет кандидата в ответе)";
                    typingIndicator.classList.remove('typing');
                }
            }

        } catch (error) {
            console.error('Error calling Gemini API:', error);
            const typingIndicator = document.getElementById(typingId);
            if (typingIndicator) {
                typingIndicator.innerText = `(Ошибка API: ${error.message})`;
                typingIndicator.classList.remove('typing');
            }
        }
    }
});