/**
 * Ultra-Lightweight Scroll Reveal Engine
 * 60fps / 120fps hardware-accelerated entrance transitions
 * Fast 0.32s timing, zero blur filters, auto-cleanup of completed animations
 */

export function initScrollReveal() {
  if (typeof window === 'undefined') return;

  // Respect user preference for reduced motion
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    return;
  }

  // 1. Target key container sections and cards with subtle stagger (max 0.04s step, capped at 0.16s)
  const staggerGroups = [
    { container: '#sponsors-section .sponsors-mini-grid', items: '.sponsor-mini-card', step: 0.04 },
    { container: '.dossier-timeline-grid', items: '.dossier-card', step: 0.05 },
    { container: '.conduct-grid', items: '.conduct-card', step: 0.04 },
    { container: '.faq-container', items: '.faq-item', step: 0.03 }
  ];

  staggerGroups.forEach(({ container, items, step }) => {
    const parent = document.querySelector(container);
    if (parent) {
      const children = parent.querySelectorAll(items);
      children.forEach((child, idx) => {
        child.classList.add('scroll-reveal');
        const delay = Math.min(idx * step, 0.16);
        if (delay > 0) {
          child.style.setProperty('--reveal-delay', `${delay.toFixed(2)}s`);
        }
      });
    }
  });

  // 2. Standalone headers & main interactive blocks
  const standaloneSelectors = [
    '.sponsors-mini-header',
    '.host-campus-strip',
    '.timeline-header',
    '#conduct-section .section-header',
    '#faq-section .section-header',
    '.contact-box',
    '.footer-container'
  ];

  standaloneSelectors.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add('scroll-reveal');
    }
  });

  const allRevealElements = Array.from(document.querySelectorAll('.scroll-reveal'));
  if (allRevealElements.length === 0) return;

  // Helper to mark an element revealed and clean up transition styles after it settles
  const revealElement = (el, immediate = false) => {
    if (el.classList.contains('is-revealed')) return;
    el.classList.add('is-revealed');

    if (immediate) {
      el.classList.add('reveal-complete');
      el.style.removeProperty('--reveal-delay');
      return;
    }

    const rawDelay = el.style.getPropertyValue('--reveal-delay') || '0s';
    const delayMs = (parseFloat(rawDelay) || 0) * 1000;
    setTimeout(() => {
      el.classList.add('reveal-complete');
      el.style.removeProperty('--reveal-delay');
    }, delayMs + 340);
  };

  // 3. Early trigger margin: reveal 80px before entering viewport so animations are seamless
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealElement(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px 80px 0px',
    threshold: 0
  });

  // 4. Initial check: elements already above or inside viewport reveal immediately with zero delay
  const vh = window.innerHeight;
  allRevealElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh + 40 && rect.bottom > -50) {
      revealElement(el, true);
    } else {
      revealObserver.observe(el);
    }
  });

  // 5. When timeline unlocks or window resizes, immediately reveal visible elements
  const handleVisibleSync = () => {
    const currentVh = window.innerHeight;
    allRevealElements.forEach(el => {
      if (!el.classList.contains('is-revealed')) {
        const rect = el.getBoundingClientRect();
        if (rect.top < currentVh + 40 && rect.bottom > -50) {
          revealElement(el, true);
          revealObserver.unobserve(el);
        }
      }
    });
  };

  window.addEventListener('timelineUnlocked', handleVisibleSync, { passive: true });
  window.addEventListener('resize', handleVisibleSync, { passive: true });
}
