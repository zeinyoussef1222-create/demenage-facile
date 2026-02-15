// ============================================================
// DéménageFacile — Main Application Controller
// ============================================================

import { CATEGORIES, ORGANISMES, getOrganismesByCategorie, getPopulaires, getOrganismeById, getCategorieById } from './data.js';
import { genererTousDocuments, genererMailtoLink } from './generator.js';
import { telechargerPDF, telechargerPDFCombine } from './pdf.js';

// ── State ──────────────────────────────────────────────────
const state = {
    currentView: 'landing',
    userData: {
        prenom: '',
        nom: '',
        ancienneAdresse: '',
        nouvelleAdresse: '',
        dateDemenagement: '',
        ville: '',
    },
    selectedOrganismes: new Set(),
    documents: [],
    tracker: {}, // { orgId: 'pending' | 'sent' | 'completed' }
};

// ── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLanding();
    initFormPage();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
});

// ── Navigation ──────────────────────────────────────────────
function initNavigation() {
    const views = ['landing', 'form', 'results'];

    window.navigateTo = function (viewName) {
        views.forEach(v => {
            const el = document.getElementById(`view-${v}`);
            if (el) {
                el.classList.toggle('active', v === viewName);
            }
        });
        state.currentView = viewName;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Update nav state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });

        // Show/hide nav based on view
        const nav = document.getElementById('main-nav');
        if (nav) {
            nav.classList.toggle('nav-dark', viewName !== 'landing');
        }
    };
}

// ── Shared IntersectionObserver ──────────────────────────────
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, { threshold: 0.1 });

function observeNewElements(container) {
    (container || document).querySelectorAll('.animate-on-scroll:not(.animate-in)').forEach(el => {
        scrollObserver.observe(el);
    });
}

// ── Landing Page ────────────────────────────────────────────
function initLanding() {
    observeNewElements();

    // CTA button
    const ctaBtn = document.getElementById('cta-start');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', () => navigateTo('form'));
    }
}

// ── Form Page ───────────────────────────────────────────────
function initFormPage() {
    renderCategories();
    initFormHandlers();
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    container.innerHTML = '';

    // Quick select buttons
    const quickBar = document.createElement('div');
    quickBar.className = 'quick-select-bar';
    quickBar.innerHTML = `
    <button class="btn-quick" id="btn-select-popular">⭐ Les plus courants</button>
    <button class="btn-quick" id="btn-select-all">✅ Tout sélectionner</button>
    <button class="btn-quick" id="btn-deselect-all">❌ Tout désélectionner</button>
  `;
    container.appendChild(quickBar);

    // Counter
    const counter = document.createElement('div');
    counter.className = 'selection-counter';
    counter.id = 'selection-counter';
    counter.innerHTML = '<span>0</span> organisme(s) sélectionné(s)';
    container.appendChild(counter);

    // Categories
    CATEGORIES.forEach(cat => {
        const organismes = getOrganismesByCategorie(cat.id);
        if (organismes.length === 0) return;

        const section = document.createElement('div');
        section.className = 'category-section animate-on-scroll';
        section.innerHTML = `
      <div class="category-header" data-cat="${cat.id}">
        <div class="category-title">
          <span class="category-icon">${cat.icon}</span>
          <h3>${cat.label}</h3>
          <span class="category-count">${organismes.length}</span>
        </div>
        <button class="btn-select-category" data-cat="${cat.id}">Tout sélectionner</button>
      </div>
      <div class="category-organisms" id="cat-${cat.id}">
        ${organismes.map(org => `
          <label class="organism-card" data-id="${org.id}" style="--accent: ${cat.color}">
            <input type="checkbox" class="org-checkbox" value="${org.id}" ${org.populaire ? 'data-popular' : ''}>
            <div class="org-card-content">
              <div class="org-name">${org.nom}</div>
              <div class="org-type">${org.type === 'email' ? '📧 Email' : '✉️ Courrier'}</div>
              ${org.populaire ? '<span class="org-popular-badge">Populaire</span>' : ''}
            </div>
            <div class="org-check-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </label>
        `).join('')}
      </div>
    `;
        container.appendChild(section);
    });

    // Observe dynamically-added elements for scroll animation
    observeNewElements(container);

    // Event listeners for checkboxes
    container.querySelectorAll('.org-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.checked) {
                state.selectedOrganismes.add(cb.value);
            } else {
                state.selectedOrganismes.delete(cb.value);
            }
            updateCounter();
            cb.closest('.organism-card').classList.toggle('selected', cb.checked);
        });
    });

    // Quick select handlers
    document.getElementById('btn-select-popular')?.addEventListener('click', () => {
        container.querySelectorAll('.org-checkbox[data-popular]').forEach(cb => {
            cb.checked = true;
            state.selectedOrganismes.add(cb.value);
            cb.closest('.organism-card').classList.add('selected');
        });
        updateCounter();
    });

    document.getElementById('btn-select-all')?.addEventListener('click', () => {
        container.querySelectorAll('.org-checkbox').forEach(cb => {
            cb.checked = true;
            state.selectedOrganismes.add(cb.value);
            cb.closest('.organism-card').classList.add('selected');
        });
        updateCounter();
    });

    document.getElementById('btn-deselect-all')?.addEventListener('click', () => {
        container.querySelectorAll('.org-checkbox').forEach(cb => {
            cb.checked = false;
            cb.closest('.organism-card').classList.remove('selected');
        });
        state.selectedOrganismes.clear();
        updateCounter();
    });

    // Category select buttons
    container.querySelectorAll('.btn-select-category').forEach(btn => {
        btn.addEventListener('click', () => {
            const catId = btn.dataset.cat;
            const checkboxes = document.querySelectorAll(`#cat-${catId} .org-checkbox`);
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
                if (cb.checked) {
                    state.selectedOrganismes.add(cb.value);
                    cb.closest('.organism-card').classList.add('selected');
                } else {
                    state.selectedOrganismes.delete(cb.value);
                    cb.closest('.organism-card').classList.remove('selected');
                }
            });
            updateCounter();
        });
    });
}

