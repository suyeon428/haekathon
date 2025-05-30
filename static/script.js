const questions = [
      { text: "강의 내용을 암기하며 시험치는 것을 좋아한다." },
      { text: "팀플로 진행되는 수업을 좋아한다." },
      { text: "과제의 비중이 높은 강의를 좋아한다."},
      { text: "출석 비중이 높은 강의를 좋아한다."},
      { text: "진도 나가는 속도가 빠른 것을 좋아한다."},
      { text: "온라인 강의보다 오프라인 대면 강의를 더 좋아한다."},
      { text: "과제 대체 시험을 선호한다."},
      { text: "실습과 실험, 체험 중심의 강의을 듣고싶다."},
      { text: "족보 타는 시험을 선호한다."},
      { text: "토론, 토의 형식의 수업보다 글쓰기 중심을 선호한다."},
      { text: "발표 수업을 선호한다."},
      { text: "보고서 형식의 과제 제출을 선호한다."},
      { text: "주관식보다 객관식 유형의 시험을 선호한다."},
      { text: "강의 중 퀴즈가 있는 수업을 좋아한다."},
      { text: "문제를 혼자 해결하기보다 강의 시간에 문제를 함께 푸는 것이 좋다."},
      { text: "강의시간에 수업만 나가는 것보단 사담 등 가벼운 이야기도 하며 진행되는 수업을 더 선호한다."}
    ];

    const labels = ["전혀 아니다", "조금 아니다", "조금 그렇다", "매우 그렇다"];
    let currentQuestion = 0;
    let totalScore = 0;

    const introPage = document.getElementById("intro");
    const timetablePage = document.getElementById("timetablePage");
    const choicePage = document.getElementById("choice");
    const questionPage = document.getElementById("question");
    const resultPage = document.getElementById("result");
    const questionText = document.getElementById("questionText");
    const responseSlider = document.getElementById("responseSlider");
    const sliderLabel = document.getElementById("sliderLabel");
    const startBtn = document.getElementById("startBtn");
    const nextBtn = document.getElementById("nextBtn");
    const resultTitle = document.getElementById("resultTitle");
    const resultDesc = document.getElementById("resultDesc");
    const statusBar = document.getElementById("statusBar");
    const progressIcon = document.getElementById("progressIcon");

    startBtn.addEventListener("click", () => {
      introPage.classList.add("hidden");
      timetablePage.classList.remove("hidden");
      generateTimetable();
    });

    function generateTimetable() {
      const container = document.getElementById("timetableContainer");
      const days = ["월", "화", "수", "목", "금"];
      const table = document.createElement("table");
      const headerRow = document.createElement("tr");
      headerRow.innerHTML = `<th>시간/요일</th>` + days.map((d, i) => `<th class="day-header" data-day="${i}">${d}</th>`).join('');
      table.appendChild(headerRow);


      for (let time = 9; time < 18.5; time += 0.5) {
      const row = document.createElement("tr");
      const timeCell = document.createElement("td");

      const hour = Math.floor(time);
      const minutes = (time % 1 === 0) ? '00' : '30';
      timeCell.textContent = `${hour}:${minutes}`;
      row.appendChild(timeCell);

      for (let i = 0; i < 5; i++) {
      const cell = document.createElement("td");
      cell.dataset.day = i;
      cell.dataset.hour = hour;
      cell.dataset.minute = minutes;
      cell.addEventListener("click", () => cell.classList.toggle("selected"));
      row.appendChild(cell);
      }

     table.appendChild(row);
    }

      container.innerHTML = "";
      container.appendChild(table);

      document.querySelectorAll(".day-header").forEach(header => {
        header.addEventListener("click", () => {
          const dayIndex = header.dataset.day;
          const allCells = document.querySelectorAll(`td[data-day='${dayIndex}']`);
          
          const allSelected = Array.from(allCells).every(cell => cell.classList.contains("selected"));
          
          allCells.forEach(cell => {
            if (allSelected) {
              cell.classList.remove("selected");
            } else {
              cell.classList.add("selected");
            }
          });
        });
      });

    }

    document.getElementById("submitTimetable").addEventListener("click", () => {
      timetablePage.classList.add("hidden");
      choicePage.classList.remove("hidden");
    });

    const goToQuestionBtn = document.createElement("button");
goToQuestionBtn.textContent = "선택 완료!";
goToQuestionBtn.id = "goToQuestion";
choicePage.appendChild(goToQuestionBtn);

goToQuestionBtn.addEventListener("click", startTest);

nextBtn.addEventListener("click", handleNext);
responseSlider.addEventListener("input", updateSliderLabel);


    function startTest() {
      currentQuestion = 0;
      totalScore = 0;
      showQuestion();
      updateProgress(0);
    }

    function showQuestion() {
      questionText.textContent = questions[currentQuestion].text;
      responseSlider.value = 1;
      updateSliderLabel();
    }

    function updateSliderLabel() {
      sliderLabel.textContent = labels[parseInt(responseSlider.value)];
    }

    let userAnswers = [];

    function handleNext() {
      userAnswers.push(parseInt(responseSlider.value));

      currentQuestion++;
      const progress = (100 / questions.length) * currentQuestion;
      updateProgress(progress);

      if (currentQuestion < questions.length) {
        showQuestion();
      } else {
        showResult();
      }
    }


    function updateProgress(progress) {
  statusBar.style.width = progress + "%";
  progressIcon.style.left = progress + "%";
}


    function showResult() {
  questionPage.classList.add("hidden");
  resultPage.classList.remove("hidden");

  const answers = userAnswers;
  const collegeCheckboxes = document.querySelectorAll('input[name="college"]:checked');
  const selectedColleges = Array.from(collegeCheckboxes).map(cb => cb.value);

  const selectedCollege = selectedColleges[0] || "";

  const selectedCells = document.querySelectorAll("td.selected");
  const availableTimes = Array.from(selectedCells).map(cell => {
    const dayIdx = parseInt(cell.dataset.day);
    const days = ["월", "화", "수", "목", "금"];
    const timeStr = `${cell.dataset.hour}.${cell.dataset.minute === '30' ? '5' : '0'}`;
    return `${days[dayIdx]} ${timeStr}`;
  });

  fetch("/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      answers: answers,
      available_times: availableTimes,
      college: selectedCollege
    })
  })
  .then(res => res.json())
  .then(data => {
    resultTitle.textContent = `당신은 ${data.professor} 교수님과 찰떡궁합!`;
    resultDesc.innerHTML = `유사도: ${data.similarity}%<br><br>
      💡 추천 Top 3<br>
      ${data.top3.map(t => `${t.subject} (${t.professor}) - ${t.similarity}%`).join("<br>")}<br><br>
      😅 비추천 Bottom 3<br>
      ${data.bottom3.map(b => `${b.subject} (${b.professor}) - ${b.similarity}%`).join("<br>")}`;
  });
}


    document.getElementById("goToQuestion").addEventListener("click", () => {
  choicePage.classList.add("hidden");
  questionPage.classList.remove("hidden");
  startTest();
});

