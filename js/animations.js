/**
 * ANIMATIONS AND INTERACTIONS
 * Scroll animations, FAQ functionality, and visual effects
 * 
 * @version 2.0.0 - Removed unused parallax effect for better performance
 */

// Scroll animation observer
function createScrollObserver() {
    const observerOptions = {
        threshold: 0.05,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe service cards with staggered delay
    document.querySelectorAll('.service-card').forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.15}s`;
        observer.observe(card);
    });

    // Observe timeline items with staggered delay
    document.querySelectorAll('.timeline li').forEach((item, index) => {
        item.style.transitionDelay = `${index * 0.2}s`;
        observer.observe(item);
    });

    // Observe other fade-in elements
    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });
}

// FAQ functionality
function initializeFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const faqAnswer = faqItem.querySelector('.faq-answer');
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            // Close all other FAQ items
            faqQuestions.forEach(otherQuestion => {
                if (otherQuestion !== this) {
                    otherQuestion.setAttribute('aria-expanded', 'false');
                    const otherAnswer = otherQuestion.parentElement.querySelector('.faq-answer');
                    otherAnswer.classList.remove('active');
                }
            });
            
            // Toggle current FAQ item
            if (isExpanded) {
                this.setAttribute('aria-expanded', 'false');
                faqAnswer.classList.remove('active');
            } else {
                this.setAttribute('aria-expanded', 'true');
                faqAnswer.classList.add('active');
            }
        });
    });
}

// Note: Parallax effect removed for better performance and accessibility

// Initialize all animations and interactions
function initAnimations() {
    createScrollObserver();
    initializeFAQ();
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', initAnimations);
