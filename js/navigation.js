/**
 * NAVIGATION FUNCTIONALITY - OPTIMIZED VERSION
 * Mobile menu and enhanced form navigation
 * 
 * @version 2.0.0 - Simplified cross-page logic, better performance
 */

/**
 * Initialize mobile menu functionality
 * Handles mobile menu toggle, outside clicks, and link navigation
 */
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const nav = document.querySelector('nav');

    if (!mobileMenuBtn || !navLinks || !nav) return;

    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('mobile-open');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('mobile-open');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target) && navLinks.classList.contains('mobile-open')) {
            navLinks.classList.remove('mobile-open');
        }
    });

    console.log('✅ Mobile menu initialized');
}

/**
 * Enhanced navigation for hero form buttons
 * Provides smooth scrolling with focus enhancement for form CTAs
 */
function initHeroFormNavigation() {
    // Find all buttons that link to the hero form
    const heroFormButtons = document.querySelectorAll('a[href="#hero-form"], a[href="index.html#hero-form"]');
    
    if (heroFormButtons.length === 0) return;
    
    console.log(`🔍 Found ${heroFormButtons.length} hero form navigation buttons`);
    
    heroFormButtons.forEach((button, index) => {
        const href = button.getAttribute('href');
        const buttonText = button.textContent.trim();
        
        button.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Handle cross-page navigation (from contact.html to index.html)
            if (href === 'index.html#hero-form') {
                // Store intent for the next page
                sessionStorage.setItem('focusHeroForm', 'true');
                console.log('🔄 Cross-page navigation to hero form stored');
                return; // Let browser handle navigation
            }
            
            // Handle same-page navigation (on index.html)
            if (href === '#hero-form') {
                e.preventDefault();
                const targetForm = document.querySelector('#hero-form');
                
                if (targetForm) {
                    // Check if form is already visible
                    const rect = targetForm.getBoundingClientRect();
                    const isVisible = rect.top >= 0 && rect.top <= window.innerHeight * 0.6;
                    
                    if (isVisible) {
                        // Form is visible - gentle focus
                        handleGentleFocus(targetForm);
                    } else {
                        // Form not visible - scroll and focus
                        handleScrollAndFocus(targetForm);
                    }
                }
            }
        });
    });
    
    console.log(`✅ Enhanced navigation added to ${heroFormButtons.length} form buttons`);
}

/**
 * Handle gentle focus when form is already visible
 * @param {HTMLElement} targetForm - The form container element
 */
function handleGentleFocus(targetForm) {
    console.log('🎯 Form visible - using gentle focus');
    
    // Subtle highlight animation
    targetForm.style.transition = 'transform 0.3s ease-out, box-shadow 0.3s ease-out';
    targetForm.style.transform = 'scale(1.02)';
    targetForm.style.boxShadow = '0 0 20px rgba(248, 207, 31, 0.3)';
    
    // Return to normal
    setTimeout(() => {
        targetForm.style.transform = 'scale(1)';
        targetForm.style.boxShadow = '';
        setTimeout(() => targetForm.style.transition = '', 300);
    }, 300);
    
    // Focus first field
    setTimeout(() => focusFirstField(), 150);
}

/**
 * Handle scroll and focus when form is not visible
 * @param {HTMLElement} targetForm - The form container element
 */
function handleScrollAndFocus(targetForm) {
    console.log('📜 Scrolling to form');
    
    targetForm.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    // Focus after scroll completes
    setTimeout(() => focusFirstField(), 800);
}

/**
 * Focus on the first form field with highlight effect
 */
function focusFirstField() {
    const firstField = document.querySelector('#hero-name');
    if (firstField) {
        firstField.focus();
        
        // Add highlight effect
        firstField.style.boxShadow = '0 0 0 3px rgba(248, 207, 31, 0.3)';
        setTimeout(() => firstField.style.boxShadow = '', 1500);
        
        console.log('✨ First field focused');
    }
}

/**
 * Check for cross-page navigation intent
 * Handles navigation from contact.html to index.html#hero-form
 */
function checkCrossPageNavigation() {
    // Only run on index page
    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        return;
    }
    
    const shouldFocus = sessionStorage.getItem('focusHeroForm');
    
    if (shouldFocus === 'true') {
        console.log('🎯 Cross-page navigation detected');
        
        // Clear the flag
        sessionStorage.removeItem('focusHeroForm');
        
        // Wait for page to load, then scroll to form
        setTimeout(() => {
            const targetForm = document.querySelector('#hero-form');
            if (targetForm) {
                handleScrollAndFocus(targetForm);
            }
        }, 500);
    }
}

/**
 * Initialize all navigation functionality
 */
function initNavigation() {
    initMobileMenu();
    initHeroFormNavigation();
    checkCrossPageNavigation();
    
    console.log('✅ Navigation system initialized');
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initNavigation);