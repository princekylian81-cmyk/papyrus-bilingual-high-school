const apiBaseUrl = (window.PAPYRUS_API_BASE_URL || '').trim().replace(/\/+$/, '') || window.location.origin;
const params = new URLSearchParams(window.location.search);
const requestedReference = params.get('reference') || params.get('applicationId') || '';
const summaryStudent = document.getElementById('summary-student');
const summaryClass = document.getElementById('summary-class');
const summaryAmount = document.getElementById('summary-amount');
const paymentReference = document.getElementById('payment-reference');
const confirmButton = document.getElementById('confirm-payment');
const message = document.getElementById('payment-message');
const formControls = [...document.querySelectorAll('.payment-options input, #payment-reference')];
const followStorageKey = 'papyrus-parent-follow';

let lookup = null;
let currentApplication = null;

function setMessage(text, type = 'info') {
  message.textContent = text;
  message.dataset.type = type;
}

function readLookup() {
  try {
    const value = JSON.parse(sessionStorage.getItem(followStorageKey) || 'null');
    if (!value || typeof value.reference !== 'string' || typeof value.email !== 'string') return null;
    if (requestedReference && value.reference !== requestedReference) return null;
    return value;
  } catch {
    return null;
  }
}

function formatFee(amount) {
  const value = Number(amount);
  return Number.isFinite(value) && value > 0
    ? `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`
    : '—';
}

function showDeclaredPayment(application) {
  formControls.forEach((control) => { control.disabled = true; });
  confirmButton.disabled = true;
  if (application.paymentMethod) {
    const selected = document.querySelector(`input[name="payment-method"][value="${CSS.escape(application.paymentMethod)}"]`);
    if (selected) selected.checked = true;
  }
  paymentReference.value = application.paymentReference || '';
  setMessage('Votre référence de paiement a déjà été transmise au secrétariat.', 'success');
}

function lockForPendingReview() {
  formControls.forEach((control) => { control.disabled = true; });
  confirmButton.disabled = true;
  setMessage('Le paiement sera disponible dès que le secrétariat aura validé votre dossier.', 'info');
}

async function loadApplication() {
  if (!lookup) {
    lockForPendingReview();
    setMessage('Pour sécuriser votre paiement, ouvrez cette page depuis le lien de suivi de votre candidature.', 'error');
    return;
  }

  setMessage('Vérification de la candidature…');
  try {
    const url = new URL(`${apiBaseUrl}/api/applications/${encodeURIComponent(lookup.reference)}/status`);
    url.searchParams.set('email', lookup.email);
    const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Impossible de retrouver cette candidature.');

    currentApplication = payload.application;
    summaryStudent.textContent = currentApplication.studentName || '—';
    summaryClass.textContent = window.formatPapyrusClass(currentApplication.desiredClass);
    summaryAmount.textContent = `${formatFee(currentApplication.registrationFee)} · ${currentApplication.registrationLabel || 'Inscription'}`;

    if (currentApplication.status !== 'accepted') {
      lockForPendingReview();
      return;
    }
    if (currentApplication.paymentStatus === 'declared') {
      showDeclaredPayment(currentApplication);
      return;
    }

    formControls.forEach((control) => { control.disabled = false; });
    confirmButton.disabled = false;
    setMessage('Votre dossier est accepté. Après avoir payé les frais indiqués, saisissez la référence reçue.', 'success');
  } catch (error) {
    lockForPendingReview();
    setMessage(error.message || 'La vérification du dossier a échoué.', 'error');
  }
}

confirmButton.addEventListener('click', async () => {
  if (!lookup || !currentApplication || currentApplication.status !== 'accepted') {
    await loadApplication();
    return;
  }
  const method = document.querySelector('input[name="payment-method"]:checked')?.value;
  const reference = paymentReference.value.trim();
  if (!method || reference.length < 4) {
    setMessage('Choisissez un moyen de paiement et saisissez une référence d’au moins 4 caractères.', 'error');
    return;
  }

  confirmButton.disabled = true;
  setMessage('Transmission de la référence au secrétariat…');
  try {
    const response = await fetch(`${apiBaseUrl}/api/applications/${encodeURIComponent(lookup.reference)}/payment`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lookup.email, method, reference })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'La référence de paiement n’a pas pu être transmise.');
    currentApplication = payload.application;
    showDeclaredPayment(currentApplication);
  } catch (error) {
    confirmButton.disabled = false;
    setMessage(error.message || 'La transmission du paiement a échoué.', 'error');
  }
});

lookup = readLookup();
if (lookup) loadApplication();
else lockForPendingReview();
