// Base URL for API calls – adjust PORT if you change it in server.js/.env
const API_BASE = '';

// Cached DOM elements
const formationsListEl = document.getElementById('formations-list');
const formationsLoadingEl = document.getElementById('formations-loading');
const formationForm = document.getElementById('formation-form');
const formationNameInput = document.getElementById('formation-name');
const formationPersonnelInput = document.getElementById('formation-personnel');
const formationDescriptionInput = document.getElementById('formation-description');
const formationResetBtn = document.getElementById('formation-reset-btn');
const formationDeleteBtn = document.getElementById('formation-delete-btn');
const formationMessageEl = document.getElementById('formation-message');

const playsFormationFilter = document.getElementById('plays-formation-filter');
const playsTypeFilter = document.getElementById('plays-type-filter');
const playsSearchInput = document.getElementById('plays-search');
const playsListEl = document.getElementById('plays-list');
const playsLoadingEl = document.getElementById('plays-loading');

const playForm = document.getElementById('play-form');
const playFormationSelect = document.getElementById('play-formation-select');
const playNameInput = document.getElementById('play-name');
const playTypeSelect = document.getElementById('play-type');
const playNotesInput = document.getElementById('play-notes');
const playResetBtn = document.getElementById('play-reset-btn');
const playDeleteBtn = document.getElementById('play-delete-btn');
const playMessageEl = document.getElementById('play-message');

const assignmentsListEl = document.getElementById('assignments-list');
const assignmentsLoadingEl = document.getElementById('assignments-loading');
const assignmentForm = document.getElementById('assignment-form');
const assignmentPlayNameInput = document.getElementById('assignment-play-name');
const assignmentPositionInput = document.getElementById('assignment-position');
const assignmentTextInput = document.getElementById('assignment-text');
const assignmentSaveBtn = document.getElementById('assignment-save-btn');
const assignmentResetBtn = document.getElementById('assignment-reset-btn');
const assignmentDeleteBtn = document.getElementById('assignment-delete-btn');
const assignmentMessageEl = document.getElementById('assignment-message');

const globalToast = document.getElementById('global-toast');

// In-memory UI state
let formations = [];
let plays = [];
let assignments = [];

let selectedFormationId = null;
let editingFormationId = null;

let selectedPlayId = null;
let editingPlayId = null;

let editingAssignmentId = null;

// Helper: show small toast message
function showToast(message, type = 'success') {
  if (!globalToast) return;
  globalToast.textContent = message;
  globalToast.className = `toast visible ${type}`;
  setTimeout(() => {
    globalToast.classList.remove('visible');
  }, 2200);
}

// Helper: set inline message text on forms
function setInlineMessage(el, message, type) {
  if (!el) return;
  el.textContent = message || '';
  el.classList.remove('success', 'error');
  if (message && type) {
    el.classList.add(type);
  }
}

// Generic wrapper around fetch with JSON + error handling
async function apiRequest(path, options = {}) {
  const url = API_BASE + path;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody.error || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    // Some endpoints (DELETE) return no content
    if (res.status === 204) return null;
    return await res.json();
  } catch (err) {
    console.error('API error:', err);
    throw err;
  }
}

// ------- Formations -------

async function loadFormations() {
  formationsLoadingEl.textContent = 'Loading formations...';
  try {
    formations = await apiRequest('/api/formations');
    renderFormations();
    populateFormationSelects();
    formationsLoadingEl.textContent =
      formations.length === 0 ? 'No formations yet. Create one above.' : '';
  } catch (err) {
    formationsLoadingEl.textContent = 'Failed to load formations.';
    showToast(err.message, 'error');
  }
}

