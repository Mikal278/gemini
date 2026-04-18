// ─── MOBILE NAVIGATION ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Toggle menu
  navToggle?.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // Close menu when link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-container')) {
      navMenu.classList.remove('active');
    }
  });
});

// ─── SMOOTH SCROLL FOR ANCHOR LINKS ──────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href !== '#' && document.querySelector(href)) {
      e.preventDefault();
      const element = document.querySelector(href);
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── INTERSECTION OBSERVER FOR ANIMATIONS ────────────────────────────────
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 
