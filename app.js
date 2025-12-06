// ===== Football Quiz App =====

class FootballQuiz {
    constructor() {
        // Language
        this.currentLang = localStorage.getItem('quiz_lang') || 'ar';

        // DOM Elements
        this.startScreen = document.getElementById('start-screen');
        this.quizScreen = document.getElementById('quiz-screen');
        this.resultScreen = document.getElementById('result-screen');

        this.apiKeyInput = document.getElementById('api-key');
        this.toggleKeyBtn = document.getElementById('toggle-key');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
        this.startBtn = document.getElementById('start-btn');
        this.btnText = document.querySelector('.btn-text');
        this.btnLoader = document.querySelector('.btn-loader');

        this.questionCounter = document.getElementById('question-counter');
        this.currentScoreEl = document.getElementById('current-score');
        this.progressFill = document.getElementById('progress-fill');
        this.timerEl = document.getElementById('timer');
        this.qNumber = document.getElementById('q-number');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.nextBtn = document.getElementById('next-btn');

        // Pause elements
        this.pauseBtn = document.getElementById('pause-btn');
        this.pauseModal = document.getElementById('pause-modal');
        this.resumeBtn = document.getElementById('resume-btn');
        this.mainMenuBtn = document.getElementById('main-menu-btn');

        // Language toggle
        this.langToggle = document.getElementById('lang-toggle');

        this.resultAnimation = document.getElementById('result-animation');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');
        this.finalScore = document.getElementById('final-score');
        this.scoreCircle = document.getElementById('score-circle');
        this.correctCount = document.getElementById('correct-count');
        this.wrongCount = document.getElementById('wrong-count');
        this.timeTaken = document.getElementById('time-taken');
        this.percentage = document.getElementById('percentage');
        this.retryBtn = document.getElementById('retry-btn');
        this.newQuizBtn = document.getElementById('new-quiz-btn');

        // State
        this.selectedLevel = 'medium';
        this.questions = [];
        this.currentQuestion = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 30;
        this.totalTime = 0;
        this.answered = false;
        this.isPaused = false;

        // Initialize
        this.init();
    }

    init() {
        // Load saved API key from localStorage (no default key for security)
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            this.apiKeyInput.value = savedKey;
        }

        // Apply saved language
        this.applyLanguage();

