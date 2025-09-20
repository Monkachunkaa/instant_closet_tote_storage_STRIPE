/**
 * INSTANT CLOSET TOTE STORAGE - MAIN JAVASCRIPT
 * Main functionality and initialization
 * 
 * @version 2.0.0 - Removed unused WebP detection, optimized performance
 */

// Initialize EmailJS
(function() {
    emailjs.init({
        publicKey: '3bZXI322cqKC56DBj'
    });
})();

// Note: WebP images are used with <picture> fallbacks in HTML - no JS detection needed

// Smooth scrolling for navigation links (only for same-page links)
// Excludes links that have enhanced behavior in navigation.js
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        // Skip buttons that link to the hero form - they have enhanced behavior in navigation.js
        if (anchor.getAttribute('href') === '#hero-form') {
            return; // Skip this link, let navigation.js handle it with focus enhancement
        }
        
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Header scroll effect
function initHeaderScrollEffect() {
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(70, 72, 71, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'var(--dark)';
            header.style.backdropFilter = 'none';
        }
    });
}

// Initialize all main functionality
function initMain() {
    initSmoothScrolling();
    initHeaderScrollEffect();
}

// Run on DOM content loaded
document.addEventListener('DOMContentLoaded', initMain);