function renderFormations() {
  formationsListEl.innerHTML = '';
  formations.forEach((f) => {
    const li = document.createElement('li');
    li.className = 'item';
    if (f.formation_id === selectedFormationId) {
      li.classList.add('selected');
    }
    li.innerHTML = `
      <div class="item-title">${f.name}</div>
      <div class="item-meta">
        ${f.personnel || 'No personnel'} • ${
      f.description ? f.description.slice(0, 40) : 'No description'
    }
      </div>
    `;
    li.addEventListener('click', () => {
      selectedFormationId = f.formation_id;
      editingFormationId = f.formation_id;
      fillFormationForm(f);
      renderFormations();
      populateFormationSelects();
      applyPlayFilters();
    });
    formationsListEl.appendChild(li);
  });
}

function fillFormationForm(f) {
  formationNameInput.value = f.name || '';
  formationPersonnelInput.value = f.personnel || '';
  formationDescriptionInput.value = f.description || '';
  formationDeleteBtn.disabled = false;
  setInlineMessage(formationMessageEl, '', null);
}

function resetFormationForm() {
  formationForm.reset();
  editingFormationId = null;
  formationDeleteBtn.disabled = true;
  setInlineMessage(formationMessageEl, '', null);
}

formationForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = formationNameInput.value.trim();
  const personnel = formationPersonnelInput.value.trim();
  const description = formationDescriptionInput.value.trim();

  if (!name) {
    setInlineMessage(formationMessageEl, 'Name is required.', 'error');
    return;
  }

  const payload = { name, personnel, description };
  try {
    let saved;
    if (editingFormationId) {
      saved = await apiRequest(`/api/formations/${editingFormationId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Formation updated.', 'success');
    } else {
      saved = await apiRequest('/api/formations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Formation created.', 'success');
      selectedFormationId = saved.formation_id;
    }
    // Refresh list from server to keep in sync
    await loadFormations();
    editingFormationId = saved.formation_id;
    setInlineMessage(formationMessageEl, 'Saved successfully.', 'success');
  } catch (err) {
    setInlineMessage(formationMessageEl, err.message, 'error');
    showToast(err.message, 'error');
  }
});

formationResetBtn.addEventListener('click', () => {
  resetFormationForm();
});

formationDeleteBtn.addEventListener('click', async () => {
  if (!editingFormationId) return;
  if (!confirm('Delete this formation and all its plays/assignments?')) return;
  try {
    await apiRequest(`/api/formations/${editingFormationId}`, { method: 'DELETE' });
    showToast('Formation deleted.', 'success');
    editingFormationId = null;
    selectedFormationId = null;
    resetFormationForm();
    await loadFormations();
    await loadPlays(); // plays are cascade-deleted
    clearAssignmentsSection();
  } catch (err) {
    setInlineMessage(formationMessageEl, err.message, 'error');
    showToast(err.message, 'error');
  }
});

// ------- Plays -------

function populateFormationSelects() {
  // Used in filter and create/edit play form
  const allOptionHtml = '<option value="">All formations</option>';
  playsFormationFilter.innerHTML = allOptionHtml;
  formations.forEach((f) => {
    const opt = document.createElement('option');
    opt.value = String(f.formation_id);
    opt.textContent = f.name;
    if (selectedFormationId && f.formation_id === selectedFormationId) {
      opt.selected = true;
    }
    playsFormationFilter.appendChild(opt);
  });

  playFormationSelect.innerHTML = '';
  formations.forEach((f) => {
    const opt = document.createElement('option');
    opt.value = String(f.formation_id);
    opt.textContent = f.name;
    playFormationSelect.appendChild(opt);
  });

  if (selectedFormationId) {
    playFormationSelect.value = String(selectedFormationId);
  }
}

async function loadPlays() {
  playsLoadingEl.textContent = 'Loading plays...';
  try {
    // Initially load all plays; filtering is done client-side
    plays = await apiRequest('/api/plays');
    applyPlayFilters();
  } catch (err) {
    playsLoadingEl.textContent = 'Failed to load plays.';
    showToast(err.message, 'error');
  }
}

function applyPlayFilters() {
  const formationIdFilter = playsFormationFilter.value;
  const typeFilter = playsTypeFilter.value;
  const searchTerm = playsSearchInput.value.trim().toLowerCase();

  let filtered = [...plays];
  if (formationIdFilter) {
    const idNum = Number(formationIdFilter);
    filtered = filtered.filter((p) => p.formation_id === idNum);
  }
  if (typeFilter) {
    filtered = filtered.filter((p) => p.play_type === typeFilter);
  }
  if (searchTerm) {
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchTerm));
  }

  renderPlays(filtered);
}

function renderPlays(list) {
  playsListEl.innerHTML = '';
  if (!list.length) {
    playsLoadingEl.textContent = 'No plays match the current filters.';
  } else {
    playsLoadingEl.textContent = '';
  }

  list.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'item';
    if (p.play_id === selectedPlayId) {
      li.classList.add('selected');
    }
    const formationName =
      formations.find((f) => f.formation_id === p.formation_id)?.name || 'Unknown';
    li.innerHTML = `
      <div class="item-title">${p.name}</div>
      <div class="item-meta">
        ${formationName} • ${p.play_type.toUpperCase()} ${
      p.notes ? '• ' + p.notes.slice(0, 40) : ''
    }
      </div>
    `;
    li.addEventListener('click', async () => {
      selectedPlayId = p.play_id;
      editingPlayId = p.play_id;
      fillPlayForm(p);
      renderPlays(list);
      await loadAssignmentsForSelectedPlay();
    });
    playsListEl.appendChild(li);
  });
}

function fillPlayForm(p) {
  playFormationSelect.value = String(p.formation_id);
  playNameInput.value = p.name || '';
  playTypeSelect.value = p.play_type || 'run';
  playNotesInput.value = p.notes || '';
  playDeleteBtn.disabled = false;
  setInlineMessage(playMessageEl, '', null);
}

function resetPlayForm() {
  playForm.reset();
  editingPlayId = null;
  playDeleteBtn.disabled = true;
  setInlineMessage(playMessageEl, '', null);
}

playForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formationId = Number(playFormationSelect.value);
  const name = playNameInput.value.trim();
  const playType = playTypeSelect.value;
  const notes = playNotesInput.value.trim();

  if (!formationId || !name || !playType) {
    setInlineMessage(playMessageEl, 'Formation, name, and type are required.', 'error');
    return;
  }

  const payload = { formation_id: formationId, name, play_type: playType, notes };

  try {
    let saved;
    if (editingPlayId) {
      saved = await apiRequest(`/api/plays/${editingPlayId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Play updated.', 'success');
    } else {
      saved = await apiRequest('/api/plays', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Play created.', 'success');
    }
    selectedPlayId = saved.play_id;
    editingPlayId = saved.play_id;
    await loadPlays();
    await loadAssignmentsForSelectedPlay();
    setInlineMessage(playMessageEl, 'Saved successfully.', 'success');
  } catch (err) {
    setInlineMessage(playMessageEl, err.message, 'error');
    showToast(err.message, 'error');
  }
});

playResetBtn.addEventListener('click', () => {
  resetPlayForm();
});

playDeleteBtn.addEventListener('click', async () => {
  if (!editingPlayId) return;
  if (!confirm('Delete this play and all of its assignments?')) return;
  try {
    await apiRequest(`/api/plays/${editingPlayId}`, { method: 'DELETE' });
    showToast('Play deleted.', 'success');
    editingPlayId = null;
    selectedPlayId = null;
    resetPlayForm();
    await loadPlays();
    clearAssignmentsSection();
  } catch (err) {
    setInlineMessage(playMessageEl, err.message, 'error');
    showToast(err.message, 'error');
  }
});

playsFormationFilter.addEventListener('change', applyPlayFilters);
playsTypeFilter.addEventListener('change', applyPlayFilters);
playsSearchInput.addEventListener('input', () => {
  // Small debounce for better UX on typing
  clearTimeout(playsSearchInput._debounce);
  playsSearchInput._debounce = setTimeout(applyPlayFilters, 200);
});

// ------- Assignments -------

async function loadAssignmentsForSelectedPlay() {
  if (!selectedPlayId) {
    clearAssignmentsSection();
    return;
  }
  assignmentsLoadingEl.textContent = 'Loading assignments...';
  assignmentsListEl.innerHTML = '';
  try {
    assignments = await apiRequest(`/api/assignments?play_id=${selectedPlayId}`);
    renderAssignments();
    const playName = plays.find((p) => p.play_id === selectedPlayId)?.name || '';
    assignmentPlayNameInput.value = playName;
    assignmentSaveBtn.disabled = false;
    assignmentsLoadingEl.textContent =
      assignments.length === 0 ? 'No assignments yet. Create one above.' : '';
  } catch (err) {
    assignmentsLoadingEl.textContent = 'Failed to load assignments.';
    showToast(err.message, 'error');
  }
}

function renderAssignments() {
  assignmentsListEl.innerHTML = '';
  assignments.forEach((a) => {
    const li = document.createElement('li');
    li.className = 'item';
    if (a.assignment_id === editingAssignmentId) {
      li.classList.add('selected');
    }
    li.innerHTML = `
      <div class="item-title">${a.position}</div>
      <div class="item-meta">${a.assignment_text}</div>
    `;
    li.addEventListener('click', () => {
      editingAssignmentId = a.assignment_id;
      fillAssignmentForm(a);
      renderAssignments();
    });
    assignmentsListEl.appendChild(li);
  });
}

function fillAssignmentForm(a) {
  assignmentPositionInput.value = a.position || '';
  assignmentTextInput.value = a.assignment_text || '';
  assignmentDeleteBtn.disabled = false;
  assignmentSaveBtn.disabled = false;
  setInlineMessage(assignmentMessageEl, '', null);
}

function resetAssignmentForm() {
  assignmentForm.reset();
  assignmentDeleteBtn.disabled = true;
  editingAssignmentId = null;
  if (!selectedPlayId) {
    assignmentSaveBtn.disabled = true;
  }
  setInlineMessage(assignmentMessageEl, '', null);
}

function clearAssignmentsSection() {
  assignments = [];
  assignmentsListEl.innerHTML = '';
  assignmentsLoadingEl.textContent = 'No play selected.';
  assignmentPlayNameInput.value = '';
  resetAssignmentForm();
}

assignmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedPlayId) {
    setInlineMessage(assignmentMessageEl, 'Select a play first.', 'error');
    return;
  }
  const position = assignmentPositionInput.value.trim();
  const assignmentText = assignmentTextInput.value.trim();
  if (!position || !assignmentText) {
    setInlineMessage(assignmentMessageEl, 'Position and text are required.', 'error');
    return;
  }
  const payload = {
    play_id: selectedPlayId,
    position,
    assignment_text: assignmentText,
  };
  try {
    if (editingAssignmentId) {
      await apiRequest(`/api/assignments/${editingAssignmentId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Assignment updated.', 'success');
    } else {
      await apiRequest('/api/assignments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Assignment created.', 'success');
    }
    setInlineMessage(assignmentMessageEl, 'Saved successfully.', 'success');
    await loadAssignmentsForSelectedPlay();
    resetAssignmentForm();
  } catch (err) {
    setInlineMessage(assignmentMessageEl, err.message, 'error');
    showToast(err.message, 'error');
  }
});

assignmentResetBtn.addEventListener('click', () => {
  resetAssignmentForm();
});

assignmentDeleteBtn.addEventListener('click', async () => {
  if (!editingAssignmentId) return;
  if (!confirm('Delete this assignment?')) return;
  try {
    await apiRequest(`/api/assignments/${editingAssignmentId}`, {
      method: 'DELETE',
    });
    showToast('Assignment deleted.', 'success');
    editingAssignmentId = null;
    await loadAssignmentsForSelectedPlay();
    resetAssignmentForm();
  } catch (err) {
    setInlineMessage(assignmentMessageEl, err.message, 'error');
    showToast(err.message, 'error');
  }
});

// ------- Initial load -------

async function init() {
  await loadFormations();
  await loadPlays();
  clearAssignmentsSection();
}

window.addEventListener('DOMContentLoaded', init);


