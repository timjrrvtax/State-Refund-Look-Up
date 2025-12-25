const selectEl = document.getElementById('stateSelect');
const goButton = document.getElementById('goButton');
const notesEl = document.getElementById('notes');

let states = [];

// Simple CSV parser for this specific file format
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const header = lines.shift().split(',');
  return lines.map(line => {
    // Handle basic quoted fields with commas
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current);

    const obj = {};
    header.forEach((key, idx) => {
      obj[key.trim()] = (values[idx] || '').trim();
    });
    return obj;
  });
}

async function loadStates() {
  try {
    const res = await fetch('states_refund_links.csv');
    const text = await res.text();
    states = parseCSV(text);

    states.forEach(state => {
      const opt = document.createElement('option');
      opt.value = state.state_code;
      opt.textContent = state.state_name;
      selectEl.appendChild(opt);
    });
  } catch (e) {
    console.error('Error loading CSV', e);
  }
}

goButton.addEventListener('click', () => {
  const code = selectEl.value;
  if (!code) return;

  const state = states.find(s => s.state_code === code);
  if (!state || !state.refund_url) return;

  if (state.notes) {
    notesEl.textContent = `Notes: ${state.notes}`;
  } else {
    notesEl.textContent = '';
  }

  window.open(state.refund_url, '_blank', 'noopener');
});

loadStates();
