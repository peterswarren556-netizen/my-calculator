/* Warren Calculator: a scientific calculator with a safe expression parser (no eval). */
(() => {
  'use strict';

  // ---------- State ----------
  let expr = '';
  let error = '';
  let justEvaluated = false;
  let deg = true;
  let memory = 0;
  let ans = 0;
  const history = [];

  const $ = (id) => document.getElementById(id);
  const exprEl = $('expr'), prevEl = $('prev'), modeEl = $('mode'), memEl = $('mem');

  // ---------- Tokenizer ----------
  const OPS = { '+': '+', '-': '-', '−': '-', '×': '*', '*': '*', '÷': '/', '/': '/', '^': '^', '!': '!', '%': '%' };
  const NAMES = ['Ans', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'sin', 'cos', 'tan',
                 'log', 'ln', 'sqrt', 'cbrt', 'abs', 'exp', 'pi', 'e'];

  function tokenize(s) {
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === ' ') { i++; continue; }
      if (c === '(' || c === ')') { out.push({ t: c }); i++; continue; }
      if (OPS[c]) { out.push({ t: 'op', v: OPS[c] }); i++; continue; }
      const n = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (n) {
        if (s[i + n[0].length] === '.') throw new Error('Misplaced decimal point');
        out.push({ t: 'num', v: parseFloat(n[0]) });
        i += n[0].length;
        continue;
      }
      if (c === '√') { out.push({ t: 'id', v: 'sqrt' }); i++; continue; }
      if (c === 'π') { out.push({ t: 'id', v: 'pi' }); i++; continue; }
      const name = NAMES.find((w) => s.startsWith(w, i));
      if (!name) throw new Error(`Unexpected "${c}"`);
      out.push({ t: 'id', v: name });
      i += name.length;
    }
    return out;
  }

  // ---------- Math helpers ----------
  function factorial(n) {
    if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error('n! needs a whole number from 0 to 170');
    let r = 1;
    for (let k = 2; k <= n; k++) r *= k;
    return r;
  }

  function fn(name, a) {
    const toRad = deg ? Math.PI / 180 : 1;
    const toUnit = deg ? 180 / Math.PI : 1;
    const clean = (x) => (Math.abs(x) < 1e-14 ? 0 : x);
    switch (name) {
      case 'sin': return clean(Math.sin(a * toRad));
      case 'cos': return clean(Math.cos(a * toRad));
      case 'tan':
        if (Math.abs(Math.cos(a * toRad)) < 1e-12) throw new Error('tan is undefined at this angle');
        return clean(Math.tan(a * toRad));
      case 'asin':
      case 'acos':
        if (Math.abs(a) > 1) throw new Error(`${name} needs a value from -1 to 1`);
        return (name === 'asin' ? Math.asin(a) : Math.acos(a)) * toUnit;
      case 'atan': return Math.atan(a) * toUnit;
      case 'sinh': return Math.sinh(a);
      case 'cosh': return Math.cosh(a);
      case 'tanh': return Math.tanh(a);
      case 'log':
      case 'ln':
        if (a <= 0) throw new Error(`${name} needs a positive number`);
        return name === 'log' ? Math.log10(a) : Math.log(a);
      case 'sqrt':
        if (a < 0) throw new Error('√ needs a number of 0 or more');
        return Math.sqrt(a);
      case 'cbrt': return Math.cbrt(a);
      case 'abs': return Math.abs(a);
      case 'exp': return Math.exp(a);
    }
    throw new Error(`Unknown function ${name}`);
  }

  // ---------- Parser (recursive descent) ----------
  // expr   := term (('+'|'-') term)*
  // term   := unary (('*'|'/'|implicit) unary)*
  // unary  := ('-'|'+') unary | power
  // power  := postfix ('^' unary)?
  // postfix:= primary ('!'|'%')*
  function evaluate(src) {
    const tk = tokenize(src);
    let p = 0;
    const peek = () => tk[p];
    const isOp = (v) => peek() && peek().t === 'op' && peek().v === v;
    const startsFactor = () => peek() && (peek().t === 'num' || peek().t === 'id' || peek().t === '(');
    const close = () => {
      if (!peek() || peek().t !== ')') throw new Error('Missing )');
      p++;
    };

    function parseExpr() {
      let v = term();
      while (isOp('+') || isOp('-')) {
        const o = tk[p++].v;
        const r = term();
        v = o === '+' ? v + r : v - r;
      }
      return v;
    }
    function term() {
      let v = unary();
      for (;;) {
        if (isOp('*')) { p++; v *= unary(); }
        else if (isOp('/')) {
          p++;
          const r = unary();
          if (r === 0) throw new Error('Cannot divide by zero');
          v /= r;
        }
        else if (startsFactor()) v *= unary(); // implicit: 2π, 3(4+1)
        else return v;
      }
    }
    function unary() {
      if (isOp('-')) { p++; return -unary(); }
      if (isOp('+')) { p++; return unary(); }
      return power();
    }
    function power() {
      const b = postfix();
      if (isOp('^')) { p++; return Math.pow(b, unary()); }
      return b;
    }
    function postfix() {
      let v = primary();
      for (;;) {
        if (isOp('!')) { p++; v = factorial(v); }
        else if (isOp('%')) { p++; v /= 100; }
        else return v;
      }
    }
    function primary() {
      const k = tk[p++];
      if (!k) throw new Error('Incomplete expression');
      if (k.t === 'num') return k.v;
      if (k.t === '(') { const v = parseExpr(); close(); return v; }
      if (k.t === 'id') {
        if (k.v === 'pi') return Math.PI;
        if (k.v === 'e') return Math.E;
        if (k.v === 'Ans') return ans;
        if (!peek() || peek().t !== '(') throw new Error(`${k.v} needs brackets, like ${k.v}(…)`);
        p++;
        const a = parseExpr();
        close();
        return fn(k.v, a);
      }
      throw new Error(`Unexpected "${k.t === 'op' ? k.v : k.t}"`);
    }

    const result = parseExpr();
    if (p < tk.length) throw new Error(`Unexpected "${tk[p].t === 'op' ? tk[p].v : tk[p].t}"`);
    return result;
  }

  function format(v) {
    if (!Number.isFinite(v)) throw new Error('Result is out of range');
    v = parseFloat(v.toPrecision(12));
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 1e12 || a < 1e-6) {
      const [m, e] = v.toExponential().split('e');
      return `${m}×10^${parseInt(e, 10)}`;
    }
    return String(v);
  }

  const autoClose = (s) => s + ')'.repeat(Math.max(0, (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length));

  // ---------- Actions ----------
  const NEW_VALUE = /^(\d|\.|π|√|\(|[A-Za-z])/;

  function insert(t) {
    if (t === '-') t = '−';
    error = '';
    if (justEvaluated) {
      if (NEW_VALUE.test(t)) { expr = ''; prevEl.textContent = ''; }
      justEvaluated = false;
    }
    expr += t;
    render();
  }

  function equals() {
    if (!expr) return;
    const src = autoClose(expr);
    try {
      const v = evaluate(src);
      const out = format(v);
      ans = parseFloat(v.toPrecision(12));
      history.unshift({ expr: src, result: out });
      if (history.length > 20) history.pop();
      prevEl.textContent = `${src} =`;
      expr = out;
      error = '';
      justEvaluated = true;
      renderHistory();
    } catch (err) {
      error = err.message;
    }
    render();
  }

  function clearAll() { expr = ''; error = ''; justEvaluated = false; prevEl.textContent = ''; render(); }

  function backspace() {
    if (justEvaluated) { clearAll(); return; }
    error = '';
    expr = expr.replace(/(?:asin\(|acos\(|atan\(|sinh\(|cosh\(|tanh\(|sin\(|cos\(|tan\(|log\(|ln\(|abs\(|exp\(|√\(|Ans|.)$/u, '');
    render();
  }

  function currentValue() {
    if (!expr || justEvaluated) return ans;
    return evaluate(autoClose(expr));
  }

  function memoryOp(kind) {
    try {
      if (kind === 'mc') memory = 0;
      else if (kind === 'mr') { insert(format(memory)); return; }
      else memory += (kind === 'mplus' ? 1 : -1) * currentValue();
      memory = parseFloat(memory.toPrecision(12));
      error = '';
    } catch (err) { error = err.message; }
    render();
  }

  const ACTIONS = {
    '@eq': equals,
    '@ac': clearAll,
    '@back': backspace,
    '@deg': () => { deg = !deg; render(); },
    '@mc': () => memoryOp('mc'),
    '@mr': () => memoryOp('mr'),
    '@mplus': () => memoryOp('mplus'),
    '@mminus': () => memoryOp('mminus'),
  };

  // ---------- Rendering ----------
  function render() {
    exprEl.classList.toggle('err', Boolean(error));
    exprEl.textContent = error || expr || '0';
    exprEl.scrollLeft = exprEl.scrollWidth;
    modeEl.textContent = deg ? 'DEG' : 'RAD';
    memEl.hidden = memory === 0;
  }

  function renderHistory() {
    const list = $('history');
    list.textContent = '';
    history.forEach((h) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      const small = document.createElement('small');
      small.textContent = h.expr;
      const span = document.createElement('span');
      span.textContent = h.result;
      b.append(small, span);
      b.addEventListener('click', () => insert(h.result));
      li.appendChild(b);
      list.appendChild(li);
    });
    $('empty').hidden = history.length > 0;
  }

  // ---------- Keypad ----------
  const FN_KEYS = [
    [['DEG', '@deg', 'mem'], ['MC', '@mc', 'mem'], ['MR', '@mr', 'mem'], ['M+', '@mplus', 'mem'], ['M−', '@mminus', 'mem']],
    [['sin', 'sin('], ['cos', 'cos('], ['tan', 'tan('], ['(', '('], [')', ')']],
    [['asin', 'asin('], ['acos', 'acos('], ['atan', 'atan('], ['xʸ', '^'], ['√', '√(']],
    [['log', 'log('], ['ln', 'ln('], ['eˣ', 'exp('], ['x²', '^2'], ['x⁻¹', '^(−1)']],
    [['π', 'π'], ['e', 'e'], ['Ans', 'Ans'], ['|x|', 'abs('], ['n!', '!']],
  ];
  const PAD_KEYS = [
    [['AC', '@ac', 'clear'], ['⌫', '@back', 'clear'], ['%', '%', 'op'], ['÷', '÷', 'op']],
    [['7', '7', 'num'], ['8', '8', 'num'], ['9', '9', 'num'], ['×', '×', 'op']],
    [['4', '4', 'num'], ['5', '5', 'num'], ['6', '6', 'num'], ['−', '−', 'op']],
    [['1', '1', 'num'], ['2', '2', 'num'], ['3', '3', 'num'], ['+', '+', 'op']],
    [['0', '0', 'num'], ['.', '.', 'num'], ['EXP', '×10^', 'fn'], ['=', '@eq', 'eq']],
  ];

  function buildKeys(container, rows) {
    rows.flat().forEach(([label, value, cls = 'fn']) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `key ${cls}`;
      b.textContent = label;
      b.addEventListener('click', () => (value.startsWith('@') ? ACTIONS[value]() : insert(value)));
      container.appendChild(b);
    });
  }

  // ---------- Keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9.+\-()^!%]$/.test(k)) insert(k);
    else if (k === '*') insert('×');
    else if (k === '/') { e.preventDefault(); insert('÷'); }
    else if (k === 'Enter' || k === '=') { e.preventDefault(); equals(); }
    else if (k === 'Backspace') backspace();
    else if (k === 'Escape') clearAll();
    else if (k === 'p') insert('π');
    else if (k === 'e') insert('e');
  });

  $('clearHistory').addEventListener('click', () => { history.length = 0; renderHistory(); });

  buildKeys($('fn'), FN_KEYS);
  buildKeys($('pad'), PAD_KEYS);
  renderHistory();
  render();
})();
