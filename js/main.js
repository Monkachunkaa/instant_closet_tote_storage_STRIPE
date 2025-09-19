/**
 * INSTANT CLOSET TOTE STORAGE - MAIN JAVASCRIPT
 * Main functionality and initialization
 */

// Initialize EmailJS
(function() {
    emailjs.init({
        publicKey: '3bZXI322cqKC56DBj'
    });
})();

// WebP Support Detection
function checkWebPSupport() {
    const webP = new Image();
    webP.onload = webP.onerror = function () {
        if (webP.height === 2) {
            document.documentElement.classList.add('webp');
        } else {
            document.documentElement.classList.add('no-webp');
        }
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
}

// Smooth scrolling for navigation links (only for same-page links)
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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
    checkWebPSupport();
    initSmoothScrolling();
    initHeaderScrollEffect();
}

// Run on DOM content loaded
document.addEventListener('DOMContentLoaded', initMain);
