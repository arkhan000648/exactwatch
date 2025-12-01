document.addEventListener('DOMContentLoaded', () => {

    // --- 1. MOBILE MENU LOGIC (Merged here since main script is not loaded) ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const menuOverlay = document.querySelector('.mobile-menu-overlay');
    const closeMenu = document.querySelector('.close-menu');

    function toggleMenu() {
        if(menuOverlay) {
            menuOverlay.classList.toggle('active');
        }
    }

    if(menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if(closeMenu) closeMenu.addEventListener('click', toggleMenu);

    // --- 2. DYNAMIC YEAR LOGIC ---
    const yearSpan = document.getElementById('dynamic-year');
    if(yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- 3. CONTACT FORM LOGIC ---
    const form = document.getElementById('contactForm');
    const statusDiv = document.getElementById('status-message');
    const submitBtn = document.querySelector('.submit-btn');
    const btnText = document.querySelector('.btn-text');

    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent page reload

            // Show Loading State
            const originalBtnText = btnText.textContent;
            btnText.textContent = "Sending...";
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";
            statusDiv.classList.add('hidden');

            // Gather Data
            const formData = new FormData(form);

            // Send to FormSubmit via AJAX
            fetch("https://formsubmit.co/ajax/" + formData.get('_to'), {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Success
                form.reset();
                statusDiv.textContent = "✅ Message sent successfully! We will reply soon.";
                statusDiv.className = "success";
                statusDiv.classList.remove("hidden");
                
                // Reset button text
                btnText.textContent = "Sent";
            })
            .catch(error => {
                // Error
                console.error("Error:", error);
                statusDiv.textContent = "⚠️ Something went wrong. Please try again.";
                statusDiv.className = "error";
                statusDiv.classList.remove("hidden");
                
                // Reset button text
                btnText.textContent = originalBtnText;
            })
            .finally(() => {
                // Re-enable button after 3 seconds
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = "1";
                    btnText.textContent = originalBtnText;
                }, 3000);
            });
        });
    }
});
