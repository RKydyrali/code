// ==============================================
// 1. СИСТЕМА ПАМЯТИ ИГРОКА И СОСТОЯНИЯ ЗАДАНИЙ
// ==============================================

document.addEventListener('DOMContentLoaded', () => {

    // --- АВТОРИЗАЦИЯ И ЛИМИТЫ ---
    const API_KEY = "AIzaSyB6IWh-ipTLv-PrE8kk3RZ1L_VeH5u3KCo";
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`; 
    
    const QUESTIONS_PER_BATCH = 3; 
    const MAX_TASKS_IN_SESSION = 10; 

    const PlayerState = {
        level: "A1", trophies: 5000, coins: 1240, 
        mistakeMemory: ["Present Simple Tense conjugation", "Use of 'a' and 'an' articles", "'am', 'is', 'are'"],
        topics: ["Daily routine", "Family and friends", "Describing hobbies", "Ordering food"]
    };

    let currentTasks = [];
    let currentTaskIndex = 0;
    let userAnswers = [];
    let totalCorrectAnswers = 0; 
    let coinsEarnedSession = 0; 
    const COINS_PER_CORRECT_ANSWER = 5;

    // ==============================================
    // 2. УПРАВЛЕНИЕ ЭЛЕМЕНТАМИ И UI
    // ==============================================
    const aiTaskModal = document.getElementById('aiTaskModal');
    const closeAiTaskModalBtn = document.getElementById('closeAiTaskModal');
    const aiTaskLoader = document.getElementById('aiTaskLoader');
    const taskBox = document.getElementById('task-box'); 
    const aiTaskQuestionArea = document.getElementById('ai-task-question-area');
    const aiTaskOptionsArea = document.getElementById('ai-task-options-area');

    const nextTaskBtn = document.getElementById('nextTaskBtn');
    const prevTaskBtn = document.getElementById('prevTaskBtn');
    const submitAnswerBtn = document.getElementById('submitAnswerBtn');
    const showResultsBtn = document.getElementById('showResultsBtn'); 
    const skipVocabBtn = document.getElementById('skipVocabBtn');
    const forceEndTestBtn = document.getElementById('forceEndTestBtn'); 

    const finalResultsModal = document.getElementById('finalResultsModal');
    const closeResultsModalBtn = document.getElementById('closeResultsModal');
    const closeResultsAndContinueBtn = document.getElementById('closeResultsAndContinueBtn');
    const finalScoreValue = document.getElementById('finalScoreValue');
    const coinsEarnedValue = document.getElementById('coinsEarnedValue');
    const resultsSummary = document.getElementById('resultsSummary');

    const coinsDisplay = document.querySelector('.currency-item:nth-child(2) .currency-value'); 
    const coinAnimation = document.getElementById('coinAnimation');
    const aiLevelInfo = document.querySelector('.ai-level-info');
    const aiTaskModalTitle = document.getElementById('aiTaskModalTitle');

    let currentTaskType = '';
    const taskButtons = document.querySelectorAll('.task-item'); 

    taskButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            currentTaskType = button.getAttribute('data-task-type') || 'General';
            openAiTaskModal();
        });
    });

    closeAiTaskModalBtn.addEventListener('click', closeAiTaskModal);
    prevTaskBtn.addEventListener('click', () => navigateTasks(-1));
    nextTaskBtn.addEventListener('click', () => navigateTasks(1));
    skipVocabBtn.addEventListener('click', () => navigateTasks(1)); 
    submitAnswerBtn.addEventListener('click', checkCurrentAnswer);
    forceEndTestBtn.addEventListener('click', showFinalResults); 

    closeResultsModalBtn.addEventListener('click', closeFinalResultsModal);
    closeResultsAndContinueBtn.addEventListener('click', closeFinalResultsModal);

    if (coinsDisplay) coinsDisplay.textContent = PlayerState.coins;
    if (aiLevelInfo) aiLevelInfo.textContent = `Текущий уровень: ${PlayerState.level}`;

    function openAiTaskModal() {
        aiTaskModal.style.display = 'flex';
        resetTaskState();
        generateTasks(currentTaskType); 
    }

    function closeAiTaskModal() {
        aiTaskModal.style.display = 'none';
        resetTaskState(false); 
    }

    function closeFinalResultsModal() {
        finalResultsModal.style.display = 'none';
        closeAiTaskModal();
    }


    function resetTaskState(fullReset = true) {
        currentTasks = [];
        currentTaskIndex = 0;
        userAnswers = [];
        
        if (fullReset) {
            totalCorrectAnswers = 0; 
            coinsEarnedSession = 0;
        }

        aiTaskQuestionArea.innerHTML = '';
        aiTaskOptionsArea.innerHTML = '';
        taskBox.classList.add('hidden');
        aiTaskLoader.style.display = 'block';
        updateNavigationButtons();
    }

    // ==============================================
    // 3. ЛОГИКА НАВИГАЦИИ, ПРОВЕРКИ И МОНЕТ
    // ==============================================

    function navigateTasks(direction) {
        
        if (currentTasks.length >= MAX_TASKS_IN_SESSION) {
             showFinalResults();
             return;
        }

        if (direction === 1 && currentTaskIndex === currentTasks.length - 1) {
            if (currentTasks.length >= MAX_TASKS_IN_SESSION) {
                showFinalResults();
                return;
            }
            
            currentTaskIndex = 0; 
            generateTasks(currentTaskType);
            return;
        }
        
        const newIndex = currentTaskIndex + direction;

        if (newIndex >= 0 && newIndex < currentTasks.length) {
            currentTaskIndex = newIndex;
            displayTask(currentTaskIndex); 
        } else if (newIndex >= currentTasks.length) {
            showFinalResults();
        }
    }

    function saveCurrentAnswer(answer) { 
        const task = currentTasks[currentTaskIndex];
        let currentAnswer = answer;
        
        if (!currentAnswer) {
            const inputField = aiTaskOptionsArea.querySelector('.answer-input');
            if (inputField) currentAnswer = inputField.value.trim();
            
            const selectedBtn = aiTaskOptionsArea.querySelector('.option-btn.selected');
            if (selectedBtn) currentAnswer = selectedBtn.textContent;
        }
        
        userAnswers[currentTaskIndex] = { 
            ...userAnswers[currentTaskIndex],
            answer: currentAnswer,
            isCorrect: userAnswers[currentTaskIndex]?.isCorrect || null, 
            instruction: task.instruction,
            correctAnswer: task.correct_answer
        };
    }

    function checkCurrentAnswer() {
        const currentSlide = aiTaskOptionsArea;
        const task = currentTasks[currentTaskIndex];
        
        let userAnswer = null;
        if (task.task_type === 'Multiple Choice' || currentTaskType === 'Vocabulary') {
            const selectedBtn = currentSlide.querySelector('.option-btn.selected');
            if (selectedBtn) userAnswer = selectedBtn.textContent;
        } else {
            const inputField = currentSlide.querySelector('.answer-input');
            if (inputField) userAnswer = inputField.value.trim();
        }
        
        if (!userAnswer) {
            alert("Выберите или введите ответ!");
            return;
        }

        saveCurrentAnswer(userAnswer);
        const isCorrect = isAnswerCorrect(task.correct_answer, userAnswer);
        
        const options = currentSlide.querySelectorAll('.option-btn');
        const input = currentSlide.querySelector('.answer-input');
        
        if (isCorrect && !userAnswers[currentTaskIndex]?.isCorrect) {
            userAnswers[currentTaskIndex].isCorrect = true;
            totalCorrectAnswers++; 
            coinsEarnedSession += COINS_PER_CORRECT_ANSWER;
            awardCoins();
        } else if (!userAnswers[currentTaskIndex]?.isCorrect) {
             userAnswers[currentTaskIndex].isCorrect = isCorrect; 
        }

        options.forEach(btn => btn.disabled = true);
        if (input) input.disabled = true;
        submitAnswerBtn.disabled = true;

        if (task.task_type === 'Multiple Choice' || task.task_type === 'Quiz' || currentTaskType === 'Vocabulary') {
            options.forEach(btn => {
                if (isAnswerCorrect(task.correct_answer, btn.textContent)) {
                    btn.classList.add('correct');
                } else if (btn.classList.contains('selected')) {
                    btn.classList.add('incorrect');
                }
            });
        }
        
        if (currentTaskType === 'Vocabulary' && !isCorrect) {
             options.forEach(btn => btn.disabled = false);
             submitAnswerBtn.disabled = false;
             userAnswers[currentTaskIndex].isCorrect = null; 
        }

        updateNavigationButtons();
    }

    function awardCoins() {
        PlayerState.coins += COINS_PER_CORRECT_ANSWER;
        if (coinsDisplay) coinsDisplay.textContent = PlayerState.coins;
        
        coinAnimation.classList.remove('hidden');
        coinAnimation.style.opacity = 1;
        coinAnimation.style.transform = 'translateY(0) scale(1)';
        
        coinAnimation.style.animation = 'none';
        coinAnimation.offsetHeight; 
        coinAnimation.style.animation = 'coinFly 1s ease-out forwards';
        
        setTimeout(() => {
            coinAnimation.classList.add('hidden');
        }, 1000);
    }

    function isAnswerCorrect(correct, user) {
        if (!user) return false;
        const cleanCorrect = String(correct).toLowerCase().trim().replace(/[.?,!]/g, '');
        const cleanUser = String(user).toLowerCase().trim().replace(/[.?,!]/g, '');
        const possibleCorrect = cleanCorrect.split(/[,/]/).map(s => s.trim());
        
        return possibleCorrect.includes(cleanUser);
    }

    function updateNavigationButtons() {
        const taskAnswered = userAnswers[currentTaskIndex]?.isCorrect !== null && userAnswers[currentTaskIndex]?.isCorrect !== undefined;
        const isLimitReached = currentTasks.length >= MAX_TASKS_IN_SESSION;

        prevTaskBtn.classList.toggle('hidden', currentTaskIndex === 0);
        
        if (currentTaskType === 'Vocabulary') {
            skipVocabBtn.classList.toggle('hidden', taskAnswered || isLimitReached);
            submitAnswerBtn.classList.toggle('hidden', taskAnswered || isLimitReached);
        } else {
             skipVocabBtn.classList.add('hidden');
             submitAnswerBtn.classList.toggle('hidden', taskAnswered || isLimitReached);
        }

        nextTaskBtn.classList.toggle('hidden', !taskAnswered || isLimitReached);
        
        if (showResultsBtn) { showResultsBtn.classList.add('hidden'); }
        
        // Кнопка "Закончить" (работает, если не достигнут лимит)
        forceEndTestBtn.classList.remove('hidden');
        if (isLimitReached) {
            forceEndTestBtn.classList.add('hidden');
        }
    }

    function showFinalResults() {
        finalScoreValue.textContent = totalCorrectAnswers;
        coinsEarnedValue.textContent = coinsEarnedSession;
        resultsSummary.innerHTML = '';
        
        userAnswers.forEach((answer, index) => {
            if (!answer || answer.isCorrect === null) return;

            const isCorrect = answer.isCorrect;
            const itemClass = isCorrect ? 'correct' : 'incorrect';
            const status = isCorrect ? 'Верно' : 'Ошибка';
            
            let details = '';
            if (!isCorrect) {
                 details = `<br>Ваш ответ: ${answer.answer || '—'}. Правильный: ${answer.correctAnswer}`;
            }

            resultsSummary.innerHTML += `
                <div class="result-item ${itemClass}">
                    Задание ${index + 1}: ${status}. ${details}
                </div>
            `;
        });
        
        finalResultsModal.style.display = 'flex';
    }

    // ==============================================
    // 5. ГЕНЕРАЦИЯ ЗАДАНИЙ (РЕАЛЬНЫЙ AI)
    // ==============================================

    async function generateTasks(taskType) {
        resetTaskState(false); 
        aiTaskLoader.innerHTML = 'Генерация заданий AI... (Подождите 1-5 сек.)';
        aiTaskLoader.style.display = 'block';
        
        aiTaskModalTitle.textContent = `🧠 AI Task: ${taskType}`;
        if (aiLevelInfo) aiLevelInfo.textContent = `Текущий уровень: ${PlayerState.level}`;

        let taskFormatInstruction = '';
        let systemPromptType = '';

        if (taskType === 'Vocabulary') {
            taskFormatInstruction = `The instruction must present one English word, and 'options' must be 4 distinct translation choices (one correct) in Russian.`;
            systemPromptType = 'Multiple Choice';
        } else if (taskType === 'Grammar' || taskType === 'Daily Mistakes' || taskType === 'Battle Mistakes') {
            taskFormatInstruction = `Focus ONLY on applying the grammar rules related to the player's mistakes.`;
            systemPromptType = 'Correction, Fill in the Blank';
        } else {
             taskFormatInstruction = `Generate **Fill in the Blank** tasks only. The content must be general knowledge for A1 level.`;
             systemPromptType = 'Fill in the Blank';
        }

        const prompt = `
            You are a personalized English language tutor AI. Your responses must be concise and targeted for an A1 level.
            Generate ${QUESTIONS_PER_BATCH} tasks.
            
            **STRICT CONSTRAINT:** The content of the instruction/question part of each task must be strictly limited to **5-6 words**.
            
            The overall task focus is: **${taskType}**. ${taskFormatInstruction}
            The tasks must be tailored specifically to the player's recorded **mistakes**: ${PlayerState.mistakeMemory.join(", ")}.
            The tasks should be related to: ${PlayerState.topics.join(", ")}.
            
            The tasks MUST use one of these types: ${systemPromptType}.
            
            Format your response as a JSON array of objects: 
            [
                { "id": 1, "task_type": "Multiple Choice", "instruction": "...", "options": ["...", "...", "...", "..."], "correct_answer": "..."},
                { "id": 2, "task_type": "Correction", "instruction": "...", "correct_answer": "..."},
                { "id": 3, "task_type": "Fill in the Blank", "instruction": "...", "correct_answer": "..."}
            ]
            The response MUST ONLY contain the JSON array.
        `;

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            const rawText = data.candidates[0].content.parts[0].text;
            const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            
            const tasks = JSON.parse(cleanJsonText);
            
            const newTasks = tasks.slice(0, MAX_TASKS_IN_SESSION - currentTasks.length);

            currentTasks = [...currentTasks, ...newTasks];
            
            const newAnswersCount = currentTasks.length - userAnswers.length;
            if (newAnswersCount > 0) {
                 const newEmptyAnswers = new Array(newAnswersCount).fill(null).map(() => ({answer: null, isCorrect: null}));
                 userAnswers = [...userAnswers, ...newEmptyAnswers];
            }
            
            aiTaskLoader.style.display = 'none';
            taskBox.classList.remove('hidden');
            displayTask(currentTaskIndex); 

        } catch (error) {
            aiTaskLoader.style.display = 'none';
            taskBox.classList.remove('hidden');
            aiTaskQuestionArea.innerHTML = `<p style="color: red;">Ошибка генерации заданий: ${error.message}. Проверьте ключ API и запустите с веб-сервера (ошибка CORS).</p>`;
            console.error(error);
        }
    }
    
    // ==============================================
    // 6. ОТОБРАЖЕНИЕ ОДНОГО СТАТИЧНОГО ЗАДАНИЯ
    // ==============================================

    function displayTask(taskIndex) {
        const task = currentTasks[taskIndex];
        const answered = userAnswers[taskIndex]?.answer !== null;
        const isCorrect = userAnswers[taskIndex]?.isCorrect;
        
        aiTaskQuestionArea.innerHTML = '';
        aiTaskOptionsArea.innerHTML = '';
        
        aiTaskQuestionArea.innerHTML = `
            <h4>Задание ${currentTaskIndex + 1}/${currentTasks.length}: ${task.task_type}</h4>
            <p class="task-instruction">
                <span class="instruction-label">Инструкция:</span>
                ${task.instruction}
            </p>
        `;

        let interactiveHTML = '';
        if (task.task_type === 'Multiple Choice') {
            const optionsHTML = task.options.map(option => {
                let classes = 'option-btn';
                if (answered) {
                    if (isAnswerCorrect(task.correct_answer, option)) classes += ' correct';
                    else if (userAnswers[taskIndex].answer === option && !isCorrect) classes += ' incorrect';
                } else if (userAnswers[taskIndex]?.answer === option) {
                     classes += ' selected';
                }
                return `<button class="${classes}" ${answered ? 'disabled' : ''}>${option}</button>`;
            }).join('');
            interactiveHTML = `<div class="options-container">${optionsHTML}</div>`;
        } else {
            let placeholder = task.task_type === 'Correction' ? 'Введите исправленное предложение...' : 'Введите пропущенное слово/фразу...';
            interactiveHTML = `
                <textarea class="answer-input" placeholder="${placeholder}" ${answered ? 'disabled' : ''}>${userAnswers[taskIndex]?.answer || ''}</textarea>
            `;
        }
        aiTaskOptionsArea.innerHTML = interactiveHTML;
        
        // Установка слушателей
        if (task.task_type === 'Multiple Choice') {
            aiTaskOptionsArea.querySelectorAll('.option-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    aiTaskOptionsArea.querySelectorAll('.option-btn').forEach(ob => ob.classList.remove('selected'));
                    btn.classList.add('selected');
                    saveCurrentAnswer(btn.textContent);
                    
                    if (currentTaskType === 'Vocabulary') {
                         checkCurrentAnswer(); 
                    }
                });
            });
        }
        
        // *****************************************
        // ИСПРАВЛЕНИЕ БАГА "ПРОВЕРИТЬ" (Для Input-заданий): 
        // Если задание НЕ было отвечено, мы должны убедиться, что кнопка "Проверить" активна.
        // *****************************************
        if (!answered) {
            submitAnswerBtn.disabled = false;
        } else {
             // Если отвечено, блокируем кнопку, пока не перейдем дальше
             submitAnswerBtn.disabled = true; 
        }

        updateNavigationButtons();
    }
    
});