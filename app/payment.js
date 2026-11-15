const API_BASE_URL = window.PAPYRUS_API_BASE_URL?.replace(/\/+$/, '') || window.location.origin;
const summaryStudent = document.getElementById('summary-student');
const summaryClass = document.getElementById('summary-class');
const paymentReference = document.getElementById('payment-reference');
const paymentMessage = document.getElementById('payment-message');
const confirmPaymentButton = document.getElementById('confirm-payment');
const applicationId = new URLSearchParams(window.location.search).get('applicationId');

function getToken() {
  try {
    return sessionStorage.getItem('papyrus-admin-token') || '';
  } catch {
    return '';
  }
}

async function loadApplication() {
  if (!applicationId) {
    paymentMessage.textContent = 'Aucune candidature n’a été sélectionnée.';
    paymentMessage.style.color = '#a20d25';
    confirmPaymentButton.disabled = true;
    return;
  }

  const token = getToken();
  if (!token) {
    paymentMessage.textContent = 'La session secrétariat a expiré. Retournez au tableau et reconnectez-vous.';
    paymentMessage.style.color = '#a20d25';
    confirmPaymentButton.disabled = true;
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/applications/${encodeURIComponent(applicationId)}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      }
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Dossier introuvable (HTTP ${response.status}).`);

    const application = payload.application || {};
    if (application.status !== 'accepted') {
      throw new Error('Ce dossier doit être validé avant de poursuivre.');
    }

    summaryStudent.textContent = application.studentName || '—';
    summaryClass.textContent = application.desiredClass || '—';
    paymentReference.value = `PAPYRUS-${String(application.id || '').slice(0, 6).toUpperCase()}`;
    confirmPaymentButton.disabled = false;
  } catch (error) {
    paymentMessage.textContent = error.message || 'Impossible de charger la candidature.';
    paymentMessage.style.color = '#a20d25';
    confirmPaymentButton.disabled = true;
  }
}

confirmPaymentButton.addEventListener('click', () => {
  const reference = paymentReference.value.trim();
  if (!reference) {
    paymentMessage.textContent = 'Veuillez renseigner une référence de paiement.';
    paymentMessage.style.color = '#a20d25';
    return;
  }

  paymentMessage.textContent = 'Cette interface affiche les informations de paiement, mais ne traite pas encore de transaction en ligne.';
  paymentMessage.style.color = '#94620c';
});

loadApplication();