function updateCounter() {
    const counter = document.getElementById('selection-counter');
    if (counter) {
        const count = state.selectedOrganismes.size;
        counter.innerHTML = `<span>${count}</span> organisme(s) sélectionné(s)`;
        counter.classList.toggle('has-selection', count > 0);
    }

    // Update generate button
    const genBtn = document.getElementById('btn-generate');
    if (genBtn) {
        genBtn.disabled = state.selectedOrganismes.size === 0;
    }
}

function initFormHandlers() {
    const form = document.getElementById('demenagement-form');
    if (!form) return;

    // Set default date to 2 weeks from now
    const dateInput = document.getElementById('date-demenagement');
    if (dateInput) {
        const twoWeeks = new Date();
        twoWeeks.setDate(twoWeeks.getDate() + 14);
        dateInput.value = twoWeeks.toISOString().split('T')[0];
    }

    // Form steps
    const steps = form.querySelectorAll('.form-step');
    let currentStep = 0;

    window.nextStep = function () {
        // Validate current step
        const currentFields = steps[currentStep].querySelectorAll('input[required], textarea[required]');
        let valid = true;
        currentFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                valid = false;
            } else {
                field.classList.remove('error');
            }
        });

        if (!valid) {
            steps[currentStep].querySelector('.step-error')?.classList.add('show');
            return;
        }
        steps[currentStep].querySelector('.step-error')?.classList.remove('show');

        if (currentStep < steps.length - 1) {
            steps[currentStep].classList.remove('active');
            currentStep++;
            steps[currentStep].classList.add('active');
            updateStepIndicators(currentStep);
        }
    };

    window.prevStep = function () {
        if (currentStep > 0) {
            steps[currentStep].classList.remove('active');
            currentStep--;
            steps[currentStep].classList.add('active');
            updateStepIndicators(currentStep);
        }
    };

    // Generate button
    document.getElementById('btn-generate')?.addEventListener('click', () => {
        if (state.selectedOrganismes.size === 0) {
            alert('Veuillez sélectionner au moins un organisme.');
            return;
        }
        generateDocuments();
    });
}

