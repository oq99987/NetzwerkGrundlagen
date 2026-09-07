let currentLang = 'de';
let currentData = null;
let currentModuleId = 'mod1';

// Quiz & Flashcard State
let currentQuizIndex = 0;
let currentFlashcardIndex = 0;
let activeQuizData = [];
let activeFlashcardData = [];

// Theme Toggle
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  html.setAttribute('data-theme', currentTheme === 'light' ? 'dark' : 'light');
}

// Dropdown Logic
function toggleDropdown() {
  document.getElementById('lang-menu').classList.toggle('show');
}

window.onclick = function(e) {
  if (!e.target.closest('.dropdown')) {
    const menu = document.getElementById('lang-menu');
    if (menu && menu.classList.contains('show')) {
      menu.classList.remove('show');
    }
  }
  // Close modals when clicking outside
  if (e.target.classList.contains('modal')) {
    e.target.style.display = "none";
  }
};

// Language Handling
async function changeLanguage(langKey) {
  currentLang = langKey;
  
  try {
    const response = await fetch(`lang/${langKey}.json`);
    if (!response.ok) throw new Error("Failed to load language file");
    
    currentData = await response.json();
    
    // Update UI Strings
    document.getElementById('current-flag').textContent = currentData.flag;
    document.getElementById('current-lang-text').textContent = currentData.langName;
    document.getElementById('ui-brand').textContent = currentData.ui.brand;
    document.getElementById('theme-btn').title = currentData.ui.themeToggle;
    document.getElementById('ui-module-title').textContent = currentData.ui.moduleTitle;
    
    document.getElementById('lang-menu').classList.remove('show');
    
    renderSidebar();
    loadModule(currentModuleId); 
    
  } catch (error) {
    console.error("Error loading language:", error);
    document.getElementById('main-content').innerHTML = `
      <div style="color: red; padding: 20px;">
        Error loading language files. Note: You must run this via a local web server (e.g., VSCode Live Server).
      </div>
    `;
  }
}

function renderSidebar() {
  const list = document.getElementById('module-list');
  list.innerHTML = currentData.modules.map(mod => `
    <li class="module-item ${mod.id === currentModuleId ? 'active' : ''}" onclick="loadModule('${mod.id}')">
      <span class="mod-title">${mod.title}</span>
      <span class="mod-duration">${mod.duration}</span>
    </li>
  `).join('');
}

function loadModule(moduleId) {
  currentModuleId = moduleId;
  renderSidebar(); 
  
  const moduleData = currentData.modules.find(m => m.id === moduleId);
  const main = document.getElementById('main-content');
  
  if (!moduleData.content) {
    main.innerHTML = `
      <div class="module-header">
        <h1>${moduleData.title}</h1>
      </div>
      <div class="content-section">
        <p>Content for this module is not yet available.</p>
      </div>
    `;
    return;
  }
  
  // Set global state for modals
  activeQuizData = moduleData.quiz || [];
  activeFlashcardData = moduleData.flashcards || [];
  
  let html = `
    <div class="module-header">
      <h1>${moduleData.title}</h1>
      <p style="color: var(--text-muted); margin-top: 5px;">${moduleData.content.intro}</p>
    </div>
  `;
  
  // Explanation Section
  html += `
    <div class="content-section">
      ${moduleData.content.explanation}
      ${moduleData.content.image ? `<img src="${moduleData.content.image}" alt="Lesson Diagram" class="lesson-image">` : ''}
  `;
      
  // NotebookLM Media Player
  if (moduleData.content.media) {
    const isVideo = moduleData.content.media.type === 'video';
    html += `
      <div class="notebooklm-player">
        <div class="notebooklm-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          <span>NotebookLM Overview</span>
        </div>
        ${isVideo ? `<video controls src="${moduleData.content.media.src}"></video>` : `<audio controls src="${moduleData.content.media.src}"></audio>`}
        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${currentData.ui.mediaHelper || 'Replace src in JSON to play real media.'}</p>
      </div>
    `;
  }
      
  html += `
      ${moduleData.content.examples}
    </div>
  `;
  
  // Interactive Buttons
  let interactionsHtml = '<div style="display: flex; gap: 15px; margin-top: 20px;">';
  
  if (activeQuizData.length > 0) {
    interactionsHtml += `<button class="btn" onclick="openQuizModal()">📝 ${currentData.ui.startQuiz}</button>`;
  }
  if (activeFlashcardData.length > 0) {
    interactionsHtml += `<button class="btn secondary-btn" onclick="openFlashcardModal()">📇 ${currentData.ui.startFlashcards}</button>`;
  }
  
  interactionsHtml += '</div>';
  
  main.innerHTML = html + interactionsHtml;
}

