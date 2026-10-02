# Fly Fishing Log

A static HTML/CSS/JavaScript fishing journal that produces a purpose-designed, single-page Letter PDF directly in your browser. No backend, build step, Python, Node, database, or account is required to use the app.

## Run locally

Open `index.html` in a modern browser. All scripts and fonts are local, so this also works offline. For testing over HTTP, optionally run `python3 -m http.server 8000` and visit http://127.0.0.1:8000.

## Publish manually on GitHub Pages

1. Create a GitHub repository (public for GitHub Free).
2. Upload `index.html`, the complete `static/` folder, and `.nojekyll` to the repository root. Keep the folder structure intact. README.md is optional.
3. Open the repository's **Settings → Pages**.
4. Set Source to **Deploy from a branch**; select **main** and **/(root)**, then Save.
5. Wait for deployment. GitHub shows your published URL on the Pages settings screen.

The official instructions are at https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site.

All asset links are relative, so both username.github.io sites and username.github.io/repository-name project sites work. No secrets or environment variables are needed.

## Files to publish

```text
index.html
.nojekyll
static/
├── css/style.css
├── js/app.js
├── js/pdf.js
└── vendor/
    ├── jspdf.umd.min.js
    └── jspdf-LICENSE.txt
```

The older Flask files (`app.py`, `fields.py`, `pdf/`, `templates/`, `requirements.txt`, Python tests) are retained for reference. They are not required for hosting. The static page is now the app's entry point.

## How it works

Date and location are required; everything else is optional. Start with three fly rows, add/remove up to 50, and select multiple fishing methods. Preview opens the PDF in another tab, Export downloads it, and Print opens the report for printing through the PDF viewer. Clear Form asks for confirmation.

`static/js/pdf.js` creates vector text and tables with jsPDF 3.0.4, bundled locally under its MIT license. It measures and reflows all fields, reducing font size, line spacing, and padding only when needed to fit exactly one Letter page. Nothing is truncated. Very large entries can produce small print. Fields allow 200 characters and each notes field 12,000 characters. Standard PDF fonts support Western Latin text best.

## Privacy

Form data and PDF bytes stay in browser memory. No fetch requests, uploads, cookies, localStorage, sessions, analytics, or cloud storage are used. Refreshing clears the form. Explicitly saved downloads remain on your computer; close preview tabs when finished. GitHub serves the app's files but receives no fishing entries. A Content Security Policy blocks outgoing fetch/XHR requests and form submission.

## Modify

Change the earth-tone palette in `static/css/style.css` under `:root`. Edit field controls in `index.html` and PDF labels/section mappings in `static/js/pdf.js`. No compilation is required.

## Verification

Browser checks confirmed initial loading without Flask, adding/removing fly rows, preview, export action, print opening the PDF, refresh reset, no console errors, and a 390px mobile layout without page overflow. The in-app browser does not expose reliable completed download events; generated PDF bytes were separately saved, opened, rendered, and inspected. Physical printing was not tested.

An optional developer check is `node tests/test_static.cjs` (uses only the bundled library and Node built-ins; no npm install). It tests one-page sample/long/extreme reports, sanitized filenames, and absence of network submission. PDF inspection also verified ending text and page bounds. Node is not required to use or host the app.

## Testing shortcut

Press **Option + Shift + T** on macOS, or **Alt + Shift + T** on Windows/Linux, to replace the current form with the supplied Bozeman / Mill Creek example (September 23, 2026). This fills the PDF values, two flies, methods, and rating, leaving fields absent from the PDF blank. It works while a field is focused. The fixed sample is bundled in app.js; it does not read files or save your edits. Clear Form still resets everything.

## Multiple equipment sets

Use + ADD EQUIPMENT for additional rod/reel/line/leader/tippet sets. Select methods independently for each set; multiple methods are allowed. Added sets can be removed. Up to 20 sets are supported. Clear Form and the testing shortcut reset to one set. All populated sets and their methods appear in the single-page PDF.
