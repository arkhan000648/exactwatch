document.addEventListener('DOMContentLoaded', () => {

    // --- 1. MOBILE MENU LOGIC ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const menuOverlay = document.querySelector('.mobile-menu-overlay');
    const closeMenu = document.querySelector('.close-menu');

    function toggleMenu() {
        if (menuOverlay) {
            menuOverlay.classList.toggle('active');
        }
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }
    
    if (closeMenu) {
        closeMenu.addEventListener('click', toggleMenu);
    }

    // --- 2. DYNAMIC YEAR LOGIC ---
    const yearSpan = document.getElementById('dynamic-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});