// ---- Modal Logic ----

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// -- Quiz Modal --
function openQuizModal() {
  currentQuizIndex = 0;
  document.getElementById('modal-quiz-title').textContent = currentData.ui.quizTitle;
  document.getElementById('quiz-modal').style.display = "block";
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const body = document.getElementById('quiz-modal-body');
  const nextBtn = document.getElementById('quiz-next-btn');
  const q = activeQuizData[currentQuizIndex];
  
  if (!q) {
    body.innerHTML = `<h3>Quiz Completed! 🎉</h3>`;
    nextBtn.style.display = 'none';
    return;
  }
  
  nextBtn.style.display = 'none'; // hide until answered
  nextBtn.textContent = (currentQuizIndex === activeQuizData.length - 1) ? currentData.ui.finishBtn : currentData.ui.nextQuestion;
  
  let html = `
    <div class="quiz-question" id="q-${currentQuizIndex}">
      <p>Question ${currentQuizIndex + 1} of ${activeQuizData.length}</p>
      <p style="font-size: 1.1rem; margin: 15px 0;">${q.question}</p>
      <div class="quiz-options">
        ${q.options.map((opt, oIndex) => `
          <div class="quiz-option" onclick="submitQuizAnswer(this, ${oIndex})">${opt}</div>
        `).join('')}
      </div>
      <div id="quiz-explanation" class="quiz-explanation"></div>
    </div>
  `;
  
  body.innerHTML = html;
}

function submitQuizAnswer(element, selectedIndex) {
  const options = element.parentElement.querySelectorAll('.quiz-option');
  
  // Prevent clicking again
  if (element.parentElement.classList.contains('answered')) return;
  element.parentElement.classList.add('answered');
  
  const q = activeQuizData[currentQuizIndex];
  const isCorrect = (selectedIndex === q.answer);
  
  options.forEach((opt, idx) => {
    opt.style.cursor = 'default';
    if (idx === q.answer) {
      opt.classList.add('correct');
    } else if (idx === selectedIndex && !isCorrect) {
      opt.classList.add('wrong');
    }
  });
  
  // Show explanation
  const expDiv = document.getElementById('quiz-explanation');
  expDiv.classList.add('show', isCorrect ? 'correct' : 'wrong');
  
  let expHtml = `<strong>${isCorrect ? '✅ Correct!' : '❌ Incorrect.'}</strong><br>`;
  expHtml += q.explanation || "No explanation provided.";
  expDiv.innerHTML = expHtml;
  
  document.getElementById('quiz-next-btn').style.display = 'inline-block';
}

function nextQuizQuestion() {
  currentQuizIndex++;
  renderQuizQuestion();
}

// -- Flashcard Modal --
function openFlashcardModal() {
  currentFlashcardIndex = 0;
  document.getElementById('modal-flashcard-title').textContent = currentData.ui.flashcardsTitle;
  document.getElementById('flashcard-modal').style.display = "block";
  renderFlashcard();
}

function renderFlashcard() {
  const body = document.getElementById('flashcard-modal-body');
  const card = activeFlashcardData[currentFlashcardIndex];
  
  if (!card) return;
  
  document.getElementById('fc-counter').textContent = `${currentFlashcardIndex + 1} / ${activeFlashcardData.length}`;
  
  body.innerHTML = `
    <div class="flashcard" onclick="this.classList.toggle('flipped')">
      <div class="flashcard-inner">
        <div class="flashcard-front">${card.term}</div>
        <div class="flashcard-back">${card.definition}</div>
      </div>
    </div>
  `;
}

function prevFlashcard() {
  if (currentFlashcardIndex > 0) {
    currentFlashcardIndex--;
    renderFlashcard();
  }
}

function nextFlashcard() {
  if (currentFlashcardIndex < activeFlashcardData.length - 1) {
    currentFlashcardIndex++;
    renderFlashcard();
  }
}

// Init
changeLanguage('de');
