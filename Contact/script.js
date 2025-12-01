document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('contactForm');
    const statusDiv = document.getElementById('status-message');
    const submitBtn = document.querySelector('.submit-btn');
    const btnText = document.querySelector('.btn-text');

    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent page reload

            // 1. Show Loading State
            const originalBtnText = btnText.textContent;
            btnText.textContent = "Sending...";
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";
            statusDiv.classList.add('hidden');

            // 2. Gather Data
            const formData = new FormData(form);

            // 3. Send to FormSubmit via AJAX
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