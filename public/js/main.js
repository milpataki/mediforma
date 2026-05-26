'use strict';

/* ── Parallax ──────────────────────────────────────────────
   Translates .parallax-bg elements vertically based on their
   data-speed attribute (0 = static, 1 = full scroll speed).
   Uses requestAnimationFrame + passive scroll for 60fps.
──────────────────────────────────────────────────────────── */
const parallaxLayers = [];

document.querySelectorAll('.parallax-bg').forEach(el => {
  parallaxLayers.push({ el, speed: parseFloat(el.dataset.speed ?? '0.4') });
});

function updateParallax() {
  const scrollY = window.scrollY;
  parallaxLayers.forEach(({ el, speed }) => {
    const section = el.closest('.parallax-section');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const offsetFromCenter = rect.top + rect.height / 2 - window.innerHeight / 2;
    el.style.transform = `translate3d(0, ${offsetFromCenter * speed * -1}px, 0)`;
  });
}

/* ── Nav scroll state ──────────────────────────────────────── */
const nav = document.getElementById('nav');

function updateNav() {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}

/* ── Scroll driver ─────────────────────────────────────────── */
let ticking = false;

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateParallax();
      updateNav();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// Initial paint
updateParallax();
updateNav();

/* ── IntersectionObserver — reveal & fade-in ─────────────── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal, .fade-in').forEach(el => revealObserver.observe(el));

/* ── Animated counters ───────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat__number').forEach(animateCounter);
        statsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

const statsBand = document.querySelector('.stats-band');
if (statsBand) statsObserver.observe(statsBand);

/* ── Mobile nav ──────────────────────────────────────────── */
const burger = document.getElementById('burger');
const navLinks = document.querySelector('.nav__links');

burger?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    nav.classList.remove('scrolled');
  } else {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
    document.body.style.overflow = '';
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
});

/* ── Contact form ────────────────────────────────────────── */
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const t = key => (typeof i18next !== 'undefined' ? i18next.t(key) : key);
  const data = Object.fromEntries(new FormData(form));
  if (!data.name || !data.email) {
    showStatus(t('form.required'), 'error');
    return;
  }

  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = t('form.sending');

  try {
    const res = await fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      showStatus(t('form.success'), 'success');
      form.reset();
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch {
    showStatus(t('form.error'), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = t('form.submit');
  }
});

function showStatus(msg, type) {
  status.textContent = msg;
  status.className = `form-note ${type}`;
}

/* ── Smooth active section highlight ────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav__links a[href^="#"]');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchors.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav__links a[href="#${entry.target.id}"]`);
        active?.classList.add('active');
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach(s => sectionObserver.observe(s));
