document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. AUTO-FRESH DATE LOGIC ---
    // Sets date to "01 [Current Month], [Current Year]"
    const dateSpan = document.getElementById('auto-fresh-date');
    const footerYear = document.getElementById('footer-year');

    if (dateSpan) {
        const now = new Date();
        const month = now.toLocaleString('en-US', { month: 'long' });
        const year = now.getFullYear();
        
        // Example: "01 December, 2025"
        dateSpan.textContent = `01 ${month}, ${year}`;
        
        if(footerYear) footerYear.textContent = year;
    }

    // --- 2. MOBILE MENU LOGIC ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const menuOverlay = document.querySelector('.mobile-menu-overlay');
    const closeMenu = document.querySelector('.close-menu');

    function toggleMenu() {
        if(menuOverlay) {
            menuOverlay.classList.toggle('active');
        }
    }

    if(menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }
    if(closeMenu) {
        closeMenu.addEventListener('click', toggleMenu);
    }
});