document.addEventListener('DOMContentLoaded', () => {

    // --- Элементы Управления ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const toggleButtons = document.querySelectorAll('.toggle-button');
    const listContainer = document.getElementById('leaderboard-list-container');
    const currentPlayerContainer = document.getElementById('current-player-display');

    // --- Текущее Состояние ---
    let currentTab = 'school'; // school, regional, international
    let currentType = 'trophies'; // trophies, streak

    // --- 1. ИМИТАЦИЯ ДАННЫХ (MOCK DATA) ---
    // В реальном приложении вы бы получали это с сервера (Supabase)
    const mockData = {
        school: {
            trophies: [
                { rank: 1, name: 'Sasha_Top', avatar: 'avatar.png', value: 5200 },
                { rank: 2, name: 'Masha_Gamer', avatar: 'avatar.png', value: 5150 },
                { rank: 3, name: 'Petya_Pro', avatar: 'avatar.png', value: 5140 },
                // ...
                { rank: 42, name: 'Player Nickname', avatar: 'avatar.png', value: 4100 } // Текущий игрок
            ],
            streak: [
                { rank: 1, name: 'Masha_Gamer', avatar: 'avatar.png', value: 120 },
                { rank: 2, name: 'Sasha_Top', avatar: 'avatar.png', value: 115 },
                { rank: 3, name: 'Petya_Pro', avatar: 'avatar.png', value: 90 },
                // ...
                { rank: 15, name: 'Player Nickname', avatar: 'avatar.png', value: 50 } // Текущий игрок
            ]
        },
        regional: {
            trophies: [
                { rank: 1, name: 'Region_King', avatar: 'avatar.png', value: 8200 },
                { rank: 2, name: 'Best_Player_77', avatar: 'avatar.png', value: 8100 },
                // ...
                { rank: 142, name: 'Player Nickname', avatar: 'avatar.png', value: 4100 }
            ],
            streak: [
                { rank: 1, name: 'Best_Player_77', avatar: 'avatar.png', value: 300 },
                { rank: 2, name: 'Region_King', avatar: 'avatar.png', value: 250 },
                // ...
                { rank: 99, name: 'Player Nickname', avatar: 'avatar.png', value: 50 }
            ]
        },
        international: {
            trophies: [
                { rank: 1, name: 'World_Champ', avatar: 'avatar.png', value: 15000 },
                { rank: 2, name: 'Zeus', avatar: 'avatar.png', value: 14900 },
                // ...
                { rank: 5231, name: 'Player Nickname', avatar: 'avatar.png', value: 4100 }
            ],
            streak: [
                { rank: 1, name: 'Fire_Man', avatar: 'avatar.png', value: 500 },
                { rank: 2, name: 'World_Champ', avatar: 'avatar.png', value: 480 },
                // ...
                { rank: 1200, name: 'Player Nickname', avatar: 'avatar.png', value: 50 }
            ]
        }
    };
    
    // --- 2. ОБРАБОТЧИКИ КЛИКОВ ---

    // Клик по Вкладкам (Школа, Регион, Мир)
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Снимаем .active со всех
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем .active нажатой кнопке
            button.classList.add('active');
            // Обновляем состояние
            currentTab = button.dataset.tab;
            // Перерисовываем список
            renderLeaderboard();
        });
    });

    // Клик по Переключателям (Кубки, Стрик)
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentType = button.dataset.type;
            renderLeaderboard();
        });
    });

    // --- 3. ФУНКЦИЯ РЕНДЕРИНГА (Отрисовки) ---

    function renderLeaderboard() {
        // Очищаем старый список
        listContainer.innerHTML = '';
        currentPlayerContainer.innerHTML = '';

        // Получаем нужный массив данных из "базы"
        const data = mockData[currentTab][currentType];
        
        let currentPlayerRow = null;

        // Создаем HTML для каждого игрока
        data.forEach(player => {
            const isCurrentUser = (player.name === 'Player Nickname');
            const rowHTML = createPlayerRow(player, isCurrentUser);

            if (isCurrentUser) {
                // Если это текущий игрок, сохраняем его для нижней панели
                currentPlayerRow = rowHTML;
            } else {
                // Всех остальных добавляем в прокручиваемый список
                listContainer.innerHTML += rowHTML;
            }
        });

        // Добавляем строку текущего игрока в нижний "приклеенный" блок
        if (currentPlayerRow) {
            currentPlayerContainer.innerHTML = currentPlayerRow;
        }
    }

    // Вспомогательная функция для создания HTML одной строки
    function createPlayerRow(player, isCurrentUser = false) {
        const valueClass = currentType === 'streak' ? 'value streak' : 'value';
        const rowClass = isCurrentUser ? 'leaderboard-item current-player' : 'leaderboard-item';

        return `
            <div class="${rowClass}">
                <span class="rank">${player.rank}</span>
                <div class="player-info">
                    <img src="${player.avatar}" alt="Avatar" class="avatar">
                    <span class="name">${player.name}</span>
                </div>
                <span class="${valueClass}">${player.value}</span>
            </div>
        `;
    }

    // --- 4. ПЕРВЫЙ ЗАПУСК ---
    // Отрисовываем список при загрузке страницы (по умолчанию 'school', 'trophies')
    renderLeaderboard();

});