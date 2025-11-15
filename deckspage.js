// deckspage.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- ЭЛЕМЕНТЫ ---
    const cardContainers = document.querySelectorAll('.card-container');
    const slots = document.querySelectorAll('.deck-slot');
    const collectionArea = document.getElementById('collection-area');
    
    // Хранилище для данных о картах в слотах
    const slotData = {
        'slot-1': null,
        'slot-2': null,
        'slot-3': null,
        'slot-4': null
    };

    let draggedContainer = null; // Контейнер, который мы перетаскиваем
    let draggedFromSlot = null; // Слот, ИЗ которого мы тащим

    // --- ФУНКЦИЯ TOOLTIP ---
    // (Заполняет HTML тултипа. CSS отвечает за :hover)
    const updateTooltip = (cardContainer) => {
        const tooltip = cardContainer.querySelector('.card-tooltip');
        if (!tooltip) return;

        const cardImg = cardContainer.querySelector('img');
        const mana = cardContainer.dataset.mana;
        const description = cardContainer.dataset.description;

        if (cardImg.src.includes('placeholder.png')) {
            tooltip.innerHTML = ''; // Очистить, если это placeholder
        } else if (mana && description) {
            tooltip.innerHTML = `
                <span class="tooltip-mana">💧 ${mana} Маны</span>
                <p>${description}</p>
            `;
        }
    };
    
    // Инициализация ВСЕХ тултипов (в коллекции и в слотах)
    document.querySelectorAll('.card-container').forEach(updateTooltip);

    // --- ЛОГИКА DRAG & DROP ---

    // 1. НАЧАЛО ПЕРЕТАСКИВАНИЯ
    const dragStart = (e) => {
        // Тащим КОНТЕЙНЕР, а не картинку
        draggedContainer = e.currentTarget; 
        
        // Проверяем, тащим ли мы из слота колоды
        const slot = draggedContainer.closest('.deck-slot');
        if (slot) {
            draggedFromSlot = slot; // Запоминаем слот
        } else {
            draggedFromSlot = null; // Тащим из коллекции
        }

        setTimeout(() => {
            draggedContainer.classList.add('dragging');
        }, 0);
    };

    // 2. ЗАВЕРШЕНИЕ ПЕРЕТАСКИВАНИЯ
    const dragEnd = () => {
        if (draggedContainer) {
            draggedContainer.classList.remove('dragging');
        }
        draggedContainer = null;
        draggedFromSlot = null;
    };

    // 3. НАХОЖДЕНИЕ НАД ЗОНОЙ
    const dragOver = (e) => {
        e.preventDefault();
        const target = e.currentTarget;
        if (target.classList.contains('deck-slot') || target.classList.contains('collection-area')) {
            target.classList.add('drag-over');
        }
    };

    // 4. ПОКИДАНИЕ ЗОНЫ
    const dragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    // 5. БРОСОК
    const dragDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        if (!draggedContainer) return;

        const targetSlot = e.currentTarget.classList.contains('deck-slot') ? e.currentTarget : null;
        const targetCollection = e.currentTarget.classList.contains('collection-area');

        // --- ЛОГИКА ПЕРЕМЕЩЕНИЯ ---

        // A. Если тащим из КОЛЛЕКЦИИ в СЛОТ
        if (targetSlot && !draggedFromSlot) {
            handleDropFromCollection(targetSlot);
        }
        // B. Если тащим из СЛОТА обратно в КОЛЛЕКЦИЮ
        else if (targetCollection && draggedFromSlot) {
            handleDropFromSlotToCollection(draggedFromSlot);
        }
        // C. Если тащим из СЛОТА в ДРУГОЙ СЛОТ (Своп)
        else if (targetSlot && draggedFromSlot && targetSlot !== draggedFromSlot) {
            handleSwapSlots(draggedFromSlot, targetSlot);
        }
    };

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ DROP ---

    function handleDropFromCollection(targetSlot) {
        // Карта, которую тащим (из коллекции)
        const cardData = {
            id: draggedContainer.dataset.cardId,
            src: draggedContainer.querySelector('img').src,
            mana: draggedContainer.dataset.mana,
            description: draggedContainer.dataset.description
        };

        // 1. Если слот не пустой, возвращаем старую карту в коллекцию
        if (slotData[targetSlot.id]) {
            const oldCardData = slotData[targetSlot.id];
            const oldCollectionCard = document.querySelector(`.card-container[data-card-id="${oldCardData.id}"]`);
            if (oldCollectionCard) {
                oldCollectionCard.classList.remove('in-deck');
            }
        }
        
        // 2. Помещаем новую карту в слот
        setSlotData(targetSlot, cardData);
        
        // 3. Скрываем карту в коллекции
        draggedContainer.classList.add('in-deck');
    }

    function handleDropFromSlotToCollection(sourceSlot) {
        // Карта, которую тащим (из слота)
        const cardData = slotData[sourceSlot.id];
        if (!cardData) return; // На всякий случай

        // 1. Находим карту в коллекции и "возвращаем" (показываем)
        const collectionCard = document.querySelector(`.card-container[data-card-id="${cardData.id}"]`);
        if (collectionCard) {
            collectionCard.classList.remove('in-deck');
        }

        // 2. Очищаем слот
        clearSlot(sourceSlot);
    }
    
    function handleSwapSlots(sourceSlot, targetSlot) {
        // Данные карт
        const sourceData = slotData[sourceSlot.id]; // Карта A (которую тащим)
        const targetData = slotData[targetSlot.id]; // Карта B (в целевом слоте, может быть null)

        // 1. Помещаем карту A в слот B
        if (sourceData) {
            setSlotData(targetSlot, sourceData);
        } else {
            clearSlot(targetSlot);
        }

        // 2. Помещаем карту B в слот A
        if (targetData) {
            setSlotData(sourceSlot, targetData);
        } else {
            clearSlot(sourceSlot);
        }
    }

    // --- ФУНКЦИИ УПРАВЛЕНИЯ СЛОТАМИ ---
    
    // Помещает данные карты в элемент слота
    function setSlotData(slotElement, cardData) {
        const slotContainer = slotElement.querySelector('.card-container');
        const slotImg = slotContainer.querySelector('img');
        
        // Обновляем данные на контейнере
        slotContainer.dataset.cardId = cardData.id;
        slotContainer.dataset.mana = cardData.mana;
        slotContainer.dataset.description = cardData.description;
        
        // Обновляем картинку
        slotImg.src = cardData.src;
        slotImg.alt = cardData.description.substring(0, 20);
        
        // Обновляем состояние
        slotData[slotElement.id] = cardData;
        
        // Обновляем тултип
        updateTooltip(slotContainer);
    }
    
    // Очищает слот
    function clearSlot(slotElement) {
        const slotContainer = slotElement.querySelector('.card-container');
        const slotImg = slotContainer.querySelector('img');

        // Очищаем данные контейнера
        delete slotContainer.dataset.cardId;
        delete slotContainer.dataset.mana;
        delete slotContainer.dataset.description;

        // Возвращаем placeholder
        slotImg.src = 'placeholder.png';
        slotImg.alt = 'Empty Slot';
        
        // Очищаем состояние
        slotData[slotElement.id] = null;
        
        // Обновляем (очищаем) тултип
        updateTooltip(slotContainer);
    }

    // --- НАЗНАЧЕНИЕ ОБРАБОТЧИКОВ ---

    // 1. Для ВСЕХ .card-container (в слотах и коллекции)
    cardContainers.forEach(container => {
        container.addEventListener('dragstart', dragStart);
        container.addEventListener('dragend', dragEnd);
    });

    // 2. Для слотов (куда можно бросить)
    slots.forEach(slot => {
        slot.addEventListener('dragover', dragOver);
        slot.addEventListener('dragleave', dragLeave);
        slot.addEventListener('drop', dragDrop);
    });
    
    // 3. Для коллекции (куда можно вернуть)
    collectionArea.addEventListener('dragover', dragOver);
    collectionArea.addEventListener('dragleave', dragLeave);
    collectionArea.addEventListener('drop', dragDrop);
});