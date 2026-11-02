document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');
  const counter = document.getElementById('loading-counter');
  const status = document.getElementById('loading-status');
  const progressBar = document.querySelector('.loader-progress');
  const progressFill = document.getElementById('loading-progress');
  const loadingPhrases = [
    'IGNITING SYSTEMS...',
    'LOADING ATHLETES...',
    'PREPARING ARENA...',
    'BUILDING STRENGTH...',
    'GET READY...'
  ];

  if (preloader) {
    let progress = 0;
    const interval = setInterval(() => {
      progress = Math.min(progress + Math.floor(Math.random() * 12) + 6, 100);
      if (counter) counter.textContent = `${progress}%`;
      if (progressFill) progressFill.style.width = `${progress}%`;
      if (progressBar) progressBar.setAttribute('aria-valuenow', String(progress));
      if (status && progress < 100) {
        const index = Math.floor((progress / 100) * loadingPhrases.length);
        status.textContent = loadingPhrases[Math.min(index, loadingPhrases.length - 1)];
      }
      if (progress === 100) {
        clearInterval(interval);
        setTimeout(() => preloader.classList.add('fade-out'), 500);
      }
    }, 100);
  }

  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 30);
  });

  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    const toggleNavigation = () => {
      const isOpen = navLinks.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    };
    hamburger.setAttribute('role', 'button');
    hamburger.setAttribute('tabindex', '0');
    hamburger.setAttribute('aria-label', 'Toggle navigation');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.addEventListener('click', toggleNavigation);
    hamburger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleNavigation();
      }
    });
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const footerYear = document.getElementById('footer-year');
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  const searchForms = document.querySelectorAll('.nav-search');
  searchForms.forEach((form) => {
    const searchInput = form.querySelector('input[type="search"]');
    const searchStatus = form.querySelector('.nav-search-status');
    if (!searchInput) return;

    const clearMatches = () => {
      document.querySelectorAll('.search-match').forEach((item) => item.classList.remove('search-match'));
      if (searchStatus) searchStatus.textContent = '';
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const term = searchInput.value.trim().toLocaleLowerCase();
      clearMatches();
      if (!term) {
        if (searchStatus) searchStatus.textContent = 'Enter a search term.';
        return;
      }

      const matches = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, .card, .program-card, .sport-card, .trainer-card'))
        .filter((item) => item.textContent.toLocaleLowerCase().includes(term));
      matches.forEach((item) => item.classList.add('search-match'));
      if (searchStatus) searchStatus.textContent = matches.length
        ? `${matches.length} matching sections found.`
        : 'No matches found on this page.';
      if (matches[0]) matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    searchInput.addEventListener('input', () => {
      if (!searchInput.value.trim()) clearMatches();
    });
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        searchInput.value = '';
        clearMatches();
      }
    });
  });
});
