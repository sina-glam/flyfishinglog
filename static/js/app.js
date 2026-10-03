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
const equipmentSets = document.querySelector('#equipment-sets');
const addEquipmentButton = document.querySelector('#add-equipment');
const equipmentTemplate = equipmentSets.firstElementChild.cloneNode(true);
let equipmentId = 1;
function updateEquipment() {
  [...equipmentSets.children].forEach((set, index) => {
    set.querySelector('h3').textContent = `Equipment Set ${index + 1}`;
    const remove = set.querySelector('.remove-equipment');
    if (remove) remove.setAttribute('aria-label', `Remove equipment set ${index + 1}`);
  });
  addEquipmentButton.disabled = equipmentSets.children.length >= 20;
}
addEquipmentButton.addEventListener('click', () => {
  if (equipmentSets.children.length >= 20) return;
  const set = equipmentTemplate.cloneNode(true);
  const id = ++equipmentId;
  set.querySelectorAll('input').forEach(input => {
    if (input.type === 'checkbox') input.checked = false;
    else {
      const name = input.name;
      input.dataset.equipmentField = name;
      input.value = '';
      input.id = `${name}-equipment-${id}`;
      set.querySelector(`label[for="${name}"]`).htmlFor = input.id;
    }
    input.name = `equipment-${id}-${input.name}`;
  });
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'remove-equipment'; button.textContent = 'REMOVE SET';
  set.querySelector('.equipment-set-title').append(button);
  equipmentSets.append(set); updateEquipment();
  set.querySelector('input').focus();
  document.querySelector('#equipment-status').textContent = 'Equipment set added.';
});
equipmentSets.addEventListener('click', event => {
  const remove = event.target.closest('.remove-equipment');
  if (!remove) return;
  const set = remove.closest('.equipment-set');
  const next = set.nextElementSibling || set.previousElementSibling;
  set.remove(); updateEquipment();
  next.querySelector('input').focus();
  document.querySelector('#equipment-status').textContent = 'Equipment set removed.';
});
function blank() {
  equipmentSets.querySelectorAll('.equipment-set').forEach((set, index) => { if (index) set.remove(); });
  updateEquipment();
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

// Developer convenience: Option/Alt + Shift + T loads the supplied PDF example.
// Use event.code because Option on macOS changes the character produced by T.
const testTrip = {
  date: '2026-09-23', location: 'Demo River', area: 'Fictional Access Point', latitude: '45.123456', longitude: '-110.123456', flow: '320', water_level: 'Normal', gauge: 'Fictional upstream gauge', learned: 'Adjust depth before changing flies.',
  start: '14:30', end: '17:30', partners: 'Demo Angler A, Demo Angler B',
  water_type: 'Stream', weather: 'Snow', air_temp: '75', water_temp: '56',
  clarity: 'Clear', wind: 'Light', rod: 'Redington Path 5WT',
  reel: 'Redington Run 5wt',
  line: 'Scientific Anglers Amplitude Textured Trout Standard Fly Line',
  leader: '9ft, 5X', tippet: '1 foot', total: '3',
  species: 'Cutthroat trouts', largest: 'Cutthroat trouts', length: '13',
  best_fly: 'Caddis', best_water: 'Pool', didnt: "Nymph didn't work"
};
function populateTestTrip() {
  blank();
  for (const [name, value] of Object.entries(testTrip)) {
    form.elements.namedItem(name).value = value;
  }
  form.querySelectorAll('input[name="methods"]').forEach(input => {
    input.checked = ['Dry Fly', 'Euro Nymphing'].includes(input.value);
  });
  form.querySelector('input[name="rating"][value="8"]').checked = true;
  const flies = [
    ['Caddis', '18', 'Beige', 'Dry', '2 trouts'],
    ['Ant', '16', 'Black/red', 'Dry', '1 trout']
  ];
  flies.forEach((values, index) => {
    rows.children[index].querySelectorAll('input').forEach((input, column) => {
      input.value = values[column];
    });
  });
  message.textContent = 'Fictional test trip loaded. Ready to preview or export.';
}
window.addEventListener('keydown', event => {
  if (event.code === 'KeyT' && event.altKey && event.shiftKey &&
      !event.ctrlKey && !event.metaKey && !event.repeat && !event.isComposing) {
    event.preventDefault();
    populateTestTrip();
  }
});
