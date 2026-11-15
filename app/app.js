const API_BASE_URL = window.PAPYRUS_API_BASE_URL?.replace(/\/+$/, '') || window.location.origin;
const listElement = document.getElementById('application-list');
const tokenInput = document.getElementById('admin-token');
const tokenForm = document.getElementById('token-form');
const refreshButton = document.getElementById('refresh-button');
const banner = document.getElementById('status-banner');
const lastUpdated = document.getElementById('last-updated');
const cardTemplate = document.getElementById('application-card-template');
const filterButtons = [...document.querySelectorAll('.filter-button')];
const countEls = {
  pending: document.getElementById('count-pending'),
  under_review: document.getElementById('count-review'),
  accepted: document.getElementById('count-accepted'),
  rejected: document.getElementById('count-rejected')
};

const statusLabel = {
  pending: 'En attente',
  under_review: 'En examen',
  accepted: 'Validée',
  rejected: 'Refusée'
};
const applicationEndpoint = `${API_BASE_URL}/api/admin/applications`;
const pollInterval = 5000;

let activeFilter = 'all';
let applicationsCache = [];
let isFetching = false;
let hasLoaded = false;
let pollTimeout;

function getToken() {
  try {
    return sessionStorage.getItem('papyrus-admin-token') || '';
  } catch (error) {
    setBanner('Le navigateur ne permet pas de garder la session secrète. Autorisez le stockage de session puis réessayez.', 'error');
    return '';
  }
}

