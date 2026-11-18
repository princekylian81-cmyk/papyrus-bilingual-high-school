const apiBaseUrl = (window.PAPYRUS_API_BASE_URL || '').trim().replace(/\/+$/, '') || window.location.origin;
const followForm = document.getElementById('follow-form');
const referenceInput = document.getElementById('reference');
const emailInput = document.getElementById('parent-email');
const followMessage = document.getElementById('follow-message');
const followPanel = document.getElementById('follow-panel');
const waitingScreen = document.getElementById('application-waiting');
const waitingTitle = document.getElementById('waiting-title');
const waitingDescription = document.getElementById('waiting-description');
const waitingError = document.getElementById('waiting-error');
const waitingReturn = document.getElementById('waiting-return');
const storageKey = 'papyrus-parent-follow';
const pollInterval = 20_000;

let currentLookup = null;
let lastSignature = '';
let pollTimer;
let waitingMode = false;

function translate(value) {
  return window.papyrusTranslate?.(value) || value;
}

function formatFee(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
}

function methodName(method) {
  return {
    'orange-money': 'Orange Money',
    'mtn-momo': 'MTN Mobile Money',
    'bank-transfer': 'Bank transfer'
  }[method] || method;
}

function readStoredLookup() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (!stored || typeof stored.reference !== 'string' || typeof stored.email !== 'string') return null;
    return stored;
  } catch {
    return null;
  }
}

function rememberLookup(lookup) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(lookup));
  } catch {
    followMessage.className = 'form-message error';
    followMessage.textContent = translate('The browser could not keep this follow-up session.');
  }
}

function setMessage(text, type) {
  followMessage.className = `form-message ${type}`;
  followMessage.textContent = text;
}

function setWaitingStatus(title, description, { complete = false, allowReturn = false } = {}) {
  waitingTitle.textContent = translate(title);
  waitingDescription.textContent = translate(description);
  waitingReturn.textContent = translate('Return to admissions');
  waitingError.hidden = true;
  waitingReturn.hidden = !allowReturn;
  waitingScreen.querySelector('.application-waiting-spinner').hidden = complete;
}

function statusTitle(status) {
  return {
    pending: 'Waiting for the secretary',
    under_review: 'Under review',
    accepted: 'Accepted',
    rejected: 'Refused'
  }[status] || 'Waiting for the secretary';
}

function statusText(status) {
  return {
    pending: 'The secretary has received the file and has not reviewed it yet.',
    under_review: 'The secretary is checking the file against the school requirements.',
    accepted: 'The secretary accepted the file. You can now pay the registration fee.',
    rejected: 'The secretary refused the file because it does not meet the school requirements.'
  }[status] || 'The secretary has received the file and has not reviewed it yet.';
}

function appendFact(container, label, value) {
  const row = document.createElement('p');
  const caption = document.createElement('strong');
  caption.textContent = `${translate(label)} : `;
  row.append(caption, document.createTextNode(value || '—'));
  container.append(row);
}

function renderApplication(application) {
  const signature = JSON.stringify(application);
  if (signature === lastSignature) return;
  lastSignature = signature;

  if (waitingMode) {
    if (application.status === 'accepted' && application.paymentStatus !== 'declared') {
      window.clearInterval(pollTimer);
      window.location.replace(`payment.html?reference=${encodeURIComponent(application.reference)}`);
      return;
    }

    if (application.status === 'rejected') {
      setWaitingStatus(
        'Application not accepted',
        application.decisionNote || 'The administration has completed its review of your application.',
        { complete: true, allowReturn: true }
      );
      window.clearInterval(pollTimer);
      return;
    }

    if (application.status === 'accepted') {
      setWaitingStatus(
        'Payment reference received',
        'The administration has received your payment reference.',
        { complete: true, allowReturn: true }
      );
      window.clearInterval(pollTimer);
      return;
    }

    setWaitingStatus(statusTitle(application.status), statusText(application.status));
    return;
  }

  followPanel.replaceChildren();
  const heading = document.createElement('h3');
  heading.textContent = translate(statusTitle(application.status));
  const summary = document.createElement('p');
  summary.textContent = translate(statusText(application.status));
  followPanel.append(heading, summary);
  appendFact(followPanel, 'Student', application.studentName);
  appendFact(followPanel, 'Desired Class', window.formatPapyrusClass(application.desiredClass));
  appendFact(followPanel, 'Pathway', application.educationType);
  if (application.specialty) appendFact(followPanel, 'Specialty', application.specialty);
  appendFact(followPanel, 'Amount due now', `${formatFee(application.registrationFee)} · ${translate(application.registrationLabel || 'Registration')}`);

  if (application.status === 'rejected') {
    appendFact(followPanel, 'Reason given by the secretary', application.decisionNote || '—');
    return;
  }

  if (application.status !== 'accepted') return;

  if (application.paymentStatus !== 'declared') {
    renderPaymentForm(application);
    return;
  }

  if (application.paymentStatus === 'declared') {
    appendFact(followPanel, 'Payment method', translate(methodName(application.paymentMethod)));
    appendFact(followPanel, 'Payment reference', application.paymentReference);
    const done = document.createElement('p');
    done.textContent = translate('The secretary has the payment reference.');
    followPanel.append(done);
    return;
  }
}

