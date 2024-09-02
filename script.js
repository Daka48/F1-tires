const trackData = {
    monaco: {
        totalLaps: 78,
        baseLapTime: 75, 
    },
    silverstone: {
        totalLaps: 52,
        baseLapTime: 90, 
    }
};

const tireDegradation = {
    soft: 0.3,
    medium: 0.2,
    hard: 0.1,
};
const tireLimits = {
    soft: 22,
    medium: 30,
    hard: 35,
};
const additionalDegradation = {
    soft: 0.8,
    medium: 0.8,
    hard: 0.8,
};
// DOM 가져왔습니다
const trackSelect = document.getElementById('trackSelect');
const tireStrategy = document.getElementById('tireStrategy');
const addStrategyButton = document.getElementById('addStrategy');
const calculateButton = document.getElementById('calculateButton');
const analysisResult = document.getElementById('analysis');
const lapTimeChart = document.getElementById('lapTimeChart');

// 트랙 선택 시 랩 수를 자동 설정합니다
trackSelect.addEventListener('change', () => {
    const selectedTrack = trackSelect.value;
    const totalLaps = trackData[selectedTrack]?.totalLaps || 0;

    // 기존 전략 행을 모두 삭제합니다
    tireStrategy.innerHTML = '<h2>타이어 전략</h2>';

    // 첫 번째 전략 행 추가합니다
    addStrategyRow();

    // 종료 랩 입력 값 업데이트 합니다
    const endLapInputs = document.querySelectorAll('.endLap');
    endLapInputs.forEach(input => input.value = totalLaps);
    endLapInputs.forEach(input => input.max = totalLaps);
});


addStrategyButton.addEventListener('click', addStrategyRow);

// 전략 행 추가 함수
function addStrategyRow() {
    const newRow = document.createElement('div');
    newRow.classList.add('strategy-row');
    newRow.innerHTML = `
        <label for="startLap">시작 랩:</label>
        <input type="number" class="startLap" value="1" min="1">
        <label for="endLap">종료 랩:</label>
        <input type="number" class="endLap" value="0" min="1">
        <select class="tireType">
            <option value="soft">소프트</option>
            <option value="medium">미디움</option>
            <option value="hard">하드</option>
        </select>
    `;

    tireStrategy.appendChild(newRow);

    // 랩 범위를 확인합니다(gpt가 해줬습니다)
    const startLapInput = newRow.querySelector('.startLap');
    const endLapInput = newRow.querySelector('.endLap');

    startLapInput.addEventListener('input', () => {
        
        endLapInput.min = startLapInput.value;
    });

    endLapInput.addEventListener('input', () => {
        const selectedTrack = trackSelect.value;
        const totalLaps = trackData[selectedTrack]?.totalLaps || 0;

        // 종료 랩은 시작 랩보다 작을 수 없고, 총 랩 수를 초과할 수 없음
        if (parseInt(endLapInput.value) < parseInt(startLapInput.value)) {
            endLapInput.value = startLapInput.value;
        }
        if (parseInt(endLapInput.value) > totalLaps) {
            endLapInput.value = totalLaps;
        }
    });
}

// 계산 버튼 여기서 부터 많은 도움을 받았습니다
calculateButton.addEventListener('click', () => {
    const selectedTrack = trackSelect.value;
    const track = trackData[selectedTrack];

    if (!track) {
        alert("트랙을 선택해주세요.");
        return;
    }

    // 입력된 전략 정보를 가져옵니다
    const strategies = [];
    const strategyRows = document.querySelectorAll('.strategy-row');
    strategyRows.forEach(row => {
        const startLap = parseInt(row.querySelector('.startLap').value);
        const endLap = parseInt(row.querySelector('.endLap').value);
        const tireType = row.querySelector('.tireType').value;
        strategies.push({ startLap, endLap, tireType });
    });

    // 전략 분석 및 랩타임 계산
    const { analysis, lapTimes } = analyzeStrategies(track, strategies);

    // 결과 출력
    analysisResult.innerHTML = analysis;

    // 그래프 생성
    createLapTimeChart(lapTimes);
});

// 전략 분석 함수
function analyzeStrategies(track, strategies) {
    const totalLaps = track.totalLaps;
    let lapTimes = [];
    let lapTimeTotal = 0; // 총 레이스 시간
    let analysis = '';

    // 각 전략에 대한 랩타임 계산
    strategies.forEach(strategy => {
        const { startLap, endLap, tireType } = strategy;
        const tireLimit = tireLimits[tireType];
        const degradation = tireDegradation[tireType];
        const additionalDeg = additionalDegradation[tireType];
        let lapTime = track.baseLapTime;
        let lapsOnTire = 0;

        for (let lap = startLap; lap <= endLap; lap++) {
            lapsOnTire++;

            // 마모에 따른 랩타임 증가
            let lapTimeIncrease = degradation * lapsOnTire;

            // 타이어 한계 초과 시 추가 마모 적용
            if (lapsOnTire > tireLimit) {
                lapTimeIncrease += additionalDeg * (lapsOnTire - tireLimit);
            }

            const totalLapTime = lapTime + lapTimeIncrease;
            lapTimes.push({ lap, lapTime: totalLapTime, tireType });
            lapTimeTotal += totalLapTime;

            analysis += `랩 ${lap}: 타이어: ${tireType}, 랩타임: ${totalLapTime.toFixed(2)}초<br>`;
        }
    });

    // 총 레이스 시간을 시간, 분, 초로 변환
    const formattedTotalTime = formatTime(lapTimeTotal);

    analysis += `<br>총 레이스 시간: ${formattedTotalTime}`;

    return { analysis, lapTimes };
}

// 시간, 분, 초 형식으로 변환하는 함수
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}시간 ${minutes}분 ${secs}초`;
}

// 그래프 생성 함수(대단한 chat gpt)
function createLapTimeChart(lapTimes) {
    const labels = lapTimes.map(item => `랩 ${item.lap}`);
    const data = lapTimes.map(item => item.lapTime);
    const tireColors = lapTimes.map(item => {
        switch (item.tireType) {
            case 'soft': return 'rgba(255, 99, 132, 0.6)';
            case 'medium': return 'rgba(255, 206, 86, 0.6)';
            case 'hard': return 'rgba(75, 192, 192, 0.6)';
            default: return 'rgba(0, 0, 0, 0.6)';
        }
    });

    new Chart(lapTimeChart, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '랩타임 (초)',
                data: data,
                backgroundColor: tireColors,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                fill: false,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '랩타임 (초)',
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '랩',
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}
