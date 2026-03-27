'use strict';

const display    = document.getElementById('result');
const expression = document.getElementById('expression');

let state = {
  current:   '0',
  previous:  '',
  operator:  null,
  justEval:  false,
  justOp:    false,
};

function updateDisplay(animate = false) {
  display.textContent = state.current;
  display.classList.remove('error');

  if (animate) {
    display.classList.remove('pop');
    void display.offsetWidth; // reflow
    display.classList.add('pop');
    setTimeout(() => display.classList.remove('pop'), 150);
  }
}

function buildExpression() {
  if (state.operator && !state.justEval) {
    expression.textContent = `${state.previous} ${state.operator}`;
  } else if (state.justEval) {
    expression.textContent = `${state.lastExpr} =`;
  } else {
    expression.textContent = '';
  }
}

function inputDigit(digit) {
  if (state.justEval) {
    state.current  = digit;
    state.previous = '';
    state.operator = null;
    state.justEval = false;
  } else if (state.justOp) {
    state.current = digit;
    state.justOp  = false;
  } else {
    state.current = state.current === '0' ? digit : state.current + digit;
  }
  updateDisplay();
}

function inputDecimal() {
  if (state.justEval || state.justOp) {
    state.current  = '0.';
    state.justEval = false;
    state.justOp   = false;
    updateDisplay();
    return;
  }
  if (!state.current.includes('.')) {
    state.current += '.';
    updateDisplay();
  }
}

function chooseOperator(op) {
  if (state.operator && !state.justOp) {
    evaluate(false);
  }
  state.previous = state.current;
  state.operator = op;
  state.justOp   = true;
  state.justEval = false;
  buildExpression();
}

function evaluate(animate = true) {
  if (!state.operator || state.justOp) return;

  const prev = parseFloat(state.previous);
  const curr = parseFloat(state.current);
  let result;

  switch (state.operator) {
    case '+': result = prev + curr; break;
    case '−': result = prev - curr; break;
    case '×': result = prev * curr; break;
    case '÷':
      if (curr === 0) {
        display.textContent = 'Erro: ÷0';
        display.classList.add('error');
        expression.textContent = '';
        resetState();
        return;
      }
      result = prev / curr;
      break;
    default: return;
  }

  // Avoid floating-point noise
  result = parseFloat(result.toPrecision(12));

  state.lastExpr = `${state.previous} ${state.operator} ${state.current}`;
  state.current  = String(result);
  state.previous = '';
  state.operator = null;
  state.justEval = true;
  state.justOp   = false;

  buildExpression();
  updateDisplay(animate);
}

function toggleSign() {
  if (state.current !== '0') {
    state.current = state.current.startsWith('-')
      ? state.current.slice(1)
      : '-' + state.current;
    updateDisplay();
  }
}

function percent() {
  state.current = String(parseFloat(state.current) / 100);
  state.justEval = false;
  updateDisplay();
}

function clearAll() {
  resetState();
  expression.textContent = '';
  updateDisplay();
}

function resetState() {
  state = {
    current:   '0',
    previous:  '',
    operator:  null,
    justEval:  false,
    justOp:    false,
    lastExpr:  '',
  };
}

// ── Event delegation ──
document.querySelector('.buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  const value  = btn.dataset.value;
  const action = btn.dataset.action;

  if (value !== undefined) {
    if (value === '.') {
      inputDecimal();
    } else if (['+', '−', '×', '÷'].includes(value)) {
      chooseOperator(value);
    } else {
      inputDigit(value);
    }
  }

  if (action) {
    switch (action) {
      case 'clear':       clearAll();     break;
      case 'toggle-sign': toggleSign();   break;
      case 'percent':     percent();      break;
      case 'equals':      evaluate();     break;
    }
  }

  buildExpression();
});

// ── Keyboard support ──
document.addEventListener('keydown', (e) => {
  const key = e.key;

  if (key >= '0' && key <= '9') { inputDigit(key); buildExpression(); return; }
  if (key === '.')               { inputDecimal(); return; }
  if (key === '+')               { chooseOperator('+'); buildExpression(); return; }
  if (key === '-')               { chooseOperator('−'); buildExpression(); return; }
  if (key === '*')               { chooseOperator('×'); buildExpression(); return; }
  if (key === '/')               { e.preventDefault(); chooseOperator('÷'); buildExpression(); return; }
  if (key === 'Enter' || key === '=') { evaluate(); buildExpression(); return; }
  if (key === 'Backspace')       { handleBackspace(); return; }
  if (key === 'Escape')          { clearAll(); return; }
  if (key === '%')               { percent(); buildExpression(); return; }
});

function handleBackspace() {
  if (state.justEval) return;
  if (state.current.length === 1 || (state.current.length === 2 && state.current.startsWith('-'))) {
    state.current = '0';
  } else {
    state.current = state.current.slice(0, -1);
  }
  updateDisplay();
}

// Init
updateDisplay();