function updateStepIndicators(step) {
    document.querySelectorAll('.step-indicator').forEach((ind, i) => {
        ind.classList.toggle('active', i === step);
        ind.classList.toggle('completed', i < step);
    });

    // Smooth scroll to form top
    document.getElementById('form-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Generate Documents ──────────────────────────────────────
function generateDocuments() {
    // Collect form data
    state.userData = {
        prenom: document.getElementById('prenom').value.trim(),
        nom: document.getElementById('nom-famille').value.trim(),
        ancienneAdresse: document.getElementById('ancienne-adresse').value.trim(),
        nouvelleAdresse: document.getElementById('nouvelle-adresse').value.trim(),
        dateDemenagement: document.getElementById('date-demenagement').value,
        ville: document.getElementById('ville-actuelle').value.trim(),
    };

    // Get selected organisms
    const selectedOrgs = Array.from(state.selectedOrganismes).map(id => getOrganismeById(id)).filter(Boolean);

    // Generate all documents
    state.documents = genererTousDocuments(selectedOrgs, state.userData);

    // Initialize tracker
    state.documents.forEach(doc => {
        state.tracker[doc.organisme.id] = 'pending';
    });

    // Navigate to results
    renderResults();
    navigateTo('results');
}

// ── Results Page ────────────────────────────────────────────
function renderResults() {
    const container = document.getElementById('results-container');
    if (!container) return;

    // Stats
    const totalDocs = state.documents.length;
    const courriers = state.documents.filter(d => d.type === 'courrier' || d.organisme.adresse).length;
    const emails = totalDocs - courriers;

    container.innerHTML = `
    <div class="results-header">
      <div class="results-celebration">🎉</div>
      <h2>Vos documents sont prêts !</h2>
      <p>Nous avons généré <strong>${totalDocs} document(s)</strong> pour votre déménagement.</p>
    </div>

    <div class="results-stats">
      <div class="stat-card">
        <div class="stat-icon">✉️</div>
        <div class="stat-number">${courriers}</div>
        <div class="stat-label">Courrier(s)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📧</div>
        <div class="stat-number">${emails}</div>
        <div class="stat-label">Email(s)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-number" id="completion-percent">0%</div>
        <div class="stat-label">Complété</div>
      </div>
    </div>

    <div class="results-actions">
      <button class="btn-primary btn-glow" id="btn-download-all" title="Télécharger tous les courriers en un seul PDF">
        📥 Télécharger tous les PDF
      </button>
      <button class="btn-secondary" id="btn-new-session">
        🔄 Nouveau déménagement
      </button>
    </div>

    <div class="progress-bar-container">
      <div class="progress-label">Avancement global</div>
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
      </div>
    </div>

    <div class="documents-list" id="documents-list">
      ${state.documents.map((doc, index) => renderDocumentCard(doc, index)).join('')}
    </div>
  `;

    // Event listeners
    document.getElementById('btn-download-all')?.addEventListener('click', () => {
        telechargerPDFCombine(state.documents, state.userData);
    });

    document.getElementById('btn-new-session')?.addEventListener('click', () => {
        state.selectedOrganismes.clear();
        state.documents = [];
        state.tracker = {};
        navigateTo('form');
        // Reset form
        document.getElementById('demenagement-form')?.reset();
        document.querySelectorAll('.organism-card.selected').forEach(card => card.classList.remove('selected'));
        document.querySelectorAll('.org-checkbox:checked').forEach(cb => { cb.checked = false; });
        updateCounter();
    });

    // Document card listeners
    initDocumentCardListeners();

    // Animate stats
    setTimeout(() => {
        container.querySelectorAll('.stat-card').forEach((card, i) => {
            setTimeout(() => card.classList.add('animate-in'), i * 100);
        });
    }, 200);
}

function renderDocumentCard(doc, index) {
    const status = state.tracker[doc.organisme.id] || 'pending';
    const statusLabels = {
        pending: '⏳ À envoyer',
        sent: '📤 Envoyé',
        completed: '✅ Confirmé',
    };
    const statusClasses = {
        pending: 'status-pending',
        sent: 'status-sent',
        completed: 'status-completed',
    };

    return `
    <div class="document-card ${statusClasses[status]}" id="doc-${doc.organisme.id}" data-index="${index}">
      <div class="doc-header">
        <div class="doc-info">
          <span class="doc-icon">${doc.categorie.icon}</span>
          <div>
            <h4 class="doc-name">${doc.organisme.nom}</h4>
            <span class="doc-category">${doc.categorie.label}</span>
          </div>
        </div>
        <div class="doc-status" data-id="${doc.organisme.id}">
          ${statusLabels[status]}
        </div>
      </div>

      <div class="doc-preview" id="preview-${doc.organisme.id}">
        <pre class="doc-text">${escapeHtml(doc.courrier).substring(0, 300)}...</pre>
      </div>

      <div class="doc-actions">
        <button class="btn-action btn-view" data-id="${doc.organisme.id}" title="Voir le courrier complet">
          👁️ Voir
        </button>
        ${doc.organisme.adresse ? `
          <button class="btn-action btn-pdf" data-id="${doc.organisme.id}" title="Télécharger en PDF">
            📄 PDF
          </button>
        ` : ''}
        ${doc.organisme.email ? `
          <a class="btn-action btn-email" href="${doc.mailtoLink}" title="Envoyer par email">
            📧 Email
          </a>
        ` : ''}
        <button class="btn-action btn-copy" data-id="${doc.organisme.id}" title="Copier le texte">
          📋 Copier
        </button>
        <div class="doc-status-buttons">
          <button class="btn-status ${status === 'sent' ? 'active' : ''}" data-id="${doc.organisme.id}" data-status="sent" title="Marquer comme envoyé">
            📤
          </button>
          <button class="btn-status ${status === 'completed' ? 'active' : ''}" data-id="${doc.organisme.id}" data-status="completed" title="Marquer comme confirmé">
            ✅
          </button>
        </div>
      </div>

      ${doc.organisme.note ? `
        <div class="doc-note">
          💡 ${doc.organisme.note}
        </div>
      ` : ''}
    </div>
  `;
}

function initDocumentCardListeners() {
    // View full document
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const doc = state.documents.find(d => d.organisme.id === id);
            if (doc) showModal(doc);
        });
    });

    // Download individual PDF
    document.querySelectorAll('.btn-pdf').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const doc = state.documents.find(d => d.organisme.id === id);
            if (doc) telechargerPDF(doc.courrier, doc.organisme, state.userData);
        });
    });

    // Copy to clipboard
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const doc = state.documents.find(d => d.organisme.id === id);
            if (doc) {
                try {
                    await navigator.clipboard.writeText(doc.courrier);
                    btn.innerHTML = '✅ Copié !';
                    setTimeout(() => { btn.innerHTML = '📋 Copier'; }, 2000);
                } catch (err) {
                    // Fallback
                    const ta = document.createElement('textarea');
                    ta.value = doc.courrier;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    btn.innerHTML = '✅ Copié !';
                    setTimeout(() => { btn.innerHTML = '📋 Copier'; }, 2000);
                }
            }
        });
    });

    // Status buttons
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const newStatus = btn.dataset.status;
            const currentStatus = state.tracker[id];

            // Toggle: if already this status, revert to pending
            state.tracker[id] = currentStatus === newStatus ? 'pending' : newStatus;

            // Update UI
            updateDocumentStatus(id);
            updateProgress();
        });
    });
}

