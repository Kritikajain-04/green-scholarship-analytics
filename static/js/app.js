/* ═══════════════════════════════════════════════════════
   GREEN SCHOLARSHIP — CORE APP JS
   Covers: Navbar scroll, mobile menu, user session,
           dropdown, scroll animations
   Version: 2.0 (Phase 2)
═══════════════════════════════════════════════════════ */

'use strict';

/* ─── Student Name from sessionStorage ─────────────── */
(function hydrateUserName() {
  const name = sessionStorage.getItem('gs_name') || 'Student';
  const topbarName    = document.getElementById('topbar-student-name');
  const navbarName    = document.getElementById('navbar-user-name');
  if (topbarName) topbarName.textContent = name;
  if (navbarName)  navbarName.textContent  = name;
})();

/* ─── Navbar Scroll Shadow ──────────────────────────── */
(function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ─── Mobile Hamburger Menu ─────────────────────────── */
(function initMobileNav() {
  const btn     = document.getElementById('hamburger-btn');
  const nav     = document.getElementById('mobile-nav');
  const overlay = document.getElementById('mobile-nav-overlay');
  if (!btn || !nav || !overlay) return;

  function open() {
    nav.classList.add('open');
    overlay.classList.add('show');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    nav.classList.remove('open');
    overlay.classList.remove('show');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    nav.classList.contains('open') ? close() : open();
  });

  overlay.addEventListener('click', close);

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // Close when a mobile nav link is clicked
  nav.querySelectorAll('.mobile-nav__link').forEach(link => {
    link.addEventListener('click', close);
  });
})();

/* ─── Student User Dropdown Controls ───────────────────── */
(function initUserDropdown() {
  const userArea = document.getElementById('navbar-user');
  const dropdown = document.getElementById('user-dropdown');
  if (!userArea || !dropdown) return;

  userArea.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!userArea.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  dropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });
  });
})();

/* ─── Scroll-triggered Animations ──────────────────── */
(function initScrollAnimations() {
  const targets = document.querySelectorAll('[data-animate]');
  if (!targets.length || !('IntersectionObserver' in window)) {
    // Fallback: make all visible immediately
    targets.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();

/* ─── Smooth Scroll for anchor links ────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
