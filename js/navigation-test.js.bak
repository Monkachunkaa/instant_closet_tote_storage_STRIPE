/**
 * NAVIGATION TEST UTILITY
 * Test script to verify enhanced navigation functionality with smart detection
 * Tests both "Get Started", "Start Storing Today" and "Ready to Get Started?" buttons
 * Validates gentle animation vs scroll behavior based on viewport position
 * This file can be removed after testing - it's just for validation
 */

function testNavigationFeatures() {
    console.log('🧪 Testing Enhanced Navigation Features with Smart Detection...');
    
    // Test 1: Check if all buttons linking to hero form exist
    const heroFormButtons = document.querySelectorAll('a[href="#hero-form"]');
    console.log(`✅ Hero form buttons found: ${heroFormButtons.length}`);
    
    // Test 2: Identify each button
    heroFormButtons.forEach((button, index) => {
        const buttonText = button.textContent.trim();
        console.log(`   ${index + 1}. "${buttonText}" button`);
    });
    
    // Test 3: Check if hero form container exists
    const heroForm = document.querySelector('#hero-form');
    console.log('✅ Hero form container found:', !!heroForm);
    
    // Test 4: Check if first form field exists
    const firstField = document.querySelector('#hero-name');
    console.log('✅ First form field (name) found:', !!firstField);
    
    // Test 5: Check if navigation.js functions are loaded
    console.log('✅ Navigation functions loaded:', typeof initSmoothScrollingWithFocus === 'function');
    console.log('✅ Smart detection function loaded:', typeof isElementInViewport === 'function');
    
    // Test 6: Test viewport detection if form exists
    if (heroForm) {
        const isFormVisible = typeof isElementInViewport === 'function' ? isElementInViewport(heroForm) : false;
        console.log(`🔍 Form currently in viewport: ${isFormVisible}`);
        
        if (isFormVisible) {
            console.log('   → CTA clicks will use gentle pulse animation');
        } else {
            console.log('   → CTA clicks will use smooth scroll behavior');
        }
    }
    
    // Test 7: Verify enhanced behavior will work
    if (heroFormButtons.length >= 3 && heroForm && firstField) {
        console.log('✅ All elements present - smart enhanced navigation should work for all buttons!');
        
        // Log what will happen when buttons are clicked
        console.log('📋 Smart Navigation Behavior:');
        console.log('   IF user can see the form:');
        console.log('     1. Gentle pulse animation (scale + glow)');
        console.log('     2. Name field receives focus immediately');
        console.log('     3. Subtle highlight effect appears');
        console.log('   IF user needs to scroll:');
        console.log('     1. Smooth scroll to form');
        console.log('     2. Name field receives focus after scroll');
        console.log('     3. Subtle highlight effect appears');
        
        console.log('🎯 Expected buttons with smart enhanced navigation:');
        console.log('   • "Get Started" (Navbar CTA)');
        console.log('   • "Start Storing Today" (Pricing section)');
        console.log('   • "Ready to Get Started?" (FAQ section)');
        
        console.log('🔧 Technical Features:');
        console.log('   • Viewport detection (50% visibility threshold)');
        console.log('   • Gentle pulse animation (1.02 scale + golden glow)');
        console.log('   • Smart timing (150ms vs 800ms delay)');
        console.log('   • Consistent focus behavior across scenarios');
    } else {
        console.log('❌ Missing elements - check HTML structure');
        console.log('Expected: 3 buttons, hero form, and name field');
        console.log(`Found: ${heroFormButtons.length} buttons, ${!!heroForm ? 'hero form' : 'no hero form'}, ${!!firstField ? 'name field' : 'no name field'}`);
    }
}

// Run test when DOM is loaded (after other scripts)
document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for other scripts to initialize
    setTimeout(testNavigationFeatures, 1000);
});