function renderPaymentForm(application) {
  const form = document.createElement('form');
  form.id = 'payment-form';
  form.className = 'follow-options';
  const methods = [
    ['orange-money', 'Orange Money'],
    ['mtn-momo', 'MTN Mobile Money'],
    ['bank-transfer', 'Bank transfer']
  ];
  for (const [value, label] of methods) {
    const choice = document.createElement('label');
    choice.className = 'payment-choice';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'payment-method';
    input.value = value;
    if (value === 'bank-transfer') input.checked = true;
    const text = document.createElement('span');
    text.textContent = translate(label);
    choice.append(input, text);
    form.append(choice);
  }

  const referenceLabel = document.createElement('label');
  referenceLabel.className = 'form-group';
  const referenceCaption = document.createElement('span');
  referenceCaption.textContent = translate('Payment reference');
  const referenceField = document.createElement('input');
  referenceField.name = 'payment-reference';
  referenceField.type = 'text';
  referenceField.maxLength = 80;
  referenceField.required = true;
  referenceField.placeholder = translate('Example: the code received from the bank or mobile money');
  referenceLabel.append(referenceCaption, referenceField);

  const submit = document.createElement('button');
  submit.className = 'btn primary';
  submit.type = 'submit';
  submit.textContent = translate('Confirm payment');
  const note = document.createElement('p');
  note.className = 'form-help';
  note.textContent = translate('This page records the reference for the secretary. Pay that amount in the student’s name, then enter the reference you receive. It does not debit Orange Money or MTN from this page.');
  form.append(referenceLabel, submit, note);
  form.addEventListener('submit', (event) => submitPayment(event, application, form));
  followPanel.append(form);
}

async function submitPayment(event, application, form) {
  event.preventDefault();
  const submit = form.querySelector('[type="submit"]');
  const method = form.querySelector('input[name="payment-method"]:checked')?.value;
  const reference = form.querySelector('[name="payment-reference"]').value.trim();
  if (!method || reference.length < 4) {
    setMessage(translate('Choose a payment method and enter the payment reference.'), 'error');
    return;
  }

  submit.disabled = true;
  setMessage(translate('Sending the payment reference…'), 'info');
  try {
    const response = await fetch(`${apiBaseUrl}/api/applications/${encodeURIComponent(application.reference)}/payment`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: currentLookup.email,
        method,
        reference
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'The payment reference could not be sent.');
    setMessage(translate('The secretary has the payment reference.'), 'success');
    renderApplication(payload.application);
  } catch (error) {
    setMessage(translate(error.message), 'error');
    submit.disabled = false;
  }
}

async function loadApplication({ quiet = false } = {}) {
  if (!currentLookup) return;
  if (!quiet) setMessage(translate('Checking the application…'), 'info');
  try {
    const url = new URL(`${apiBaseUrl}/api/applications/${encodeURIComponent(currentLookup.reference)}/status`);
    url.searchParams.set('email', currentLookup.email);
    const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'No application matches this reference and email address.');
    if (!quiet) followMessage.className = 'form-message';
    if (waitingMode) waitingError.hidden = true;
    renderApplication(payload.application);
  } catch (error) {
    if (waitingMode) {
      waitingError.textContent = translate(error.message || 'The application status could not be checked. Retrying automatically.');
      waitingError.hidden = false;
      return;
    }
    followPanel.replaceChildren();
    lastSignature = '';
    setMessage(translate(error.message), 'error');
  }
}

function startPolling() {
  window.clearInterval(pollTimer);
  pollTimer = window.setInterval(() => {
    if (!document.hidden) loadApplication({ quiet: true });
  }, pollInterval);
}

followForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const reference = referenceInput.value.trim();
  const email = emailInput.value.trim();
  if (!reference || !email) {
    setMessage(translate('Enter the application reference and the parent email address.'), 'error');
    return;
  }
  currentLookup = { reference, email };
  lastSignature = '';
  rememberLookup(currentLookup);
  loadApplication();
  startPolling();
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('[data-language-toggle]')?.addEventListener('click', () => {
    if (!lastSignature) return;
    const application = JSON.parse(lastSignature);
    lastSignature = '';
    renderApplication(application);
  });

  const requestedReference = new URLSearchParams(window.location.search).get('reference') || '';
  const submittedFromApplication = new URLSearchParams(window.location.search).get('submitted') === '1';
  const storedLookup = readStoredLookup();
  if (requestedReference) referenceInput.value = requestedReference;
  if (storedLookup && (!requestedReference || storedLookup.reference === requestedReference)) {
    referenceInput.value = storedLookup.reference;
    emailInput.value = storedLookup.email;
    currentLookup = storedLookup;
    if (submittedFromApplication) {
      waitingMode = true;
      waitingScreen.hidden = false;
      document.body.classList.add('application-waiting-active');
      setWaitingStatus(
        'Awaiting administration review',
        'Your application has been received. The page will continue to payment automatically if it is approved.'
      );
    }
    loadApplication();
    startPolling();
  }
});
