let metrics = {};
let round = 0;
let gameOver = false;

let activeDynamicDisasters = {
    money: { level10: false, level5: false },
    people: { level10: false, level5: false },
    animals: { level10: false, level5: false },
    plants: { level10: false, level5: false },
    nature: { level10: false, level5: false }
};

let gameData = {};

const metricsDisplay = {
    money: document.getElementById('money'),
    people: document.getElementById('people'),
    animals: document.getElementById('animals'),
    plants: document.getElementById('plants'),
    nature: document.getElementById('nature')
};
const gameLogElement = document.getElementById('gameLog');
const nextRoundButton = document.getElementById('nextRoundButton');
const activeDisasterDisplay = document.getElementById('activeDisasterDisplay');
const activeDisasterList = document.getElementById('activeDisasterList');

const eventSection = document.getElementById('eventSection');
const eventDescriptionElement = document.getElementById('eventDescription');
const choiceButtonsContainer = document.getElementById('choiceButtons');

function updateUI() {
    for (const key in metrics) {
        metricsDisplay[key].textContent = metrics[key];
        if (metrics[key] <= 5) {
            metricsDisplay[key].style.color = '#e74c3c'; // 5 이하: 심각
        } else if (metrics[key] <= 10) {
            metricsDisplay[key].style.color = '#f39c12'; // 10 이하: 위험
        } else if (metrics[key] <= 15) {
            metricsDisplay[key].style.color = '#2b8045'; // 15 이하: 경고
        } else {
            metricsDisplay[key].style.color = '#2980b9'; // 정상
        }
    }
    updateActiveDisasterDisplay();
}

function logMessage(msg, type = 'normal') {
    const p = document.createElement('p');
    p.textContent = `[${round} 라운드] ${msg}`;
    if (type === 'event') p.style.fontWeight = 'bold';
    if (type === 'warning') p.style.color = '#e67e22';
    if (type === 'error') p.style.color = '#c0392b';
    gameLogElement.prepend(p);
    gameLogElement.scrollTop = 0;
}

function rollDice(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

// --- 게임 로직 ---

// 동적 재난 카드 활성화 여부
function checkDynamicDisasters() {
    let changed = false;
    const disasterMessages = [];

    const checkAndToggle = (metricName, threshold, levelKey) => {
        const currentStatus = activeDynamicDisasters[metricName][levelKey];
        const shouldBeActive = metrics[metricName] < threshold;
        const disasterNameKey = `${metricName}_${levelKey}`; // gameData.json의 키 형식

        if (shouldBeActive && !currentStatus) {
            activeDynamicDisasters[metricName][levelKey] = true;
            disasterMessages.push(`${gameData.dynamicDisasterDefinitions[disasterNameKey]} (활성화)`);
            changed = true;
        } else if (!shouldBeActive && currentStatus) {
            activeDynamicDisasters[metricName][levelKey] = false;
            disasterMessages.push(`${gameData.dynamicDisasterDefinitions[disasterNameKey]} (해제)`);
            changed = true;
        }
    };

    checkAndToggle('money', 10, 'level10');
    checkAndToggle('people', 10, 'level10');
    checkAndToggle('animals', 10, 'level10');
    checkAndToggle('plants', 10, 'level10');
    checkAndToggle('nature', 10, 'level10');

    checkAndToggle('money', 5, 'level5');
    checkAndToggle('people', 5, 'level5');
    checkAndToggle('animals', 5, 'level5');
    checkAndToggle('plants', 5, 'level5');
    checkAndToggle('nature', 5, 'level5');

    if (changed) {
        logMessage(`동적 재난 카드 상태 변경: ${disasterMessages.join(', ')}`, 'warning');
    }
}

function updateActiveDisasterDisplay() {
    activeDisasterList.innerHTML = '';
    let hasActiveDisasters = false;
    for (const metricKey in activeDynamicDisasters) {
        for (const levelKey in activeDynamicDisasters[metricKey]) {
            if (activeDynamicDisasters[metricKey][levelKey]) {
                hasActiveDisasters = true;
                const disasterNameKey = `${metricKey}_${levelKey}`;
                const disasterName = gameData.dynamicDisasterDefinitions[disasterNameKey];
                
                const li = document.createElement('li');
                li.textContent = disasterName;
                activeDisasterList.appendChild(li);
            }
        }
    }

    if (hasActiveDisasters) {
        activeDisasterDisplay.style.display = 'block';
    } else {
        activeDisasterDisplay.style.display = 'none';
    }
}

// 지구 자정작용
function applySelfCorrection() {
    let totalGain = 0;
    for (const key in metrics) {
        const gain = Math.max(0, rollDice(4) - 1); // 1d4-1, 최소 0
        metrics[key] = Math.min(100, metrics[key] + gain); // 최대 100으로 제한
        totalGain += gain;
        logMessage(`${key} 지표가 ${gain}만큼 회복되었습니다.`);
    }
    logMessage(`자연의 자정작용이 발동하여 지표들이 회복되었습니다! (총 ${totalGain} 회복)`, 'event');
    
    // UI 업데이트
    checkDynamicDisasters(); // 동적 재난 카드 상태 리로드
    updateUI();
    checkGameOver();

    nextRoundButton.disabled = false; // 다음 라운드 버튼 활성화
}

// 이벤트 발생 (재난 또는 딜레마) 및 선택지 표시
function handleEvent(eventType, eventData, stage = null) {
    eventDescriptionElement.textContent = eventData.description;
    choiceButtonsContainer.innerHTML = ''; // 기존 버튼 제거

    eventData.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.textContent = choice.text;
        button.addEventListener('click', () => makeChoice(choice, eventType, stage));
        choiceButtonsContainer.appendChild(button);
    });

    eventSection.style.display = 'block'; // 이벤트
    nextRoundButton.disabled = true; // 다음 라운드 버튼 비활성화
    logMessage(`새로운 ${eventType === 'disaster' ? '재난' : '딜레마'} 상황 발생: ${eventData.description}`, 'event');
}