function updateDocumentStatus(orgId) {
    const status = state.tracker[orgId];
    const card = document.getElementById(`doc-${orgId}`);
    if (!card) return;

    const statusLabels = {
        pending: '⏳ À envoyer',
        sent: '📤 Envoyé',
        completed: '✅ Confirmé',
    };

    card.className = `document-card status-${status}`;
    card.querySelector('.doc-status').innerHTML = statusLabels[status];

    // Update status buttons
    card.querySelectorAll('.btn-status').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === status);
    });
}

function updateProgress() {
    const total = state.documents.length;
    const completed = Object.values(state.tracker).filter(s => s === 'completed').length;
    const sent = Object.values(state.tracker).filter(s => s === 'sent').length;
    const progress = total > 0 ? Math.round(((completed + sent * 0.5) / total) * 100) : 0;

    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = `${progress}%`;

    const percent = document.getElementById('completion-percent');
    if (percent) percent.textContent = `${progress}%`;
}

// ── Modal ────────────────────────────────────────────────────
function showModal(doc) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${doc.categorie.icon} ${doc.organisme.nom}</h3>
        <button class="modal-close" id="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-tabs">
          <button class="modal-tab active" data-tab="courrier">✉️ Courrier</button>
          <button class="modal-tab" data-tab="email">📧 Email</button>
        </div>
        <div class="modal-tab-content active" id="tab-courrier">
          <pre class="modal-text">${escapeHtml(doc.courrier)}</pre>
        </div>
        <div class="modal-tab-content" id="tab-email">
          <div class="email-subject"><strong>Objet :</strong> ${escapeHtml(doc.email.sujet)}</div>
          <pre class="modal-text">${escapeHtml(doc.email.corps)}</pre>
        </div>
      </div>
      <div class="modal-footer">
        ${doc.organisme.adresse ? `<button class="btn-primary btn-modal-pdf" data-id="${doc.organisme.id}">📄 Télécharger PDF</button>` : ''}
        ${doc.organisme.email ? `<a class="btn-primary" href="${doc.mailtoLink}">📧 Envoyer Email</a>` : ''}
        <button class="btn-secondary btn-modal-copy" data-id="${doc.organisme.id}">📋 Copier</button>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    // Close
    overlay.querySelector('#modal-close').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
    });

    // Tabs
    overlay.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            overlay.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
            overlay.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // PDF button in modal
    overlay.querySelector('.btn-modal-pdf')?.addEventListener('click', () => {
        telechargerPDF(doc.courrier, doc.organisme, state.userData);
    });

    // Copy button in modal
    overlay.querySelector('.btn-modal-copy')?.addEventListener('click', async (e) => {
        const activeTab = overlay.querySelector('.modal-tab.active').dataset.tab;
        const textToCopy = activeTab === 'courrier' ? doc.courrier : `Objet: ${doc.email.sujet}\n\n${doc.email.corps}`;
        try {
            await navigator.clipboard.writeText(textToCopy);
            e.target.innerHTML = '✅ Copié !';
            setTimeout(() => { e.target.innerHTML = '📋 Copier'; }, 2000);
        } catch (err) {
            const ta = document.createElement('textarea');
            ta.value = textToCopy;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    });
}

// ── Utils ────────────────────────────────────────────────────
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
