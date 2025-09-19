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
 * Features smart detection for gentle animations when already near the form
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
                    // Check if user is already near the form
                    const isFormVisible = isElementInViewport(targetForm);
                    
                    if (isFormVisible) {
                        // User is already near the form - use gentle animation
                        handleGentleFormActivation(targetForm);
                    } else {
                        // User needs to scroll to form - use normal scroll behavior
                        handleScrollToForm(targetForm);
                    }
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

/**
 * Check if an element is currently visible in the viewport
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} True if element is at least 50% visible
 */
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // Calculate if at least 50% of the element is visible
    const verticalInView = (rect.top <= windowHeight * 0.5) && (rect.bottom >= windowHeight * 0.5);
    const horizontalInView = (rect.left <= windowWidth) && (rect.right >= 0);
    
    return verticalInView && horizontalInView;
}

/**
 * Handle gentle form activation when user is already near the form
 * Uses subtle animations and immediate focus without scrolling
 * @param {HTMLElement} targetForm - The form container element
 */
function handleGentleFormActivation(targetForm) {
    console.log('🎯 User already near form - using gentle activation');
    
    // Add gentle pulse animation to form container
    targetForm.style.transform = 'scale(1.02)';
    targetForm.style.transition = 'transform 0.3s ease-out, box-shadow 0.3s ease-out';
    targetForm.style.boxShadow = '0 0 20px rgba(248, 207, 31, 0.3)';
    
    // Return to normal state after animation
    setTimeout(() => {
        targetForm.style.transform = 'scale(1)';
        targetForm.style.boxShadow = '';
        
        // Clean up inline styles after transition
        setTimeout(() => {
            targetForm.style.transition = '';
        }, 300);
    }, 300);
    
    // Focus on first field immediately (no delay needed)
    setTimeout(() => {
        focusFirstField();
    }, 150); // Small delay to let pulse animation start first
}

/**
 * Handle normal scroll-to-form behavior
 * Uses smooth scrolling with delayed focus
 * @param {HTMLElement} targetForm - The form container element
 */
function handleScrollToForm(targetForm) {
    console.log('📜 Scrolling to form');
    
    // Smooth scroll to the form
    targetForm.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    // Wait for scroll to complete, then focus on first field
    setTimeout(() => {
        focusFirstField();
    }, 800); // Wait for scroll animation to complete
}

/**
 * Focus on the first form field with highlight effect
 * Consistent behavior for both gentle activation and scroll scenarios
 */
function focusFirstField() {
    const firstField = document.querySelector('#hero-name');
    if (firstField) {
        firstField.focus();
        
        // Add subtle highlight effect
        firstField.style.boxShadow = '0 0 0 3px rgba(248, 207, 31, 0.3)';
        
        // Remove highlight after a moment
        setTimeout(() => {
            firstField.style.boxShadow = '';
        }, 1500);
        
        console.log('✨ First field focused with highlight effect');
    }
}

// Initialize all navigation functionality
function initNavigation() {
    initMobileMenu();
    initSmoothScrollingWithFocus();
}

// Initialize navigation on DOM load
document.addEventListener('DOMContentLoaded', initNavigation);
