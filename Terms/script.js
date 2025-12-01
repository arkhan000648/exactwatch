document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. AUTO-FRESH DATE LOGIC ---
    // This will always show "01 Month, Year" (e.g., "01 December, 2025")
    const dateSpan = document.getElementById('auto-fresh-date');
    const footerYear = document.getElementById('footer-year');

    if (dateSpan) {
        const now = new Date();
        const month = now.toLocaleString('en-US', { month: 'long' }); // e.g., "December"
        const year = now.getFullYear();
        
        // Format: "01 December, 2025"
        dateSpan.textContent = `01 ${month}, ${year}`;
        
        // Update Footer Year as well
        if(footerYear) footerYear.textContent = year;
    }

    // --- 2. MOBILE MENU LOGIC ---
    // Copied here because we unlinked the main script to fix errors
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