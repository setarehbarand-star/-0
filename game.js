// DOM Elements
const gameArea = document.getElementById('game-area');
const questionBox = document.getElementById('question-box');
const answerInput = document.getElementById('answer-input');
const feedback = document.getElementById('feedback');
const scoreSpan = document.getElementById('score');
const mascotImg = document.querySelector('#character-mascot img');
const virtualKeypad = document.getElementById('virtual-keypad');
const submitBtn = document.getElementById('submit-btn');

// Sound Elements
const correctSound = document.getElementById('correct-sound');
const incorrectSound = document.getElementById('incorrect-sound');
const clickSound = document.getElementById('click-sound');
const allButtons = document.querySelectorAll('button');

// Game State
let currentOperation = '';
let num1, num2, correctAnswer;
let score = 0;

// --- متغیرهای جدید برای کنترل دو ستونی تلویزیون ---
let isTvDevice = false;
let navigableColumns = []; // آرایه‌ای از ستون‌ها
let currentColumnIndex = 0; // 0 برای چپ، 1 برای راست
let currentRowIndex = 0; // ایندکس دکمه در ستون فعلی

// --- توابع تبدیل اعداد (بهبود یافته) ---
function toPersianDigits(num) {
  if (typeof num === 'number') {
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  }
  return num.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

function toEnglishDigits(str) {
  if (typeof str === 'number') {
    return str.toString();
  }
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return str.replace(/[۰-۹]/g, d => persianDigits.indexOf(d));
}

// --- توابع صفحه‌کلید و کنترل تلویزیون ---
function isTV() {
  const tvRegex = /TV|SmartTV|Tizen|webOS|Bravia|NetCast|Roku|Viera|CrKey/i;
  return tvRegex.test(navigator.userAgent);
}

function appendNumber(number) {
  if (/[۰-۹]/.test(number)) {
    const currentValue = answerInput.value;
    if (currentValue.length < 3) {
      answerInput.value = currentValue + number;
    }
  }
  answerInput.focus();
  answerInput.select();
}

function backspace() {
  answerInput.value = answerInput.value.slice(0, -1);
  answerInput.focus();
  answerInput.select();
}

function updateTvFocus() {
  navigableColumns.flat().forEach(el => el.classList.remove('tv-focus'));
  submitBtn.classList.remove('tv-focus');

  const currentColumn = navigableColumns[currentColumnIndex];
  if (currentRowIndex >= currentColumn.length) {
    submitBtn.classList.add('tv-focus');
    submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    const currentElement = currentColumn[currentRowIndex];
    currentElement.classList.add('tv-focus');
    currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  isTvDevice = isTV();
  if (isTvDevice) {
    console.log("حالت تلویزیون فعال شد.");
    const leftColButtons = Array.from(document.querySelectorAll('#keypad-col-left .keypad-btn'));
    const rightColButtons = Array.from(document.querySelectorAll('#keypad-col-right .keypad-btn'));
    navigableColumns = [leftColButtons, rightColButtons];
  }
  console.log("ابرهای متحرک فعال شدند! 🎮☁️");
  const allClouds = document.querySelectorAll('.cloud');
  console.log(`تعداد کل ابرها: ${allClouds.length}`);
});

allButtons.forEach(button => {
  button.addEventListener('click', () => {
    clickSound.currentTime = 0;
    clickSound.play().catch(e => console.log("Error playing sound:", e));
  });
});

answerInput.addEventListener('input', function() {
  this.value = this.value.replace(/[^۰-۹]/g, '');
  if (this.value.length > 3) {
    this.value = this.value.slice(0, 3);
  }
});

answerInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && !isTvDevice) {
    checkAnswer();
  }
  if (!/[۰-۹]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && 
      event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Tab') {
    event.preventDefault();
  }
});

document.addEventListener('keydown', (event) => {
  if (!isTvDevice || gameArea.classList.contains('hidden')) return;
  event.preventDefault();
  let currentColumn = navigableColumns[currentColumnIndex];

  switch (event.key) {
    case 'ArrowDown':
      if (currentRowIndex === currentColumn.length - 1) {
        currentRowIndex++;
      } else if (currentRowIndex < currentColumn.length - 1) {
        currentRowIndex++;
      }
      updateTvFocus();
      break;
    case 'ArrowUp':
      if (currentRowIndex >= currentColumn.length) {
        currentRowIndex = currentColumn.length - 1;
      } else if (currentRowIndex > 0) {
        currentRowIndex--;
      }
      updateTvFocus();
      break;
    case 'ArrowRight':
      if (currentColumnIndex === 0) {
        currentColumnIndex = 1;
        currentRowIndex = Math.min(currentRowIndex, navigableColumns[1].length - 1);
      }
      updateTvFocus();
      break;
    case 'ArrowLeft':
      if (currentColumnIndex === 1) {
        currentColumnIndex = 0;
        currentRowIndex = Math.min(currentRowIndex, navigableColumns[0].length - 1);
      }
      updateTvFocus();
      break;
    case 'Enter':
    case 'Ok':
      if (currentRowIndex >= currentColumn.length) {
        submitBtn.click();
      } else {
        navigableColumns[currentColumnIndex][currentRowIndex].click();
      }
      break;
  }
});

