// mainpage.js (ТОЛЬКО ДЛЯ ГЛАВНОЙ СТРАНИЦЫ)

document.addEventListener('DOMContentLoaded', () => {
    
    // ЛОГИКА АВАТАРА (Если нужно)
    const avatar = document.querySelector('.profile-avatar');
    if (avatar) {
        let avatarUrl = 'avatar.png'; // Используем avatar.png по умолчанию
        
        if (!avatarUrl) {
            // Если URL нет, можно оставить фон по умолчанию из CSS
        } else {
            avatar.style.backgroundImage = `url(${avatarUrl})`;
        }
    }

    // УСЛОВНЫЕ ДАННЫЕ ИГРОКА И ТРЕБОВАНИЯ К АРЕНАМ
    let playerTrophies = 5000; // Примерное количество кубков
    
    const arenaRequirements = [
        { id: 6, trophies: 3000, name: 'Трон Совершенства', selector: '.arena-spot-6' },
        { id: 5, trophies: 2500, name: 'Башня Профессионализма', selector: '.arena-spot-5' },
        { id: 4, trophies: 2000, name: 'Зал Академических Споров', selector: '.arena-spot-4' },
        { id: 3, trophies: 1500, name: 'Перекресток Мнений', selector: '.arena-spot-3' },
        { id: 2, trophies: 1000, name: 'Гавань Городской Жизни', selector: '.arena-spot-2' },
        { id: 1, trophies: 0, name: 'Пески Основания', selector: '.arena-spot-1' },
    ];
    
    const allArenaSpots = document.querySelectorAll('.arena-spot');

    const updateArenaDisplay = () => {
        let activeArenaSelector = null;
        
        for (const arena of arenaRequirements) {
            if (playerTrophies >= arena.trophies) {
                activeArenaSelector = arena.selector;
                break; 
            }
        }
        
        allArenaSpots.forEach(spot => {
            // Скрываем все арены по умолчанию
            if (spot) spot.classList.add('hidden-arena'); 
            if (spot) spot.classList.remove('single-arena-active'); 
        });

        if (activeArenaSelector) {
            const activeSpot = document.querySelector(activeArenaSelector);
            if (activeSpot) {
                activeSpot.classList.remove('hidden-arena');
                activeSpot.classList.add('single-arena-active');
            }
        } else {
            // Если ни одна арена не подходит (например, 0 кубков), показываем первую
            const defaultSpot = document.querySelector('.arena-spot-1');
            if (defaultSpot) {
                defaultSpot.classList.remove('hidden-arena');
                defaultSpot.classList.add('single-arena-active');
            }
        }
    };
    
    // Запускаем функцию при загрузке страницы
    // (Проверяем, существуют ли элементы арены, прежде чем запускать)
    if (allArenaSpots.length > 0) {
        updateArenaDisplay();
    }

    /* ---------------------------------- */
    /* ЛОГИКА МОДАЛЬНЫХ ОКОН (Если нужна) */
    /* ---------------------------------- */
    const arenaModal = document.getElementById('arenaModal');
    const settingsModal = document.getElementById('settingsModal');
    
    const openArenaButtons = document.querySelectorAll('.open-modal');
    const openSettingsButton = document.querySelector('.open-settings-modal');
    const closeButtons = document.querySelectorAll('.close-modal-btn');
    
    const openModal = (modalElement) => { 
        if (modalElement) modalElement.style.display = 'flex'; 
        document.body.style.overflow = 'hidden'; 
    };
    const closeModal = (modalElement) => { 
        if (modalElement) modalElement.style.display = 'none'; 
        document.body.style.overflow = 'hidden'; 
    };

    // Вешаем слушатели только если элементы существуют
    if (openArenaButtons.length > 0 && arenaModal) {
        openArenaButtons.forEach(button => { 
            button.addEventListener('click', (e) => { 
                e.preventDefault(); 
                openModal(arenaModal); 
            }); 
        });
    }
    
    if (openSettingsButton && settingsModal) {
        openSettingsButton.addEventListener('click', () => { 
            openModal(settingsModal); 
        });
    }

    if (closeButtons.length > 0) {
        closeButtons.forEach(button => { 
            button.addEventListener('click', () => { 
                const parentModal = button.closest('.modal-overlay');
                if (parentModal) { closeModal(parentModal); }
            });
        });
    }

    // Закрытие по клику на фон
    window.addEventListener('click', (e) => {
        if (e.target === arenaModal) { closeModal(arenaModal); }
        if (e.target === settingsModal) { closeModal(settingsModal); }
    });
});