function buildHeaders() {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`
  };
}

function setBanner(message, type = 'info') {
  banner.textContent = message;
  banner.dataset.type = type;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatDateOnly(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function renderCounters(applications) {
  const totals = { pending: 0, under_review: 0, accepted: 0, rejected: 0 };
  for (const application of applications) {
    if (Object.hasOwn(totals, application.status)) totals[application.status] += 1;
  }

  for (const [status, count] of Object.entries(totals)) {
    countEls[status].textContent = String(count);
  }
  document.getElementById('count-total').textContent = String(applications.length);
}

function appendDetail(container, label, value) {
  const item = document.createElement('div');
  item.className = 'detail-item';
  const caption = document.createElement('span');
  caption.textContent = label;
  const content = document.createElement('strong');
  content.textContent = value || '—';
  item.append(caption, content);
  container.append(item);
}

async function downloadDocument(applicationId, documentInfo, button) {
  button.disabled = true;
  button.textContent = 'Chargement…';
  try {
    const url = `${applicationEndpoint}/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentInfo.id)}`;
    const response = await fetch(url, { headers: buildHeaders(), cache: 'no-store' });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Téléchargement impossible (HTTP ${response.status}).`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${documentInfo.type.replace(/_/g, '-')}.${extensionFor(documentInfo.mediaType)}`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    button.textContent = 'Téléchargé';
  } catch (error) {
    setBanner(error.message || 'Impossible de récupérer cette pièce jointe.', 'error');
    button.textContent = 'Réessayer';
  } finally {
    button.disabled = false;
  }
}

function extensionFor(mediaType) {
  return {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png'
  }[mediaType] || 'document';
}

function renderApplications() {
  const filtered = applicationsCache.filter((application) => (
    activeFilter === 'all' || application.status === activeFilter
  ));
  listElement.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<span class="empty-mark" aria-hidden="true">P</span><strong>Aucun dossier dans cette sélection</strong><span>Les nouvelles candidatures apparaîtront automatiquement ici.</span>';
    listElement.append(empty);
    return;
  }

  for (const application of filtered) {
    const fragment = cardTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.application-card');
    const badge = fragment.querySelector('.status-badge');
    const status = statusLabel[application.status] ? application.status : 'pending';
    const documentList = fragment.querySelector('.document-list');
    const actions = fragment.querySelector('.card-actions');

    card.dataset.id = application.id;
    fragment.querySelector('.student-name').textContent = application.studentName || 'Élève sans nom';
    fragment.querySelector('.application-reference').textContent = `Dossier · ${String(application.id || '').slice(0, 8).toUpperCase()}`;
    fragment.querySelector('.created-date').textContent = formatDate(application.createdAt);
    badge.textContent = statusLabel[status];
    badge.classList.add(status);

    const details = fragment.querySelector('.application-meta');
    appendDetail(details, 'Date de naissance', formatDateOnly(application.dateOfBirth));
    appendDetail(details, 'Genre', application.gender === 'Female' ? 'Féminin' : application.gender === 'Male' ? 'Masculin' : '—');
    appendDetail(details, 'Classe demandée', application.desiredClass);
    appendDetail(details, 'Parcours', application.educationType);
    appendDetail(details, 'Spécialité', application.specialty);
    appendDetail(details, 'Parent / responsable', application.guardianName);
    appendDetail(details, 'Téléphone du père', application.fatherPhone);
    appendDetail(details, 'Téléphone de la mère', application.motherPhone);
    appendDetail(details, 'Adresse e-mail', application.email);

    const documents = Array.isArray(application.documents) ? application.documents : [];
    if (!documents.length) {
      const emptyDocument = document.createElement('p');
      emptyDocument.className = 'no-documents';
      emptyDocument.textContent = 'Aucune pièce jointe.';
      documentList.append(emptyDocument);
    } else {
      for (const item of documents) {
        const documentRow = document.createElement('div');
        documentRow.className = 'document-row';
        const name = document.createElement('span');
        const humanName = item.type.replace(/_/g, ' ');
        name.textContent = item.photoNumber ? `${humanName} ${item.photoNumber}` : humanName;
        const download = document.createElement('button');
        download.className = 'document-link';
        download.type = 'button';
        download.textContent = 'Télécharger';
        download.addEventListener('click', () => downloadDocument(application.id, item, download));
        documentRow.append(name, download);
        documentList.append(documentRow);
      }
    }

    const reviewButton = fragment.querySelector('[data-action="review"]');
    const acceptButton = fragment.querySelector('[data-action="accept"]');
    const rejectButton = fragment.querySelector('[data-action="reject"]');
    const paymentLink = fragment.querySelector('[data-action="payment"]');
    reviewButton.addEventListener('click', () => updateApplicationStatus(application.id, 'under_review', reviewButton));
    acceptButton.addEventListener('click', () => updateApplicationStatus(application.id, 'accepted', acceptButton));
    rejectButton.addEventListener('click', () => updateApplicationStatus(application.id, 'rejected', rejectButton));

    if (status === 'accepted') {
      paymentLink.href = `/app/payment.html?applicationId=${encodeURIComponent(application.id)}`;
      paymentLink.classList.remove('hidden');
      actions.classList.add('accepted-actions');
      reviewButton.classList.add('hidden');
      acceptButton.classList.add('hidden');
      rejectButton.classList.add('hidden');
    }
    if (status === 'rejected') {
      reviewButton.classList.add('hidden');
      acceptButton.classList.add('hidden');
      rejectButton.classList.add('hidden');
    }

    listElement.append(fragment);
  }
}

async function readError(response) {
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) return 'Jeton administrateur invalide ou expiré.';
  if (response.status === 403) return 'Accès refusé par le serveur. Vérifiez que vous ouvrez l’application depuis le domaine Papyrus.';
  return payload.error || `Le serveur a répondu avec le code ${response.status}.`;
}

async function fetchApplications({ quiet = false } = {}) {
  if (isFetching || document.hidden) return;
  const token = getToken();
  if (!token) {
    listElement.innerHTML = '<div class="empty-state"><span class="empty-mark" aria-hidden="true">P</span><strong>Connectez-vous pour consulter les dossiers</strong><span>Le jeton administrateur est requis. Les dossiers restent protégés.</span></div>';
    renderCounters([]);
    return;
  }

  isFetching = true;
  refreshButton.disabled = true;
  try {
    const response = await fetch(applicationEndpoint, {
      headers: buildHeaders(),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(await readError(response));

    const payload = await response.json();
    const nextApplications = Array.isArray(payload.applications) ? payload.applications : [];
    const previousIds = new Set(applicationsCache.map((application) => application.id));
    const newCount = hasLoaded
      ? nextApplications.filter((application) => !previousIds.has(application.id)).length
      : 0;
    applicationsCache = nextApplications;
    hasLoaded = true;

    renderCounters(applicationsCache);
    renderApplications();
    lastUpdated.textContent = `Mis à jour à ${new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date())}`;
    if (newCount > 0) {
      setBanner(`${newCount} nouvelle${newCount > 1 ? 's' : ''} candidature${newCount > 1 ? 's' : ''} reçue${newCount > 1 ? 's' : ''}.`, 'success');
    } else if (!quiet) {
      setBanner(`${applicationsCache.length} dossier${applicationsCache.length > 1 ? 's' : ''} synchronisé${applicationsCache.length > 1 ? 's' : ''}. Actualisation automatique toutes les 5 secondes.`, 'success');
    }
  } catch (error) {
    setBanner(error.message || 'Impossible de joindre le serveur des candidatures.', 'error');
    if (!hasLoaded) {
      listElement.innerHTML = '<div class="empty-state"><span class="empty-mark" aria-hidden="true">!</span><strong>Connexion impossible</strong><span>Vérifiez votre accès réseau et le jeton administrateur, puis actualisez.</span></div>';
    }
  } finally {
    isFetching = false;
    refreshButton.disabled = false;
  }
}

async function updateApplicationStatus(applicationId, nextStatus, button) {
  button.disabled = true;
  try {
    const response = await fetch(`${applicationEndpoint}/${encodeURIComponent(applicationId)}/status`, {
      method: 'PATCH',
      headers: {
        ...buildHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: nextStatus })
    });
    if (!response.ok) throw new Error(await readError(response));
    setBanner(`Le dossier a été marqué « ${statusLabel[nextStatus].toLowerCase()} ».`, 'success');
    await fetchApplications();
  } catch (error) {
    setBanner(error.message || 'La mise à jour du dossier a échoué.', 'error');
  } finally {
    button.disabled = false;
  }
}

tokenForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const token = tokenInput.value.trim();
  if (!token) {
    try {
      sessionStorage.removeItem('papyrus-admin-token');
    } catch (error) {
      setBanner('Impossible de fermer la session dans ce navigateur.', 'error');
      return;
    }
    applicationsCache = [];
    hasLoaded = false;
    renderCounters([]);
    listElement.innerHTML = '<div class="empty-state"><span class="empty-mark" aria-hidden="true">P</span><strong>Session fermée</strong><span>Entrez le jeton administrateur pour consulter les dossiers.</span></div>';
    setBanner('Session fermée.', 'info');
    return;
  }

  try {
    sessionStorage.setItem('papyrus-admin-token', token);
    fetchApplications();
  } catch (error) {
    setBanner('Le navigateur ne permet pas de garder la session secrète. Autorisez le stockage de session puis réessayez.', 'error');
  }
});

tokenInput.value = getToken();
refreshButton.addEventListener('click', () => fetchApplications());

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    renderApplications();
  });
}

function scheduleNextPoll() {
  window.clearTimeout(pollTimeout);
  pollTimeout = window.setTimeout(async () => {
    await fetchApplications({ quiet: true });
    scheduleNextPoll();
  }, pollInterval);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.clearTimeout(pollTimeout);
  } else {
    fetchApplications({ quiet: true });
    scheduleNextPoll();
  }
});

fetchApplications();
scheduleNextPoll();
