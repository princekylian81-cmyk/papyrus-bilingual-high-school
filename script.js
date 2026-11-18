document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.nav-links');
  const toggle = document.querySelector('.menu-toggle');
  const loader = document.getElementById('loader');
  if (loader) {
    window.setTimeout(() => loader.classList.add('hidden'), 900);
  }
  const reveals = document.querySelectorAll('.reveal');
  const animatedSections = document.querySelectorAll(
    '.section-header, .program-grid, .card-grid, .life-grid, .gallery-grid, .values-grid, .mission-grid'
  );
  const carousel = document.querySelector('[data-carousel]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionToggle = document.querySelector('[data-motion-toggle]');
  const filterPills = document.querySelectorAll('.filter-pill');
  const specialtyCards = document.querySelectorAll('.specialty-card');
  const galleryItems = document.querySelectorAll('[data-gallery-image]');
  const modal = document.getElementById('gallery-modal');
  const modalImage = document.querySelector('#gallery-modal img');
  const modalClose = document.querySelector('#gallery-modal .modal-close');
  const forms = document.querySelectorAll('form[data-validate]');
  const iconPaths = {
    'graduation-cap': '<path d="m22 10-10 5-10-5 10-5 10 5Z"/><path d="M6 12v5c3.5 2 8.5 2 12 0v-5"/>',
    'chart-column': '<path d="M3 3v18h18"/><path d="M8 16V9m5 7V5m5 11v-4"/>',
    settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    'book-open': '<path d="M12 7v14"/><path d="M3 18V5a1 1 0 0 1 1-1h4a4 4 0 0 1 4 4 4 4 0 0 1 4-4h4a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4a4 4 0 0 0-4 2 4 4 0 0 0-4-2H4a1 1 0 0 1-1-1Z"/>',
    footprints: '<path d="M7.5 14c-1.8 0-3.5 2-3.5 4 0 1.3 1 2 2.3 2 2 0 3.7-1.6 3.7-3.4C10 15.2 9 14 7.5 14Z"/><path d="M8 11c0-2.5-.8-4.5-2-4.5s-2 2-2 4.5 1 4 2 4 2-1.5 2-4Z"/><path d="M16.5 4c-1.6 0-2.5 2.4-2 4.8.4 2.1 1.6 3.5 2.8 3.3 1.2-.2 1.7-2 1.3-4.1C18.2 5.6 17.4 4 16.5 4Z"/><path d="M17 14c-1.8.3-2.7 2.8-2 4.6.5 1.3 1.6 1.8 2.8 1.6 1.3-.2 2.1-1.3 1.8-2.6-.4-2-1.5-3.9-2.6-3.6Z"/>',
    'clipboard-list': '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5h6a1.5 1.5 0 0 0-3-1 1.5 1.5 0 0 0-3 1Z"/><path d="M9 11h6m-6 4h6m-6 4h3"/>',
    'building-2': '<path d="M3 21h18M5 21V5l7-3v19m7 0V9l-7-2"/><path d="M8 8v.01M8 12v.01M8 16v.01m8-3v.01m0 4v.01"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3.1a2 2 0 0 1-.6 1.7L7.6 9.9a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 1.7-.6l3.1.5a2 2 0 0 1 1.7 2.5Z"/>',
    'message-circle': '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.7 5.7-5.7 2.7 2.7-5.7 5.7-2.7Z"/>',
    lightbulb: '<path d="M9 18h6m-5 4h4m-2-21a7 7 0 0 0-4 12.7c.8.6 1 1.3 1 2.3h6c0-1 .2-1.7 1-2.3A7 7 0 0 0 12 1Z"/>',
    wrench: '<path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L2 19l3 3 6.3-6.3a5 5 0 0 0 6.4-6.4L14 13l-3-3 3.7-3.7Z"/>',
    handshake: '<path d="m11 17 2 2a2 2 0 0 0 3-3l-3-3"/><path d="m14 14 2 2a2 2 0 0 0 3-3l-4-4a6 6 0 0 0-7 0l-2 2"/><path d="m2 12 4 4m-4-4 4-4 3 3"/><path d="m2 12 4 4a2 2 0 0 0 3-3l-1-1"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="m8.2 13-1.2 9 5-3 5 3-1.2-9"/><path d="m10 8 1.3 1.3L14 7"/>',
    'trending-up': '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    'list-checks': '<path d="m3 5 2 2 4-4M3 12l2 2 4-4M3 19l2 2 4-4M13 6h8m-8 7h8m-8 7h8"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8m-8 4h8"/>',
    scroll: '<path d="M8 21h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8"/><path d="M4 3h4v18H5a3 3 0 0 1 0-6h3"/><path d="M12 8h6m-6 4h6"/>',
    'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 6h18m-11 0v2h4v-2"/>',
    'move-up-right': '<path d="M7 17 17 7M7 7h10v10"/>'
  };
  document.querySelectorAll('[data-icon]').forEach((iconElement) => {
    const paths = iconPaths[iconElement.dataset.icon];
    if (!paths) {
      console.error(`Unknown interface icon: ${iconElement.dataset.icon}`);
      return;
    }
    iconElement.innerHTML = `<svg class="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  });
  let savedMotionPreference;
  try {
    savedMotionPreference = localStorage.getItem('papyrus-motion');
  } catch (error) {
    console.warn('Could not read the saved motion preference.', error);
  }
  let motionEnabled = savedMotionPreference === 'on'
    || (savedMotionPreference !== 'off' && !reducedMotion.matches);
  let syncCarouselRotation = () => {};

  const updateMotionToggle = () => {
    document.documentElement.classList.toggle('motion-enabled', motionEnabled);
    if (!motionToggle) return;
    const label = motionEnabled ? 'Disable animations' : 'Enable animations';
    const translatedLabel = window.papyrusTranslate?.(label) || label;
    motionToggle.setAttribute('aria-label', translatedLabel);
    motionToggle.setAttribute('title', translatedLabel);
    motionToggle.setAttribute('aria-pressed', String(motionEnabled));
  };

  updateMotionToggle();
  motionToggle?.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    savedMotionPreference = motionEnabled ? 'on' : 'off';
    updateMotionToggle();
    try {
      localStorage.setItem('papyrus-motion', motionEnabled ? 'on' : 'off');
    } catch (error) {
      console.warn('Could not save the selected motion preference.', error);
    }
    syncCarouselRotation();
  });

  reducedMotion.addEventListener('change', (event) => {
    if (savedMotionPreference === 'on' || savedMotionPreference === 'off') return;
    motionEnabled = !event.matches;
    updateMotionToggle();
    syncCarouselRotation();
  });

  const scrollProgress = document.createElement('div');
  scrollProgress.className = 'papyrus-scroll-progress';
  scrollProgress.setAttribute('aria-hidden', 'true');
  document.body.append(scrollProgress);

  const updateScrollProgress = () => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? Math.min(window.scrollY / scrollableHeight, 1) : 0;
    document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));
  };

  const setHeaderState = () => {
    if (header) {
      if (window.scrollY > 20) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
    updateScrollProgress();
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState);

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav?.classList.contains('open')) {
      nav.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
      toggle?.focus();
    }
  });

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach((el) => revealObserver.observe(el));
  animatedSections.forEach((el) => {
    el.classList.add('reveal-stagger');
    revealObserver.observe(el);
  });

  const photoElements = document.querySelectorAll(
    '.image-stack, .photo-card, .gallery-item, .specialty-card .thumb'
  );
  const photoObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('photo-art', 'is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -35px 0px' });

  photoElements.forEach((element, index) => {
    element.classList.add('photo-art');
    if (index < 2) element.classList.add('is-visible');
    else photoObserver.observe(element);
  });

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (finePointer.matches) {
    const cursor = document.createElement('span');
    cursor.className = 'cursor-orbit';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.append(cursor);

    document.addEventListener('pointermove', (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.classList.toggle('is-active', Boolean(event.target.closest('a, button, [role="button"]')));
    }, { passive: true });

    document.addEventListener('pointerout', (event) => {
      if (!event.relatedTarget) cursor.classList.remove('is-active');
    });

    document.querySelectorAll('.btn').forEach((button) => {
      button.dataset.magnetic = 'true';
      button.addEventListener('pointermove', (event) => {
        if (!motionEnabled) return;
        const bounds = button.getBoundingClientRect();
        const offsetX = (event.clientX - bounds.left - bounds.width / 2) / bounds.width;
        const offsetY = (event.clientY - bounds.top - bounds.height / 2) / bounds.height;
        button.style.setProperty('--magnetic-x', `${(offsetX * 5).toFixed(1)}px`);
        button.style.setProperty('--magnetic-y', `${(offsetY * 4).toFixed(1)}px`);
      });
      button.addEventListener('pointerleave', () => {
        button.style.removeProperty('--magnetic-x');
        button.style.removeProperty('--magnetic-y');
      });
    });

    document.querySelectorAll('.card').forEach((card) => {
      card.dataset.tilt = 'true';
      card.addEventListener('pointermove', (event) => {
        if (!motionEnabled) return;
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.setProperty('--tilt-x', `${(-y * 2.4).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(x * 2.4).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--tilt-x');
        card.style.removeProperty('--tilt-y');
      });
    });
  }

  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const dots = Array.from(carousel.querySelectorAll('.carousel-dot'));
    const progress = carousel.querySelector('.carousel-progress span');
    const currentCount = carousel.querySelector('.carousel-current');
    const rotationButton = carousel.querySelector('.carousel-toggle');
    const previousButton = carousel.querySelector('.carousel-previous');
    const nextButton = carousel.querySelector('.carousel-next');
    let activeIndex = 0;
    let timer;
    let hovered = false;
    let focused = false;
    let hidden = document.hidden;
    let userPaused = false;
    let touchStartX = null;
    const interval = 7000;

    if (finePointer.matches) {
      carousel.addEventListener('pointermove', (event) => {
        if (!motionEnabled) return;
        const bounds = carousel.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        carousel.style.setProperty('--hero-shift-x', `${(-x * 13).toFixed(1)}px`);
        carousel.style.setProperty('--hero-shift-y', `${(-y * 9).toFixed(1)}px`);
      }, { passive: true });

      carousel.addEventListener('pointerleave', () => {
        carousel.style.setProperty('--hero-shift-x', '0px');
        carousel.style.setProperty('--hero-shift-y', '0px');
      });
    }

    const updateRotation = () => {
      window.clearTimeout(timer);
      if (progress) {
        progress.style.animation = 'none';
        progress.style.transform = 'scaleX(0)';
      }

      const paused = !motionEnabled || userPaused || hovered || focused || hidden;
      if (rotationButton) {
        const label = paused ? 'Start slide rotation' : 'Pause slide rotation';
        rotationButton.textContent = paused ? '▶' : 'Ⅱ';
        rotationButton.setAttribute('aria-label', window.papyrusTranslate?.(label) || label);
      }

      if (!paused) {
        if (progress) {
          void progress.offsetWidth;
          progress.style.animation = `carousel-progress ${interval}ms linear forwards`;
        }
        timer = window.setTimeout(() => showSlide(activeIndex + 1), interval);
      }
    };
    syncCarouselRotation = updateRotation;

    const showSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        slide.classList.toggle('active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
        dots[slideIndex]?.classList.toggle('active', active);
        dots[slideIndex]?.setAttribute('aria-current', String(active));
      });
      if (currentCount) currentCount.textContent = String(activeIndex + 1).padStart(2, '0');
      updateRotation();
    };

    previousButton?.addEventListener('click', () => showSlide(activeIndex - 1));
    nextButton?.addEventListener('click', () => showSlide(activeIndex + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => showSlide(index)));
    rotationButton?.addEventListener('click', () => {
      userPaused = !userPaused;
      updateRotation();
    });

    carousel.addEventListener('mouseenter', () => {
      hovered = true;
      updateRotation();
    });
    carousel.addEventListener('mouseleave', () => {
      hovered = false;
      updateRotation();
    });
    carousel.addEventListener('focusin', () => {
      focused = true;
      updateRotation();
    });
    carousel.addEventListener('focusout', () => {
      window.setTimeout(() => {
        focused = carousel.contains(document.activeElement);
        updateRotation();
      }, 0);
    });
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showSlide(activeIndex - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showSlide(activeIndex + 1);
      }
    });
    carousel.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0]?.clientX ?? null;
    }, { passive: true });
    carousel.addEventListener('touchend', (event) => {
      const touchEndX = event.changedTouches[0]?.clientX;
      if (touchStartX === null || touchEndX === undefined) return;
      const distance = touchEndX - touchStartX;
      if (Math.abs(distance) > 55) showSlide(activeIndex + (distance < 0 ? 1 : -1));
      touchStartX = null;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      hidden = document.hidden;
      updateRotation();
    });
    showSlide(0);
  }

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const filter = pill.dataset.filter;
      filterPills.forEach((item) => {
        const isActive = item === pill;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });
      specialtyCards.forEach((card) => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.style.display = matches ? '' : 'none';
      });
    });
  });

  let galleryTrigger = null;
  const openModal = (src, alt) => {
    if (!modal || !modalImage) return;
    galleryTrigger = document.activeElement;
    modalImage.src = src;
    if (alt) {
      modalImage.alt = alt;
      modal.setAttribute('aria-label', alt);
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalClose?.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (galleryTrigger instanceof HTMLElement) galleryTrigger.focus();
  };

  galleryItems.forEach((item) => {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    const image = item.querySelector('img');
    if (image?.alt) item.setAttribute('aria-label', image.alt);
    item.addEventListener('click', () => openModal(item.dataset.galleryImage, image?.alt));
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(item.dataset.galleryImage, image?.alt);
      }
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const message = form.querySelector('.form-message');
      const fields = form.querySelectorAll('input, select, textarea');
      const submitButton = form.querySelector('[type="submit"]');
      let valid = true;
      const translate = (text) => window.papyrusTranslate?.(text) || text;
      message.textContent = '';
      message.className = 'form-message';

      fields.forEach((field) => {
        const missingValue = field.type === 'file'
          ? field.files.length === 0
          : field.type === 'checkbox'
            ? !field.checked
          : !field.value.trim();
        if (field.hasAttribute('required') && missingValue) {
          field.classList.add('invalid');
          valid = false;
        } else {
          field.classList.remove('invalid');
        }
      });

      if (!form.checkValidity()) {
        form.reportValidity();
        valid = false;
      }

      const passportPhotos = form.querySelector('[name="passportPhotos"]');
      if (passportPhotos && passportPhotos.files.length !== 4) {
        passportPhotos.classList.add('invalid');
        valid = false;
        message.className = 'form-message error';
        message.textContent = translate('Please upload exactly four passport photos.');
      }

      fields.forEach((field) => {
        if (field.type === 'file') {
          for (const file of field.files) {
            if (file.size > 5 * 1024 * 1024) {
              field.classList.add('invalid');
              valid = false;
              message.className = 'form-message error';
              message.textContent = translate('Each document must be no larger than 5 MB.');
              break;
            }
            if (file.type && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
              field.classList.add('invalid');
              valid = false;
              message.className = 'form-message error';
              message.textContent = translate('Documents must be PDF, JPEG or PNG files.');
              break;
            }
          }
        }
      });

      if (!valid) {
        if (!message.textContent) {
          message.className = 'form-message error';
          message.textContent = translate('Please complete all required fields before submitting your application.');
        }
        return;
      }

      if (!form.hasAttribute('data-application')) {
        message.className = 'form-message error';
        message.textContent = translate('This contact form is not connected yet. Please call or message the school directly.');
        return;
      }

      if (submitButton) submitButton.disabled = true;
      message.className = 'form-message info';
      message.textContent = translate('Sending your application securely…');

      const apiBaseUrl = window.PAPYRUS_API_BASE_URL?.trim().replace(/\/+$/, '');
      if (!apiBaseUrl && location.hostname.endsWith('.github.io')) {
        message.className = 'form-message error';
        message.textContent = translate('The application service is not connected yet. Please contact the school directly.');
        if (submitButton) submitButton.disabled = false;
        return;
      }
      const applicationEndpoint = apiBaseUrl
        ? `${apiBaseUrl}/api/applications`
        : form.action;

      fetch(applicationEndpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(async (response) => {
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(translate(result.error || 'Your application could not be submitted. Please try again later.'));
          }
          return result;
        })
        .then((result) => {
          const reference = String(result.reference || '');
          try {
            sessionStorage.setItem('papyrus-parent-follow', JSON.stringify({
              reference,
              email: String(form.elements.email?.value || '').trim()
            }));
          } catch (error) {
            console.warn('Could not save the parent follow-up session.', error);
            message.className = 'form-message success';
            message.replaceChildren(document.createTextNode(`${translate('Application received securely. Your reference is')} ${reference}. `));
            const followLink = document.createElement('a');
            followLink.href = `suivi.html?reference=${encodeURIComponent(reference)}`;
            followLink.textContent = translate('Follow this application');
            message.append(followLink);
            form.reset();
            return;
          }
          window.location.assign(`suivi.html?reference=${encodeURIComponent(reference)}&submitted=1`);
        })
        .catch((error) => {
          message.className = 'form-message error';
          message.textContent = translate(error.message);
        })
        .finally(() => {
          if (submitButton) submitButton.disabled = false;
        });
    });
  });
});
