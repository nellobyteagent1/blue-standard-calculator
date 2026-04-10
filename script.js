(() => {
  'use strict';

  const display = document.getElementById('display');
  const expression = document.getElementById('expression');

  let currentInput = '0';
  let previousInput = '';
  let operator = null;
  let shouldResetDisplay = false;
  let lastEquals = false;

  const MAX_DIGITS = 15;

  function formatNumber(n) {
    if (n === 'Error') return 'Error';
    const num = parseFloat(n);
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Error';
    const str = String(n);
    if (str.includes('.') && !str.includes('e')) {
      // Preserve trailing decimal or trailing zeros during input
      if (str.endsWith('.') || /\.\d*0+$/.test(str)) return str;
    }
    if (Math.abs(num) > 999999999999999 || (Math.abs(num) < 0.000000001 && num !== 0)) {
      return num.toExponential(6);
    }
    // Limit display length
    const plain = String(num);
    if (plain.length > MAX_DIGITS) {
      return parseFloat(num.toPrecision(12)).toString();
    }
    return plain;
  }

  function updateDisplay() {
    const formatted = formatNumber(currentInput);
    display.textContent = formatted;
    display.classList.toggle('shrink', formatted.length > 12);
  }

  function getOperatorSymbol(op) {
    const symbols = { '+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7' };
    return symbols[op] || op;
  }

  function updateExpression() {
    if (operator && previousInput !== '') {
      expression.textContent = `${formatNumber(previousInput)} ${getOperatorSymbol(operator)}`;
    } else {
      expression.textContent = '';
    }
  }

  function calculate(a, op, b) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return 'Error';
    let result;
    switch (op) {
      case '+': result = numA + numB; break;
      case '-': result = numA - numB; break;
      case '*': result = numA * numB; break;
      case '/':
        if (numB === 0) return 'Error';
        result = numA / numB;
        break;
      default: return 'Error';
    }
    if (!isFinite(result)) return 'Error';
    return String(result);
  }

  function inputNumber(value) {
    if (currentInput === 'Error') currentInput = '0';
    if (shouldResetDisplay || lastEquals) {
      currentInput = value;
      shouldResetDisplay = false;
      if (lastEquals) {
        previousInput = '';
        operator = null;
        lastEquals = false;
        updateExpression();
      }
    } else {
      if (currentInput === '0' && value !== '0') {
        currentInput = value;
      } else if (currentInput === '0' && value === '0') {
        // stay at 0
      } else {
        if (currentInput.replace(/[^0-9]/g, '').length >= MAX_DIGITS) return;
        currentInput += value;
      }
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (shouldResetDisplay || lastEquals) {
      currentInput = '0.';
      shouldResetDisplay = false;
      if (lastEquals) {
        previousInput = '';
        operator = null;
        lastEquals = false;
        updateExpression();
      }
    } else {
      if (currentInput === 'Error') currentInput = '0';
      if (!currentInput.includes('.')) {
        currentInput += '.';
      }
    }
    updateDisplay();
  }

  function inputOperator(op) {
    lastEquals = false;
    if (currentInput === 'Error') {
      currentInput = '0';
    }
    if (operator && !shouldResetDisplay) {
      // Chain calculation
      const result = calculate(previousInput, operator, currentInput);
      currentInput = result;
      updateDisplay();
      previousInput = result;
    } else {
      previousInput = currentInput;
    }
    operator = op;
    shouldResetDisplay = true;
    updateExpression();
    highlightOperator(op);
  }

  function doEquals() {
    if (operator && previousInput !== '') {
      const result = calculate(previousInput, operator, currentInput);
      expression.textContent = `${formatNumber(previousInput)} ${getOperatorSymbol(operator)} ${formatNumber(currentInput)} =`;
      currentInput = result;
      previousInput = '';
      operator = null;
      shouldResetDisplay = false;
      lastEquals = true;
      updateDisplay();
      clearOperatorHighlight();
    }
  }

  function doClear() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    shouldResetDisplay = false;
    lastEquals = false;
    updateDisplay();
    updateExpression();
    clearOperatorHighlight();
  }

  function doBackspace() {
    if (currentInput === 'Error' || shouldResetDisplay || lastEquals) {
      currentInput = '0';
      shouldResetDisplay = false;
      lastEquals = false;
    } else {
      currentInput = currentInput.slice(0, -1);
      if (currentInput === '' || currentInput === '-') {
        currentInput = '0';
      }
    }
    updateDisplay();
  }

  function doPercent() {
    if (currentInput === 'Error') return;
    const num = parseFloat(currentInput);
    if (isNaN(num)) return;
    if (operator && previousInput !== '') {
      // e.g. 200 + 10% = 200 + 20
      currentInput = String(parseFloat(previousInput) * num / 100);
    } else {
      currentInput = String(num / 100);
    }
    lastEquals = false;
    updateDisplay();
  }

  function doToggleSign() {
    if (currentInput === 'Error' || currentInput === '0') return;
    if (currentInput.startsWith('-')) {
      currentInput = currentInput.slice(1);
    } else {
      currentInput = '-' + currentInput;
    }
    updateDisplay();
  }

  function highlightOperator(op) {
    clearOperatorHighlight();
    document.querySelectorAll('.btn.op[data-value]').forEach(btn => {
      if (btn.dataset.value === op) btn.classList.add('active');
    });
  }

  function clearOperatorHighlight() {
    document.querySelectorAll('.btn.op.active').forEach(btn => btn.classList.remove('active'));
  }

  // Button clicks
  document.querySelector('.buttons').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const action = btn.dataset.action;
    switch (action) {
      case 'number': inputNumber(btn.dataset.value); break;
      case 'decimal': inputDecimal(); break;
      case 'operator': inputOperator(btn.dataset.value); break;
      case 'equals': doEquals(); break;
      case 'clear': doClear(); break;
      case 'backspace': doBackspace(); break;
      case 'percent': doPercent(); break;
      case 'toggle-sign': doToggleSign(); break;
    }
  });

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') { inputNumber(e.key); e.preventDefault(); }
    else if (e.key === '.') { inputDecimal(); e.preventDefault(); }
    else if (e.key === '+') { inputOperator('+'); e.preventDefault(); }
    else if (e.key === '-') { inputOperator('-'); e.preventDefault(); }
    else if (e.key === '*') { inputOperator('*'); e.preventDefault(); }
    else if (e.key === '/') { inputOperator('/'); e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === '=') { doEquals(); e.preventDefault(); }
    else if (e.key === 'Escape') { doClear(); e.preventDefault(); }
    else if (e.key === 'Backspace') { doBackspace(); e.preventDefault(); }
    else if (e.key === '%') { doPercent(); e.preventDefault(); }
  });

  updateDisplay();
})();
