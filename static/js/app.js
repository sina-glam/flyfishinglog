const form = document.querySelector('#log-form');
const rows = document.querySelector('#fly-rows');
const addButton = document.querySelector('#add-fly');
const message = document.querySelector('#message');
const urls = new Set();
function renumber() {
  [...rows.children].forEach((row, index) => {
    row.querySelectorAll('input').forEach(input => input.setAttribute('aria-label', `${input.name.replace('[]', '')}, fly ${index + 1}`));
    row.querySelector('button').setAttribute('aria-label', `Remove fly ${index + 1}`);
  });
  addButton.disabled = rows.children.length >= 50;
}
function addRow(focus = false) {
  if (rows.children.length >= 50) return;
  rows.append(document.querySelector('#fly-template').content.cloneNode(true));
  renumber();
  if (focus) rows.lastElementChild.querySelector('input').focus();
}
function blank() {
  form.reset();
  rows.replaceChildren();
  for (let i = 0; i < 3; i++) addRow();
  message.textContent = '';
}
blank();
// Prevent browser history restoration from retaining a previous trip.
window.addEventListener('pageshow', event => { if (event.persisted) blank(); });
addButton.addEventListener('click', () => addRow(true));
rows.addEventListener('click', event => {
  const button = event.target.closest('.remove');
  if (!button) return;
  const row = button.closest('tr');
  const next = row.nextElementSibling || row.previousElementSibling;
  row.remove(); renumber();
  (next ? next.querySelector('input') : addButton).focus();
  document.querySelector('#fly-status').textContent = 'Fly removed.';
});
document.querySelector('#clear').addEventListener('click', () => {
  if (confirm('Clear this trip? Unsaved information will be lost.')) {
    blank(); urls.forEach(url => URL.revokeObjectURL(url)); urls.clear();
    document.querySelector('#date').focus();
  }
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  const action = event.submitter?.value || 'export';
  // Open synchronously to avoid popup blockers during PDF generation.
  const preview = action !== 'export' ? window.open('about:blank', '_blank') : null;
  if (action !== 'export' && !preview) {
    message.textContent = 'Allow a new tab in your browser to preview or print the PDF.'; return;
  }
  if (preview) { preview.opener = null; preview.document.body.textContent = 'Preparing your fishing report…'; }
  const data = new FormData(form); data.set('action', action);
  const buttons = form.querySelectorAll('button[type="submit"]');
  buttons.forEach(button => button.disabled = true);
  message.textContent = 'Preparing your fishing report…';
  try {
    const report = FishingPDF.generate(FishingPDF.readForm(form));
    const blob = report.output('blob');
    const url = URL.createObjectURL(blob); urls.add(url);
    if (action === 'export') {
      const link = document.createElement('a'); link.href = url;
      link.download = FishingPDF.filename(data.get('date'), data.get('location'));
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => { URL.revokeObjectURL(url); urls.delete(url); }, 60000);
      message.textContent = 'Your PDF is ready. Check your browser downloads.';
    } else {
      preview.location.replace(url);
      message.textContent = action === 'print' ? 'Report opened. Use the PDF viewer’s Print button (or Ctrl/Cmd + P).' : 'Preview opened in a new tab. Save or print from the PDF viewer.';
    }
  } catch (error) {
    preview?.close(); message.textContent = error.message;
  } finally { buttons.forEach(button => button.disabled = false); }
});