        // Event Listeners
        this.toggleKeyBtn.addEventListener('click', () => this.toggleApiKey());
        this.langToggle.addEventListener('click', () => this.toggleLanguage());

        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectDifficulty(btn));
        });

        this.startBtn.addEventListener('click', () => this.startQuiz());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.retryBtn.addEventListener('click', () => this.retryQuiz());
        this.newQuizBtn.addEventListener('click', () => this.newQuiz());

        // Pause menu listeners
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resumeBtn.addEventListener('click', () => this.resumeQuiz());
        this.mainMenuBtn.addEventListener('click', () => this.goToMainMenu());

        // Save API key on change
        this.apiKeyInput.addEventListener('change', () => {
            localStorage.setItem('gemini_api_key', this.apiKeyInput.value);
        });
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('quiz_lang', this.currentLang);
        this.applyLanguage();
    }

    applyLanguage() {
        const isArabic = this.currentLang === 'ar';

        // Update HTML direction
        document.documentElement.lang = this.currentLang;
        document.documentElement.dir = isArabic ? 'rtl' : 'ltr';

        // Update toggle button
        const langText = this.langToggle.querySelector('.lang-text');
        langText.textContent = isArabic ? 'EN' : 'ع';

        // Update all elements with data-ar and data-en
        document.querySelectorAll('[data-ar][data-en]').forEach(el => {
            el.textContent = isArabic ? el.dataset.ar : el.dataset.en;
        });

        // Update placeholders
        document.querySelectorAll('[data-placeholder-ar][data-placeholder-en]').forEach(el => {
            el.placeholder = isArabic ? el.dataset.placeholderAr : el.dataset.placeholderEn;
        });

        // Update question counter if in quiz
        if (this.questions.length > 0) {
            this.updateQuestionCounter();
        }
    }

    updateQuestionCounter() {
        const num = this.currentQuestion + 1;
        const total = this.questions.length;

        if (this.currentLang === 'ar') {
            this.questionCounter.textContent = `السؤال ${num} من ${total}`;
        } else {
            this.questionCounter.textContent = `Question ${num} of ${total}`;
        }
    }

    toggleApiKey() {
        if (this.apiKeyInput.type === 'password') {
            this.apiKeyInput.type = 'text';
            this.toggleKeyBtn.textContent = '🙈';
        } else {
            this.apiKeyInput.type = 'password';
            this.toggleKeyBtn.textContent = '👁️';
        }
    }

    selectDifficulty(btn) {
        this.difficultyBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedLevel = btn.dataset.level;
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeQuiz();
        } else {
            this.pauseQuiz();
        }
    }

    pauseQuiz() {
        this.isPaused = true;
        clearInterval(this.timer);
        this.pauseModal.classList.add('active');
    }

    resumeQuiz() {
        this.isPaused = false;
        this.pauseModal.classList.remove('active');

        // Resume timer if not answered
        if (!this.answered && this.timeLeft > 0) {
            this.timer = setInterval(() => {
                if (this.isPaused) return;

                this.timeLeft--;
                this.totalTime++;
                this.timerEl.textContent = this.timeLeft;

                if (this.timeLeft <= 10) {
                    this.timerEl.classList.add('warning');
                }
                if (this.timeLeft <= 5) {
                    this.timerEl.classList.remove('warning');
                    this.timerEl.classList.add('danger');
                }

                if (this.timeLeft <= 0) {
                    clearInterval(this.timer);
                    this.timeUp();
                }
            }, 1000);
        }
    }

    goToMainMenu() {
        this.isPaused = false;
        this.pauseModal.classList.remove('active');
        clearInterval(this.timer);

        // Reset state
        this.currentQuestion = 0;
        this.score = 0;
        this.totalTime = 0;
        this.questions = [];
        this.currentScoreEl.textContent = '0';

        this.showScreen(this.startScreen);
    }

    async startQuiz() {
        const apiKey = this.apiKeyInput.value.trim();

        if (!apiKey) {
            const msg = this.currentLang === 'ar' ? 'الرجاء إدخال مفتاح API' : 'Please enter API key';
            this.showToast(msg, 'error');
            return;
        }

        // Show loading
        this.startBtn.disabled = true;
        this.btnText.classList.add('hidden');
        this.btnLoader.classList.remove('hidden');

        try {
            await this.generateQuestions(apiKey);
            this.showScreen(this.quizScreen);
            this.displayQuestion();
        } catch (error) {
            console.error('Error:', error);
            this.showToast(error.message || (this.currentLang === 'ar' ? 'حدث خطأ في توليد الأسئلة' : 'Error generating questions'), 'error');
        } finally {
            this.startBtn.disabled = false;
            this.btnText.classList.remove('hidden');
            this.btnLoader.classList.add('hidden');
        }
    }

    async generateQuestions(apiKey) {
        const langInstruction = this.currentLang === 'ar'
            ? 'اكتب الأسئلة والخيارات باللغة العربية.'
            : 'Write questions and options in English.';

        const prompt = `You are a professional football quiz generator.

Task: Generate a completely new quiz without repeating questions.

Requirements:
- Difficulty level: ${this.selectedLevel}
- Number of questions: 20
- Type: Multiple Choice
- Options per difficulty:
  very_easy → 2 options
  easy → 3 options
  medium → 4 options
  hard → 4 options
  very_hard → 5 options
  impossible → 6 options

Rules:
- Questions should be diverse (championships, players, clubs, records, historic moments)
- Accurate and reliable
- Wrong answers should be convincing
- Clear and concise wording
- Make questions varied and random each time
- ${langInstruction}

Return JSON only in this format:
[
  {
    "question": "Question text",
    "options": ["option1", "option2", ...],
    "correct_answer": "Correct answer"
  }
]

Return only valid JSON without any additional text or markdown.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 1.0,
                    topK: 40,
                    topP: 0.95,
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || (this.currentLang === 'ar' ? 'فشل في الاتصال بـ API' : 'Failed to connect to API'));
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        // Parse JSON from response
        let jsonText = text.trim();
        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7);
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith('```')) {
            jsonText = jsonText.slice(0, -3);
        }
        jsonText = jsonText.trim();

        try {
            this.questions = JSON.parse(jsonText);

            if (!Array.isArray(this.questions) || this.questions.length === 0) {
                throw new Error(this.currentLang === 'ar' ? 'تنسيق الأسئلة غير صحيح' : 'Invalid question format');
            }
        } catch (e) {
            console.error('Parse error:', e, 'Text:', jsonText);
            throw new Error(this.currentLang === 'ar' ? 'فشل في تحليل الأسئلة' : 'Failed to parse questions');
        }
    }

    displayQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.showResults();
            return;
        }

        this.answered = false;
        this.nextBtn.classList.add('hidden');

        const q = this.questions[this.currentQuestion];
        const num = this.currentQuestion + 1;
        const remaining = this.questions.length - num;

        // Update header
        this.updateQuestionCounter();
        this.progressFill.style.width = `${(num / this.questions.length) * 100}%`;
        this.qNumber.textContent = num.toString().padStart(2, '0');

        // Update remaining questions
        const questionsRemainingEl = document.getElementById('questions-remaining');
        if (questionsRemainingEl) {
            questionsRemainingEl.textContent = remaining;
        }

        // Display question
        this.questionText.textContent = q.question;

        // Display options
        const letters = this.currentLang === 'ar'
            ? ['أ', 'ب', 'ج', 'د', 'هـ', 'و']
            : ['A', 'B', 'C', 'D', 'E', 'F'];

        this.optionsContainer.innerHTML = q.options.map((opt, i) => `
            <button class="option-btn" data-answer="${opt}">
                <span class="option-letter">${letters[i]}</span>
                <span class="option-text">${opt}</span>
            </button>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectAnswer(btn));
        });

        // Start timer
        this.startTimer();
    }

    startTimer() {
        this.timeLeft = 30;
        this.timerEl.textContent = this.timeLeft;
        this.timerEl.className = '';

        if (this.timer) clearInterval(this.timer);

        this.timer = setInterval(() => {
            if (this.isPaused) return;

            this.timeLeft--;
            this.totalTime++;
            this.timerEl.textContent = this.timeLeft;

            if (this.timeLeft <= 10) {
                this.timerEl.classList.add('warning');
            }
            if (this.timeLeft <= 5) {
                this.timerEl.classList.remove('warning');
                this.timerEl.classList.add('danger');
            }

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.timeUp();
            }
        }, 1000);
    }

    timeUp() {
        if (this.answered) return;
        this.answered = true;

        const correctAnswer = this.questions[this.currentQuestion].correct_answer;

        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.answer === correctAnswer) {
                btn.classList.add('correct');
            }
        });

        const msg = this.currentLang === 'ar' ? 'انتهى الوقت! ⏰' : 'Time\'s up! ⏰';
        this.showToast(msg, 'error');
        this.nextBtn.classList.remove('hidden');
    }

    selectAnswer(btn) {
        if (this.answered || this.isPaused) return;
        this.answered = true;

        clearInterval(this.timer);

        const selectedAnswer = btn.dataset.answer;
        const correctAnswer = this.questions[this.currentQuestion].correct_answer;

        // Disable all buttons
        document.querySelectorAll('.option-btn').forEach(b => {
            b.disabled = true;
            if (b.dataset.answer === correctAnswer) {
                b.classList.add('correct');
            }
        });

        if (selectedAnswer === correctAnswer) {
            btn.classList.add('correct');
            this.score++;
            this.currentScoreEl.textContent = this.score;
        } else {
            btn.classList.add('wrong');
        }

        this.nextBtn.classList.remove('hidden');
    }

    nextQuestion() {
        this.currentQuestion++;
        this.displayQuestion();
    }

    showResults() {
        clearInterval(this.timer);

        const total = this.questions.length;
        const correct = this.score;
        const wrong = total - correct;
        const pct = Math.round((correct / total) * 100);

        // Update stats
        this.finalScore.textContent = correct;
        this.correctCount.textContent = correct;
        this.wrongCount.textContent = wrong;
        this.timeTaken.textContent = this.totalTime;
        this.percentage.textContent = `${pct}%`;

        // Animate score circle
        const circumference = 2 * Math.PI * 45; // r = 45
        const offset = circumference - (pct / 100) * circumference;

        // Add gradient definition
        const svg = this.scoreCircle.parentElement;
        if (!svg.querySelector('defs')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = `
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#007AFF"/>
                    <stop offset="100%" stop-color="#5856D6"/>
                </linearGradient>
            `;
            svg.insertBefore(defs, svg.firstChild);
        }

        setTimeout(() => {
            this.scoreCircle.style.strokeDashoffset = offset;
        }, 100);

        // Set result message based on score
        const isAr = this.currentLang === 'ar';

        if (pct >= 90) {
            this.resultAnimation.textContent = '🏆';
            this.resultTitle.textContent = isAr ? 'أسطوري!' : 'Legendary!';
            this.resultMessage.textContent = isAr ? 'أنت خبير حقيقي في كرة القدم!' : 'You are a true football expert!';
        } else if (pct >= 70) {
            this.resultAnimation.textContent = '🥇';
            this.resultTitle.textContent = isAr ? 'ممتاز!' : 'Excellent!';
            this.resultMessage.textContent = isAr ? 'معلوماتك رائعة في كرة القدم!' : 'Your football knowledge is amazing!';
        } else if (pct >= 50) {
            this.resultAnimation.textContent = '🥈';
            this.resultTitle.textContent = isAr ? 'جيد!' : 'Good!';
            this.resultMessage.textContent = isAr ? 'أداء جيد، يمكنك التحسن أكثر!' : 'Good job, you can improve!';
        } else if (pct >= 30) {
            this.resultAnimation.textContent = '🥉';
            this.resultTitle.textContent = isAr ? 'لا بأس' : 'Not Bad';
            this.resultMessage.textContent = isAr ? 'تحتاج لمتابعة المزيد من كرة القدم!' : 'You need to watch more football!';
        } else {
            this.resultAnimation.textContent = '😅';
            this.resultTitle.textContent = isAr ? 'حاول مرة أخرى' : 'Try Again';
            this.resultMessage.textContent = isAr ? 'لا تستسلم، حاول مجدداً!' : 'Don\'t give up, try again!';
        }

        this.showScreen(this.resultScreen);
    }

    retryQuiz() {
        // Reset with same questions
        this.currentQuestion = 0;
        this.score = 0;
        this.totalTime = 0;
        this.currentScoreEl.textContent = '0';
        this.scoreCircle.style.strokeDashoffset = 283;

        this.showScreen(this.quizScreen);
        this.displayQuestion();
    }

    newQuiz() {
        // Reset everything
        this.currentQuestion = 0;
        this.score = 0;
        this.totalTime = 0;
        this.questions = [];
        this.currentScoreEl.textContent = '0';
        this.scoreCircle.style.strokeDashoffset = 283;

        this.showScreen(this.startScreen);
    }

    showScreen(screen) {
        [this.startScreen, this.quizScreen, this.resultScreen].forEach(s => {
            s.classList.remove('active');
        });
        screen.classList.add('active');
    }

    showToast(message, type = 'error') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type === 'success' ? 'success' : ''}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new FootballQuiz();
});
