(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const body = document.body;
  const header = $('.site-header');
  const menuButton = $('.menu-toggle');
  const nav = $('.site-nav');
  const topButton = $('.to-top');

  const syncScrollState = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 20);
    topButton?.classList.toggle('is-visible', window.scrollY > 500);
  };

  window.addEventListener('scroll', syncScrollState, { passive: true });
  syncScrollState();

  const closeMenu = () => {
    nav?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    body.classList.toggle('menu-open', isOpen);
  });
  $$('.site-nav a').forEach(link => link.addEventListener('click', closeMenu));
  topButton?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const openModal = modal => {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    window.setTimeout(() => $('[data-close]', modal)?.focus(), 100);
  };

  const closeModal = modal => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!$('.modal.is-open')) body.classList.remove('modal-open');
  };

  $$('[data-modal]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      openModal($(button.dataset.modal));
    });
  });
  $$('.modal').forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal || event.target.closest('[data-close]')) closeModal(modal);
    });
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
      $$('.modal.is-open').forEach(closeModal);
    }
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(element => revealObserver.observe(element));
  } else {
    $$('.reveal').forEach(element => element.classList.add('is-visible'));
  }

  const reviewsTrack = $('.reviews-track');
  if (reviewsTrack) {
    const reviews = $$('.review', reviewsTrack);
    let currentReview = 0;
    const showReview = index => {
      currentReview = (index + reviews.length) % reviews.length;
      reviewsTrack.style.transform = `translateX(-${currentReview * 100}%)`;
    };
    $('.review-next')?.addEventListener('click', () => showReview(currentReview + 1));
    $('.review-prev')?.addEventListener('click', () => showReview(currentReview - 1));
    window.setInterval(() => showReview(currentReview + 1), 7000);
  }

  const filterButtons = $$('.filter-button');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(item => item.classList.remove('is-active'));
      button.classList.add('is-active');
      $$('.gallery-item').forEach(item => {
        const matches = button.dataset.filter === 'all' || item.dataset.category === button.dataset.filter;
        item.classList.toggle('is-hidden', !matches);
      });
    });
  });

  $$('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const source = $('img', item);
      const target = $('#lightbox-image');
      if (!source || !target) return;
      target.src = source.src;
      target.alt = source.alt;
      $('#lightbox-caption').textContent = source.alt;
      openModal($('#lightbox'));
    });
  });

  $$('.application-form').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const status = $('.form-status', form);
      const button = $('button[type="submit"]', form);
      const phone = $('[name="phone"]', form);
      if (phone && phone.value.replace(/\D/g, '').length < 10) {
        status.textContent = 'Вкажіть коректний номер телефону.';
        phone.focus();
        return;
      }

      button.disabled = true;
      status.textContent = 'Надсилаємо заявку…';
      try {
        const response = await fetch(form.action, { method: 'POST', body: new FormData(form) });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.message || 'Помилка надсилання');
        form.reset();
        status.textContent = 'Дякуємо! Заявку надіслано. Ми зв’яжемося з вами.';
        status.classList.add('is-success');
      } catch (error) {
        status.textContent = 'Форма ще не підключена до бота. Зателефонуйте або напишіть нам у Telegram.';
        status.classList.remove('is-success');
      } finally {
        button.disabled = false;
      }
    });
  });

  $$('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });
})();
