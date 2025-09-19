/**
 * NAVIGATION FUNCTIONALITY
 * Mobile menu and navigation interactions
 * Enhanced form navigation with auto-focus
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
}

/**
 * Initialize smooth scrolling with form focus enhancement
 * Adds auto-focus functionality for buttons that link to the hero form
 * Handles: "Get Started" (navbar), "Start Storing Today", and "Ready to Get Started?" buttons
 */
function initSmoothScrollingWithFocus() {
    // Find all buttons that link to the hero form
    const heroFormButtons = document.querySelectorAll('a[href="#hero-form"]');
    
    if (heroFormButtons.length > 0) {
        heroFormButtons.forEach((button, index) => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get the target form container
                const targetForm = document.querySelector('#hero-form');
                
                if (targetForm) {
                    // Smooth scroll to the form
                    targetForm.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Wait for scroll to complete, then focus on first field
                    setTimeout(() => {
                        const firstField = document.querySelector('#hero-name');
                        if (firstField) {
                            firstField.focus();
                            // Optional: Add a subtle highlight effect
                            firstField.style.boxShadow = '0 0 0 3px rgba(248, 207, 31, 0.3)';
                            
                            // Remove highlight after a moment
                            setTimeout(() => {
                                firstField.style.boxShadow = '';
                            }, 1500);
                        }
                    }, 800); // Wait for scroll animation to complete
                }
            });
        });
        
        console.log(`✅ Enhanced navigation added to ${heroFormButtons.length} button(s) that link to hero form`);
        
        // Log which buttons were enhanced
        heroFormButtons.forEach((button, index) => {
            const buttonText = button.textContent.trim();
            console.log(`   ${index + 1}. "${buttonText}" button`);
        });
    }
}

// Initialize all navigation functionality
function initNavigation() {
    initMobileMenu();
    initSmoothScrollingWithFocus();
}

// Initialize navigation on DOM load
document.addEventListener('DOMContentLoaded', initNavigation);