// 선택 이후머시기...
function makeChoice(choice, eventType, stage) {
    eventSection.style.display = 'none'; // hide event section
    nextRoundButton.disabled = false; // 다음 라운드 버튼 활성화

    let effectLog = [];
    for (const metric in choice.effects) {
        let value = choice.effects[metric];
        if (eventType === 'disaster' && stage) {
            // 추후 구현...
        }
        metrics[metric] = Math.max(0, Math.min(100, metrics[metric] + value)); // 0~100
        effectLog.push(`${metric}: ${value > 0 ? '+' : ''}${value}`);
    }

    logMessage(`선택: "${choice.text}" (효과: ${effectLog.join(', ')})`);

    checkDynamicDisasters();
    updateUI();
    checkGameOver();
}

// 게임 오버 체크
function checkGameOver() {
    for (const key in metrics) {
        if (metrics[key] <= 0) {
            gameOver = true;
            logMessage(`${key} 지표가 0 이하가 되어 게임 오버입니다!`, 'error');
            nextRoundButton.disabled = true;
            nextRoundButton.textContent = '게임 오버';
            nextRoundButton.style.backgroundColor = '#e74c3c';
            return true;
        }
    }
    return false;
}

// 다음 라운드 진행
function nextRound() {
    if (gameOver) return;

    round++;
    logMessage(`--- ${round} 라운드 시작 ---`, 'event');

    // 1. 동적 재난 카드 리로드
    checkDynamicDisasters();

    // 2. 이벤트 다이스 1d10
    const eventDice = rollDice(10);
    let selectedEvent = null;
    let eventType = '';
    let disasterStage = null;

    if (eventDice <= 7) {
        eventType = 'disaster';
        const disasterKeys = Object.keys(gameData.events.disasters);
        const randomDisasterKey = disasterKeys[Math.floor(Math.random() * disasterKeys.length)];
        selectedEvent = gameData.events.disasters[randomDisasterKey];

        // 1d10
        const natureMetric = metrics.nature;
        const stageDice = rollDice(10);

        if (natureMetric >= 10) {
            if (stageDice <= 6) disasterStage = 1;
            else if (stageDice <= 9) disasterStage = 2;
            else disasterStage = 3;
        } else if (natureMetric >= 5) {
            if (stageDice <= 3) disasterStage = 1;
            else if (stageDice <= 8) disasterStage = 2;
            else disasterStage = 3;
        } else {
            if (stageDice <= 2) disasterStage = 1;
            else if (stageDice <= 6) disasterStage = 2;
            else disasterStage = 3;
        }
        
        logMessage(`재난 단계 결정: ${disasterStage}단계`);
    } else if (eventDice <= 9) {
        eventType = 'dilemma';
        const dilemmaKeys = Object.keys(gameData.events.dilemmas);
        const randomDilemmaKey = dilemmaKeys[Math.floor(Math.random() * dilemmaKeys.length)];
        selectedEvent = gameData.events.dilemmas[randomDilemmaKey];
    } else { // 자정작용
        logMessage('자연의 자정작용 발동!');
        applySelfCorrection();
        return;
    }
    
    handleEvent(eventType, selectedEvent, disasterStage);
}

// --- 초기화 ---
async function loadGameData() {
    try {
        const response = await fetch('gameData.json');
        gameData = await response.json(); // 모든 데이터 리로드
        metrics = { ...gameData.initialMetrics }; // 초기 지표
        initGame(); // 게임 초기화
    } catch (error) {
        console.error("Error loading game data:", error);
        logMessage("게임 데이터를 불러오는 데 실패했습니다. 페이지를 새로고침해주세요.", "error");
        nextRoundButton.disabled = true;
    }
}

function initGame() {
    updateUI();
    nextRoundButton.addEventListener('click', nextRound);
    logMessage("게임 시작! 모든 지표는 30으로 설정되었습니다.", 'event');
}

loadGameData();