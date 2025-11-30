document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURATION ---
    // PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL BELOW:
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzX3d3e_FCMCm7eRsqIfHyWR6-srNKB4gKY7w1e8uvL7A25zGwlu-aIWa6TFCNJ-UQGXg/exec'; 

    // 1. Dynamic Date
    const dateElement = document.getElementById('dynamic-date');
    dateElement.textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // 2. Mobile Menu Logic
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const menuOverlay = document.querySelector('.mobile-menu-overlay');
    const closeMenu = document.querySelector('.close-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu-overlay a');

    function toggleMenu() {
        menuOverlay.classList.toggle('active');
        if (menuOverlay.classList.contains('active')) {
            menuOverlay.classList.remove('translate-y-[-100%]');
        } else {
            menuOverlay.classList.add('translate-y-[-100%]');
        }
    }
    menuToggle.addEventListener('click', toggleMenu);
    closeMenu.addEventListener('click', toggleMenu);
    mobileLinks.forEach(link => link.addEventListener('click', toggleMenu));

    // 3. Infinite Image Carousel (No rewind)
    const setupCarousel = (container) => {
        const track = container.querySelector('.carousel-track');
        const nextBtn = container.querySelector('.next-btn');
        const prevBtn = container.querySelector('.prev-btn');
        
        let slides = Array.from(track.children);
        let slideWidth = slides[0].getBoundingClientRect().width;
        
        // Clone first and last slides for infinite effect
        const firstClone = slides[0].cloneNode(true);
        const lastClone = slides[slides.length - 1].cloneNode(true);
        
        track.appendChild(firstClone);
        track.insertBefore(lastClone, slides[0]);
        
        // Re-query slides
        slides = Array.from(track.children);
        
        let index = 1; // Start at the first real slide (index 1 because of clone)
        let isTransitioning = false;

        const setPosition = () => {
            slideWidth = slides[0].getBoundingClientRect().width; // Re-calculate on resize
            track.style.transform = `translateX(-${index * slideWidth}px)`;
        };

        // Initial set
        setPosition();
        window.addEventListener('resize', setPosition);

        const moveSlide = () => {
            if (isTransitioning) return;
            isTransitioning = true;
            track.style.transition = 'transform 0.5s ease-out';
            track.style.transform = `translateX(-${index * slideWidth}px)`;
        };

        track.addEventListener('transitionend', () => {
            isTransitioning = false;
            // Infinite Loop Logic
            if (slides[index] === firstClone) {
                track.style.transition = 'none';
                index = 1;
                track.style.transform = `translateX(-${index * slideWidth}px)`;
            }
            if (slides[index] === lastClone) {
                track.style.transition = 'none';
                index = slides.length - 2;
                track.style.transform = `translateX(-${index * slideWidth}px)`;
            }
        });

        nextBtn.addEventListener('click', () => {
            if (index >= slides.length - 1) return;
            index++;
            moveSlide();
        });

        prevBtn.addEventListener('click', () => {
            if (index <= 0) return;
            index--;
            moveSlide();
        });
    };

    // Initialize carousels (Mobile & Desktop)
    document.querySelectorAll('.carousel-container').forEach(setupCarousel);


    // 4. Review System (Optimistic UI + Google Sheets)
    const reviewForm = document.getElementById('reviewForm');
    const reviewsContainer = document.getElementById('reviewsContainer');
    const heroStarsContainer = document.getElementById('hero-stars');
    const heroRatingText = document.getElementById('hero-rating-text');
    const submitBtn = document.getElementById('submitBtn');
    const statusMsg = document.getElementById('review-status');

    // Fetch existing reviews on load
    fetchReviews();

    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get Values
        const name = document.getElementById('reviewerName').value;
        const email = document.getElementById('reviewerEmail').value; 
        const rating = parseInt(document.getElementById('reviewerRating').value);
        let text = document.getElementById('reviewerText').value;

        // Security cleaning
        text = text.replace(/<\/?[^>]+(>|$)/g, ""); 
        if(/(https?:\/\/[^\s]+)/g.test(text)) text = text.replace(/(https?:\/\/[^\s]+)/g, "[link removed]");

        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        // Optimistic Update
        submitBtn.textContent = "Submitting...";
        submitBtn.disabled = true;

        // Show immediately
        renderReviewCard({name, rating, review: text, date: dateStr}, true);
        
        localStorage.setItem('ultra3_reviewed', 'true');
        
        // Send Data
        const data = { name, email, rating, review: text };
        
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data)
        })
        .then(() => {
            finalizeSubmission();
        })
        .catch(err => {
            console.error(err);
            finalizeSubmission(); 
        });
    });

    function finalizeSubmission() {
        submitBtn.textContent = "Submitted";
        reviewForm.reset();
        
        const inputs = reviewForm.querySelectorAll('input, select, textarea, button');
        inputs.forEach(input => input.disabled = true);
        
        statusMsg.textContent = "Thanks! Your review has been added.";
        statusMsg.classList.remove('hidden');
    }

    function fetchReviews() {
        fetch(GOOGLE_SCRIPT_URL)
        .then(response => response.json())
        .then(reviews => {
            reviewsContainer.innerHTML = ''; 
            
            if(!reviews || reviews.length === 0) {
                reviewsContainer.innerHTML = '<p class="text-gray-500 italic text-sm text-center">No reviews yet. Be the first!</p>';
                updateHeroRating([]); 
                return;
            }

            reviews.reverse().forEach(r => {
                let d = r.date;
                if(d.includes('T')) d = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                renderReviewCard({
                    name: r.name,
                    rating: parseInt(r.rating),
                    review: r.review,
                    date: d
                });
            });

            updateHeroRating(reviews);
        })
        .catch(e => {
            console.error(e);
            reviewsContainer.innerHTML = '<p class="text-red-500 text-sm text-center">Could not load recent reviews.</p>';
        });
    }

    function renderReviewCard(data, prepend = false) {
        const stars = "⭐".repeat(data.rating);
        const card = document.createElement('div');
        card.className = "bg-gray-50 p-4 rounded-lg border border-gray-100";
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div>
                    <span class="font-bold text-sm block text-gray-800">${data.name}</span>
                    <span class="text-xs text-yellow-500">${stars}</span>
                </div>
                <span class="text-xs text-gray-400">${data.date}</span>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">${data.review}</p>
        `;

        if(prepend) {
            reviewsContainer.insertBefore(card, reviewsContainer.firstChild);
        } else {
            reviewsContainer.appendChild(card);
        }
    }

    function updateHeroRating(reviews) {
        if(reviews.length === 0) {
            heroStarsContainer.innerHTML = '<i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i>';
            heroRatingText.textContent = "(No ratings yet)";
            return;
        }

        let total = 0;
        reviews.forEach(r => total += parseInt(r.rating));
        const avg = (total / reviews.length).toFixed(1);

        let starHTML = '';
        for(let i=1; i<=5; i++) {
            if(i <= Math.round(avg)) starHTML += '<i class="fas fa-star"></i>';
            else starHTML += '<i class="far fa-star text-gray-300"></i>';
        }

        heroStarsContainer.innerHTML = starHTML;
        heroRatingText.textContent = `(${avg}/5 based on ${reviews.length} reviews)`;
    }

    if(localStorage.getItem('ultra3_reviewed')) {
        const inputs = reviewForm.querySelectorAll('input, select, textarea, button');
        inputs.forEach(input => input.disabled = true);
        submitBtn.textContent = "Review Submitted";
        statusMsg.textContent = "You have already reviewed this product.";
        statusMsg.classList.remove('hidden');
    }
});