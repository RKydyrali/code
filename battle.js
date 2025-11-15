// battle.js

document.addEventListener('DOMContentLoaded', () => {

    // === НАСТРОЙКИ ИГРЫ ===
    let playerMana = 5;
    const MAX_MANA = 10;
    const MANA_REGEN_RATE_MS = 1000; // 1 мана в секунду
    
    // ИЗМЕНЕНО: Добавляем HP
    let playerHealth = 3;
    let opponentHealth = 3;
    let gameInProgress = true;

    // === ЭЛЕМЕНТЫ UI ===
    const manaBarFill = document.getElementById('mana-bar-fill');
    const manaText = document.getElementById('mana-text');
    const playerHand = document.getElementById('player-hand');
    const playField = document.getElementById('play-field');
    const opponentNotification = document.getElementById('opponent-notification');
    
    // (Элементы HP)
    const playerHealthIcons = document.querySelectorAll('.profile-panel .health-bar .health-icon');
    const opponentHealthIcons = document.querySelectorAll('.opponent-area .health-bar .health-icon');
    
    // Элементы модального окна (Вопрос)
    const playerQuestionModal = document.getElementById('playerQuestionModal');
    const playerTaskLoader = document.getElementById('playerTaskLoader');
    const playerTaskBox = document.getElementById('player-task-box');
    const playerTaskQuestionArea = document.getElementById('player-task-question-area');
    const playerTaskOptionsArea = document.getElementById('player-task-options-area');
    const playerSubmitAnswerBtn = document.getElementById('playerSubmitAnswerBtn');
    
    // Элементы модального окна (Game Over)
    const gameOverModal = document.getElementById('gameOverModal');
    const gameOverContent = gameOverModal.querySelector('.modal-content-new');
    const gameOverTitle = document.getElementById('gameOverTitle');
    const trophyChange = document.getElementById('trophyChange');
    const coinChange = document.getElementById('coinChange');
    
    let draggedCard = null; // Карта, которую тащим
    let currentPlayedCardType = 'General'; // Тип сыгранной карты
    let currentAIQuestion = null; // Текущий сгенерированный вопрос
    let activeDeck = []; // Наша активная колода

    // === 1. ИНИЦИАЛИЗАЦИЯ ===
    
    function initializeGame() {
        // (Симуляция) Загружаем "Активную колоду" игрока
        activeDeck = [
            { id: "g1", src: "A1grammar.png", mana: 4, type: "Grammar", desc: "Задание на Present Simple." },
            { id: "v1", src: "A1verbs1.png", mana: 3, type: "Vocabulary", desc: "Задание на Action Verbs." },
            { id: "a1", src: "A1adjectives.png", mana: 2, type: "Vocabulary", desc: "Задание на прилагательные." },
            { id: "n1", src: "A1nouns.png", mana: 1, type: "Vocabulary", desc: "Задание на существительные." },
            { id: "n2", src: "A1nouns2.png", mana: 2, type: "Vocabulary", desc: "Исчисляемые/Неисчисляемые." },
            { id: "v2", src: "A1verbs2.png", mana: 2, type: "Vocabulary", desc: "State Verbs (to be, have)." }
        ];
        
        activeDeck.sort(() => 0.5 - Math.random());
        drawInitialHand();
        setInterval(generateMana, MANA_REGEN_RATE_MS);
        updateManaBar();
        playerSubmitAnswerBtn.addEventListener('click', checkPlayerAnswer);
    }

    // === 2. ЛОГИКА МАНЫ ===
    
    function generateMana() {
        if (!gameInProgress) return;
        if (playerMana < MAX_MANA) {
            playerMana++;
            updateManaBar();
        }
    }
    
    function updateManaBar() {
        const percentage = (playerMana / MAX_MANA) * 100;
        manaBarFill.style.width = `${percentage}%`;
        manaText.textContent = `${playerMana} / ${MAX_MANA}`;
    }

    // === 3. ЛОГИКА ПЕРЕТАСКИВАНИЯ (ИГРА КАРТЫ) ===

    function addDragListenersToHand() {
        const cards = playerHand.querySelectorAll('.card-in-hand');
        cards.forEach(card => {
            
            card.addEventListener('dragstart', (e) => {
                if (!gameInProgress) {
                    e.preventDefault();
                    return;
                }
                
                const manaCost = parseInt(card.dataset.mana, 10);
                if (playerMana < manaCost) {
                    showNotification("Ошибка", `Недостаточно маны! (Нужно: ${manaCost})`, "error");
                    e.preventDefault(); 
                    return;
                }
                
                draggedCard = card;
                currentPlayedCardType = card.dataset.cardType || 'General';
                setTimeout(() => card.classList.add('dragging'), 0);
            });
            
            card.addEventListener('dragend', () => {
                if(draggedCard) {
                    draggedCard.classList.remove('dragging');
                }
                draggedCard = null;
            });
        });
    }

    // Слушатели для Игрового Поля (Куда бросаем)
    playField.addEventListener('dragover', (e) => {
        if (!gameInProgress) return;
        e.preventDefault(); 
        playField.classList.add('drag-over');
    });

    playField.addEventListener('dragleave', () => {
        playField.classList.remove('drag-over');
    });

    playField.addEventListener('drop', (e) => {
        e.preventDefault();
        playField.classList.remove('drag-over');

        if (!draggedCard || !gameInProgress) return;

        const manaCost = parseInt(draggedCard.dataset.mana, 10);

        if (playerMana >= manaCost) {
            playerMana -= manaCost;
            updateManaBar();
            
            const cardContainer = draggedCard.closest('.card-container');
            const cardId = draggedCard.id;
            cardContainer.remove();
            
            // ИСПРАВЛЕНО: Отправляем вопрос оппоненту, НО НЕ НАНОСИМ УРОН
            sendQuestionToOpponent(currentPlayedCardType);
            
            getPlayerQuestion(currentPlayedCardType);
            
            setTimeout(() => {
                drawNewCard(cardId); 
            }, 1000);
            
        } else {
             showNotification("Ошибка", `Недостаточно маны! (Нужно: ${manaCost})`, "error");
        }
        
        draggedCard.classList.remove('dragging');
        draggedCard = null;
    });
    
    function drawInitialHand() {
        playerHand.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const cardData = activeDeck.shift(); 
            if (cardData) {
                playerHand.appendChild(createCardElement(cardData));
                activeDeck.push(cardData); 
            }
        }
        addDragListenersToHand();
    }
    
    function drawNewCard(playedCardId) {
        const handIDs = Array.from(playerHand.querySelectorAll('.card-in-hand')).map(c => c.id);
        
        let newCardData = null;
        for (const card of activeDeck) {
            if (!handIDs.includes(card.id) && card.id !== playedCardId) {
                newCardData = card;
                break;
            }
        }
        
        if (newCardData) {
            playerHand.appendChild(createCardElement(newCardData));
            addDragListenersToHand();
        }
    }
    
    function createCardElement(cardData) {
        const container = document.createElement('div');
        container.classList.add('card-container');
        
        container.innerHTML = `
            <img src="${cardData.src}" alt="Card" class="card-in-hand" draggable="true" 
                 data-mana="${cardData.mana}" 
                 data-card-type="${cardData.type}"
                 id="${cardData.id}">
            <div class="card-tooltip">
                <span class="tooltip-mana">💧 ${cardData.mana} Маны</span>
                <p>${cardData.desc}</p>
            </div>
        `;
        return container;
    }
    
    // ИСПРАВЛЕНО: Убрана симуляция потери HP оппонента
    function sendQuestionToOpponent(cardType) {
        console.log(`(Симуляция) Отправляем оппоненту вопрос типа: ${cardType}`);
        opponentNotification.classList.remove('hidden');
        
        setTimeout(() => {
            opponentNotification.classList.add('hidden');
        }, 2000);
    }

    // ==============================================
    // 5. ЛОГИКА HP (ЖИЗНЕЙ)
    // ==============================================
    
    function takeDamage(isPlayer) {
        if (!gameInProgress) return;

        let healthBarIcons;
        if (isPlayer) {
            playerHealth--;
            healthBarIcons = playerHealthIcons;
        } else {
            opponentHealth--;
            healthBarIcons = opponentHealthIcons;
        }

        // Обновляем UI (скрываем последнее сердце)
        for (let i = healthBarIcons.length - 1; i >= 0; i--) {
            if (!healthBarIcons[i].classList.contains('hidden')) {
                healthBarIcons[i].classList.add('hidden');
                break;
            }
        }

        // Проверка на конец игры
        if (playerHealth <= 0) {
            gameOver(false); // Ты проиграл
        } else if (opponentHealth <= 0) {
            gameOver(true); // Ты победил
        }
    }
    
    // ИСПРАВЛЕНО: Показываем модальное окно Game Over
    function gameOver(didPlayerWin) {
        gameInProgress = false;
        playerQuestionModal.style.display = 'none'; // Скрываем окно вопроса, если оно было
        
        if (didPlayerWin) {
            gameOverTitle.textContent = "Победа!";
            gameOverContent.classList.remove('loss');
            trophyChange.textContent = "+30";
            trophyChange.className = "stat-gain";
            coinChange.textContent = "+100";
            coinChange.className = "stat-gain";
        } else {
            // Как ты и просил
            gameOverTitle.textContent = "Поражение!";
            gameOverContent.classList.add('loss');
            trophyChange.textContent = "-25";
            trophyChange.className = "stat-loss";
            coinChange.textContent = "+50"; // (Заработанные монеты)
            coinChange.className = "stat-gain";
        }
        
        gameOverModal.style.display = 'flex';
    }


    // ==============================================
    // 6. ЛОГИКА AI (ГЕНЕРАЦИЯ ВОПРОСА ДЛЯ ИГРОКА)
    // ==============================================
    
    const MOCK_QUESTION_BANK = [
        { 
            task_type: "Multiple Choice", 
            instruction: `(Vocabulary) What is the English word for 'сестра'?`, 
            options: ["brother", "aunt", "sister", "cousin"], 
            correct_answer: "sister"
        },
        { 
            task_type: "Correction", 
            instruction: `(Grammar: Mistake 'to be') Correct the mistake: They is happy.`, 
            correct_answer: "They are happy"
        },
        { 
            task_type: "Fill in the Blank", 
            instruction: `(Topic: Daily routine) Complete the sentence: I ___ (get up) at 7 AM.`, 
            correct_answer: "get up"
        },
        {
             task_type: "Drag-and-Drop (Input)",
             instruction: `(Topic: Food) Составьте предложение (введите слова через пробел): is, ordering, He, pizza, a.`,
             correct_answer: "I am ordering a pizza"
        }
    ];

    function getMockQuestion(type) {
        let desiredTypes = [];
        if (type === 'Vocabulary') {
            desiredTypes = ['Multiple Choice'];
        } else if (type === 'Grammar') {
            desiredTypes = ['Drag-and-Drop (Input)', 'Correction'];
        } else {
            desiredTypes = ['Multiple Choice', 'Correction', 'Fill in the Blank'];
        }

        const filteredTasks = MOCK_QUESTION_BANK.filter(task => desiredTypes.includes(task.task_type));
        const randomIndex = Math.floor(Math.random() * filteredTasks.length);
        return filteredTasks[randomIndex];
    }
    
    async function getPlayerQuestion(cardType) {
        if (!gameInProgress) return;
        
        playerQuestionModal.style.display = 'flex';
        playerTaskBox.classList.add('hidden');
        playerTaskLoader.style.display = 'block';

        const API_KEY = "AIzaSyB6IWh-ipTLv-PrE8kk3RZ1L_VeH5u3KCo";
        const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`; 

        try {
            // --- БЛОК СИМУЛЯЦИИ API (Используется сейчас) ---
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            currentAIQuestion = getMockQuestion(cardType);
            
            if (!currentAIQuestion) { // Если банк пуст
                throw new Error("Не удалось найти подходящий вопрос в банке.");
            }
            
        } catch (error) {
            console.error("AI Generation Error:", error);
            
            // ИСПРАВЛЕНИЕ: ГЕНЕРИРУЕМ ШАБЛОННЫЙ ВОПРОС
            currentAIQuestion = {
                task_type: "Шаблонный Вопрос", 
                instruction: `(Ошибка AI) Выберите правильный артикль: I see ... cat.`, 
                options: ["a", "an", "the", "—"], 
                correct_answer: "a"
            };
            
        } finally {
            // Отображаем задание (либо AI, либо шаблонное)
            displayPlayerTask(currentAIQuestion);
            playerTaskLoader.style.display = 'none';
            playerTaskBox.classList.remove('hidden');
        }
    }
    
    // Отображение вопроса в модальном окне
    function displayPlayerTask(task) {
        playerTaskQuestionArea.innerHTML = `
            <h4>${task.task_type}</h4>
            <p class="task-instruction">
                <span class="instruction-label">Инструкция:</span>
                ${task.instruction}
            </p>
        `;

        let interactiveHTML = '';
        // ИСПРАВЛЕНО: Кнопка "Ответить" теперь работает и для кнопок
        if (task.task_type === 'Multiple Choice' || task.task_type === 'Vocabulary Question') {
            const optionsHTML = task.options.map(option => 
                `<button class="option-btn">${option}</button>`
            ).join('');
            interactiveHTML = `<div class="options-container">${optionsHTML}</div>`;
        } else {
            let placeholder = 'Введите ваш ответ здесь...';
            if (task.task_type === 'Drag-and-Drop (Input)') {
                placeholder = 'Введите слова в правильном порядке...';
            }
            interactiveHTML = `<textarea class="answer-input" placeholder="${placeholder}"></textarea>`;
        }
        playerTaskOptionsArea.innerHTML = interactiveHTML;
        
        // Слушатели для кнопок
        playerTaskOptionsArea.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                playerTaskOptionsArea.querySelectorAll('.option-btn').forEach(ob => ob.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }

    // ИСПРАВЛЕНО: Проверка ответа игрока
    function checkPlayerAnswer() {
        if (!gameInProgress) return;
        
        const task = currentAIQuestion;
        let userAnswer = null;

        // ИСПРАВЛЕНО: Считываем ответ и для кнопок, и для текста
        if (task.task_type === 'Multiple Choice' || task.task_type === 'Vocabulary Question') {
            const selectedBtn = playerTaskOptionsArea.querySelector('.option-btn.selected');
            if (selectedBtn) {
                userAnswer = selectedBtn.textContent;
            }
        } else {
            const inputField = playerTaskOptionsArea.querySelector('.answer-input');
            if (inputField && inputField.value.trim() !== '') {
                userAnswer = inputField.value.trim();
            }
        }

        if (!userAnswer) {
            showNotification("Внимание", "Нужно дать ответ!", "info");
            return;
        }

        const isCorrect = isAnswerCorrect(task.correct_answer, userAnswer);

        if (isCorrect) {
            showNotification("Правильно!", "Вы получаете +100 очков (симуляция).", "success");
            // (Награда)
        } else {
            showNotification("Неправильно!", `Верный ответ: ${task.correct_answer}. Вы теряете 1 HP.`, "error");
            // ИЗМЕНЕНО: Отнимаем HP
            takeDamage(true); // true = урон игроку
        }
        
        playerQuestionModal.style.display = 'none';
        currentAIQuestion = null;
    }
    
    function isAnswerCorrect(correct, user) {
        if (!user) return false;
        const cleanCorrect = String(correct).toLowerCase().trim().replace(/[.?,!]/g, '');
        const cleanUser = String(user).toLowerCase().trim().replace(/[.?,!]/g, '');
        const possibleCorrect = cleanCorrect.split(/[,/]/).map(s => s.trim());
        
        return possibleCorrect.includes(cleanUser);
    }
    
    // ==============================================
    // 7. (НОВОЕ) МОДАЛЬНОЕ ОКНО УВЕДОМЛЕНИЙ
    // ==============================================
    const notificationModal = document.getElementById('notificationModal');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationCloseBtn = document.getElementById('notificationCloseBtn');
    const notificationContent = notificationModal.querySelector('.modal-content-new');

    function showNotification(title, message, type = 'info') {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        
        // Удаляем классы
        notificationContent.classList.remove('success', 'error');
        
        if (type === 'success') {
            notificationContent.classList.add('success');
        } else if (type === 'error') {
            notificationContent.classList.add('error');
        }
        
        notificationModal.style.display = 'flex';
    }

    function closeNotificationModal() {
        notificationModal.style.display = 'none';
    }

    notificationCloseBtn.addEventListener('click', closeNotificationModal);
    

    // Запуск игры
    initializeGame();
});