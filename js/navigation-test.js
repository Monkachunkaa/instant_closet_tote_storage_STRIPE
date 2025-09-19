/**
 * NAVIGATION TEST UTILITY
 * Test script to verify enhanced navigation functionality
 * Tests both "Start Storing Today" and "Ready to Get Started?" buttons
 * This file can be removed after testing - it's just for validation
 */

function testNavigationFeatures() {
    console.log('🧪 Testing Enhanced Navigation Features...');
    
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
    
    // Test 6: Verify enhanced behavior will work
    if (heroFormButtons.length >= 3 && heroForm && firstField) {
        console.log('✅ All elements present - enhanced navigation should work for all buttons!');
        
        // Log what will happen when buttons are clicked
        console.log('📋 When any CTA button is clicked:');
        console.log('   1. Page smoothly scrolls to hero form');
        console.log('   2. Name field receives focus');
        console.log('   3. Subtle highlight effect appears');
        console.log('   4. User can immediately start typing');
        
        console.log('🎯 Expected buttons with enhanced navigation:');
        console.log('   • "Get Started" (Navbar CTA)');
        console.log('   • "Start Storing Today" (Pricing section)');
        console.log('   • "Ready to Get Started?" (FAQ section)');
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