function updateMascot(state) {
  if (state === 'happy') mascotImg.src = 'عروسک ها/عروسک1.webp';
  else if (state === 'sad') mascotImg.src = 'عروسک ها/عروسک2.webp';
  else mascotImg.src = 'عروسک ها/عروسک.webp';
  mascotImg.classList.remove('happy-animation', 'sad-animation');
  if (state === 'happy') mascotImg.classList.add('happy-animation');
  if (state === 'sad') mascotImg.classList.add('sad-animation');
}

function selectOperation(op) {
  currentOperation = op;
  score = 0;
  updateScore();
  gameArea.classList.remove('hidden');
  virtualKeypad.classList.add('visible');
  generateQuestion();
  updateMascot('idle');

  if (isTvDevice) {
    currentColumnIndex = 1;
    currentRowIndex = 0;
    updateTvFocus();
  } else {
    answerInput.focus();
    answerInput.value = '';
  }
}

function generateQuestion() {
  feedback.innerHTML = '';
  feedback.className = '';
  answerInput.value = '';
  if (!isTvDevice) {
    answerInput.focus();
    answerInput.select();
  }

  if (currentOperation === 'add') {
    num1 = Math.floor(Math.random() * 20) + 1;
    num2 = Math.floor(Math.random() * 20) + 1;
    correctAnswer = num1 + num2;
    questionBox.innerHTML = `<span class="number">${toPersianDigits(num1)}</span> + <span class="number">${toPersianDigits(num2)}</span> = ?`;
  } else if (currentOperation === 'subtract') {
    num1 = Math.floor(Math.random() * 30) + 1;
    num2 = Math.floor(Math.random() * num1) + 1;
    correctAnswer = num1 - num2;
    questionBox.innerHTML = `<span class="number">${toPersianDigits(num1)}</span> - <span class="number">${toPersianDigits(num2)}</span> = ?`;
  } else if (currentOperation === 'multiply') {
    num1 = Math.floor(Math.random() * 10) + 1;
    num2 = Math.floor(Math.random() * 10) + 1;
    correctAnswer = num1 * num2;
    questionBox.innerHTML = `<span class="number">${toPersianDigits(num1)}</span> × <span class="number">${toPersianDigits(num2)}</span> = ?`;
  } else if (currentOperation === 'divide') {
    let divisor = Math.floor(Math.random() * 9) + 2;
    let result = Math.floor(Math.random() * 9) + 2;
    num1 = divisor * result;
    num2 = divisor;
    correctAnswer = result;
    questionBox.innerHTML = `<span class="number">${toPersianDigits(num1)}</span> ÷ <span class="number">${toPersianDigits(num2)}</span> = ?`;
  }
}

function triggerCelebration() {
  const duration = 2 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
  function randomInRange(min, max) { return Math.random() * (max - min) + min; }
  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

function checkAnswer() {
  const userInput = answerInput.value.trim();
  if (userInput === '') {
    feedback.innerHTML = '<span>❌</span> لطفاً یک عدد وارد کن!';
    feedback.className = 'incorrect';
    return;
  }
  const userAnswer = parseInt(toEnglishDigits(userInput));
  if (isNaN(userAnswer)) {
    feedback.innerHTML = '<span>❌</span> لطفاً فقط عدد وارد کن!';
    feedback.className = 'incorrect';
    return;
  }
  if (userAnswer === correctAnswer) {
    feedback.innerHTML = '<span>✔️</span> 🎉 آفرین! درست بود! 🎉';
    feedback.className = 'correct';
    score++;
    updateScore();
    updateMascot('happy');
    correctSound.currentTime = 0;
    correctSound.play().catch(e => console.log("Error playing sound:", e));
    triggerCelebration();
    setTimeout(() => {
      generateQuestion();
      updateMascot('idle');
    }, 2500);
  } else {
    feedback.innerHTML = `<span>❌</span> دوباره تلاش کن`;
    feedback.className = 'incorrect';
    incorrectSound.currentTime = 0;
    incorrectSound.play().catch(e => console.log("Error playing sound:", e));
    if(score > 0) score--;
    updateScore();
    updateMascot('sad');
    setTimeout(() => updateMascot('idle'), 2000);
  }
}

function updateScore() {
  scoreSpan.textContent = toPersianDigits(score);
}

console.log("شهر ابری اعداد با ابرهای متحرک آماده است! 🎮☁️");
