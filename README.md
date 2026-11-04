# Warren Calculator

A scientific calculator built with plain HTML, CSS and JavaScript. No frameworks, no build step, and no `eval()`: expressions are read by a small recursive-descent parser, so operator precedence is correct and input is safe.

## Features

- Basic arithmetic with correct order of operations and brackets (open brackets close automatically on `=`)
- Trigonometry: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, plus `sinh`, `cosh`, `tanh`
- Degrees / radians toggle
- `log`, `ln`, `eˣ`, `xʸ`, `x²`, `x⁻¹`, `√`, `|x|`, `n!`, `%`, `π`, `e`
- `Ans` (last result) and memory keys: `MC`, `MR`, `M+`, `M−`
- `EXP` for scientific notation (for example `4.5×10^3`)
- Implicit multiplication (`2π`, `3(4+1)`)
- History panel: select an entry to reuse its result
- Clear error messages (divide by zero, domain errors, missing brackets)
- Full keyboard support and a layout that works on phones

## Run it

Open `index.html` in any modern browser.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `0-9` `.` `+` `-` `*` `/` `^` `(` `)` `!` `%` | Type as shown |
| `p` / `e` | Insert π / e |
| `Enter` or `=` | Calculate |
| `Backspace` | Delete last item |
| `Esc` | Clear everything |

## Publish with GitHub Pages

1. Push this folder to a GitHub repository (see below).
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. Your calculator goes live at `https://<your-username>.github.io/warren-calculator/`.

## Push to GitHub

```bash
cd warren-calculator
git init
git add .
git commit -m "Add Warren Calculator"
git branch -M main
git remote add origin https://github.com/<your-username>/warren-calculator.git
git push -u origin main
```

## Project structure

```
warren-calculator/
├── index.html   # page structure
├── style.css    # look and layout
├── script.js    # parser, calculator logic, keypad, keyboard input
└── README.md
```

## License

MIT. Use it, change it, learn from it.
