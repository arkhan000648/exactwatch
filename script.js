document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURATION ---
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzX3d3e_FCMCm7eRsqIfHyWR6-srNKB4gKY7w1e8uvL7A25zGwlu-aIWa6TFCNJ-UQGXg/exec'; 

    // 1. Dynamic Date
    const dateElement = document.getElementById('dynamic-date');
    if(dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // 2. Mobile Menu Logic
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const menuOverlay = document.querySelector('.mobile-menu-overlay');
    const closeMenu = document.querySelector('.close-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu-overlay a');

    function toggleMenu() {
        menuOverlay.classList.toggle('active');
    }

    if(menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
        closeMenu.addEventListener('click', toggleMenu);
        mobileLinks.forEach(link => link.addEventListener('click', toggleMenu));
    }

    // 3. Infinite Image Carousel (Updated with Touch/Swipe Support)
    const setupCarousel = (container) => {
        const track = container.querySelector('.carousel-track');
        const nextBtn = container.querySelector('.next-btn');
        const prevBtn = container.querySelector('.prev-btn');
        
        if (!track || !nextBtn || !prevBtn) return;

        let slides = Array.from(track.children);
        if(slides.length === 0) return;

        // Ensure images are loaded before calculating width to prevent bugs
        // (Optional safety check, though existing logic is fine)
        
        let slideWidth = slides[0].getBoundingClientRect().width;
        
        const firstClone = slides[0].cloneNode(true);
        const lastClone = slides[slides.length - 1].cloneNode(true);
        
        track.appendChild(firstClone);
        track.insertBefore(lastClone, slides[0]);
        
        slides = Array.from(track.children);
        let index = 1;
        let isTransitioning = false;

        const setPosition = () => {
            slideWidth = slides[0].getBoundingClientRect().width;
            track.style.transform = `translateX(-${index * slideWidth}px)`;
        };

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

        // --- NEW CODE: TOUCH EVENTS FOR MOBILE SWIPE ---
        let touchStartX = 0;
        let touchEndX = 0;

        track.addEventListener('touchstart', (e) => {
            // Record where the finger landed
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true }); // 'passive' improves scrolling performance

        track.addEventListener('touchend', (e) => {
            // Record where the finger lifted
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const threshold = 50; // Minimum distance (px) to count as a swipe
            
            // Swipe Left (User moves finger Right to Left -> Next Image)
            if (touchStartX - touchEndX > threshold) {
                if (index >= slides.length - 1) return;
                index++;
                moveSlide();
            }
            
            // Swipe Right (User moves finger Left to Right -> Prev Image)
            if (touchEndX - touchStartX > threshold) {
                if (index <= 0) return;
                index--;
                moveSlide();
            }
        }
        // --- END NEW CODE ---
    };

    document.querySelectorAll('.carousel-container').forEach(setupCarousel);

    // 4. Review System
    const reviewForm = document.getElementById('reviewForm');
    const reviewsContainer = document.getElementById('reviewsContainer');
    const heroStarsContainer = document.getElementById('hero-stars');
    const heroRatingText = document.getElementById('hero-rating-text');
    const submitBtn = document.getElementById('submitBtn');
    const statusMsg = document.getElementById('review-status');

    fetchReviews();

    if(reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if(localStorage.getItem('ultra3_reviewed')) {
                alert("You have already reviewed this product.");
                return;
            }

            const name = document.getElementById('reviewerName').value;
            const email = document.getElementById('reviewerEmail').value; 
            const rating = parseInt(document.getElementById('reviewerRating').value);
            let text = document.getElementById('reviewerText').value;

            text = text.replace(/<\/?[^>]+(>|$)/g, ""); 
            if(/(https?:\/\/[^\s]+)/g.test(text)) text = text.replace(/(https?:\/\/[^\s]+)/g, "[link removed]");

            const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            submitBtn.textContent = "Submitting...";
            submitBtn.disabled = true;

            renderReviewCard({name, rating, review: text, date: dateStr}, true);
            
            localStorage.setItem('ultra3_reviewed', 'true');
            
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
    }

    function finalizeSubmission() {
        if(submitBtn) submitBtn.textContent = "Submitted";
        if(reviewForm) reviewForm.reset();
        
        const inputs = reviewForm.querySelectorAll('input, select, textarea, button');
        inputs.forEach(input => input.disabled = true);
        
        if(statusMsg) {
            statusMsg.textContent = "Thanks! Your review has been added.";
            statusMsg.classList.remove('hidden');
        }
    }

    function fetchReviews() {
        fetch(GOOGLE_SCRIPT_URL)
        .then(response => response.json())
        .then(reviews => {
            if(reviewsContainer) reviewsContainer.innerHTML = ''; 
            
            if(!reviews || reviews.length === 0) {
                if(reviewsContainer) reviewsContainer.innerHTML = '<p class="loading-reviews">No reviews yet. Be the first!</p>';
                updateHeroRating([]); 
                injectSchema(0, 0); 
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
            if(reviewsContainer) reviewsContainer.innerHTML = '<p class="status-msg" style="color:#ef4444;">Could not load recent reviews.</p>';
        });
    }

    function renderReviewCard(data, prepend = false) {
        if(!reviewsContainer) return;
        const stars = "⭐".repeat(data.rating);
        
        const card = document.createElement('div');
        card.className = "review-card";
        card.innerHTML = `
            <div class="review-header">
                <div>
                    <span class="review-author">${data.name}</span>
                    <span class="review-stars">${stars}</span>
                </div>
                <span class="review-date">${data.date}</span>
            </div>
            <p class="review-body">${data.review}</p>
        `;

        if(prepend) {
            reviewsContainer.insertBefore(card, reviewsContainer.firstChild);
        } else {
            reviewsContainer.appendChild(card);
        }
    }

    function updateHeroRating(reviews) {
        if(!heroStarsContainer || !heroRatingText) return;

        if(reviews.length === 0) {
            heroStarsContainer.innerHTML = getStarIcons(0);
            heroRatingText.textContent = "(No ratings yet)";
            injectSchema(0, 0);
            return;
        }

        let total = 0;
        reviews.forEach(r => total += parseInt(r.rating));
        const avg = (total / reviews.length).toFixed(1);

        heroStarsContainer.innerHTML = getStarIcons(avg);
        heroRatingText.textContent = `(${avg}/5 based on ${reviews.length} reviews)`;

        injectSchema(avg, reviews.length, reviews);
    }

    function getStarIcons(rating) {
        let html = '';
        const rounded = Math.round(rating);
        
        const fullStar = '<i class="icon-star"></i>';
        const emptyStar = '<i class="icon-star" style="color:#d1d5db;"></i>';

        for(let i=1; i<=5; i++) {
            if(i <= rounded) html += fullStar;
            else html += emptyStar;
        }
        return html;
    }

    function injectSchema(avg, count, reviews = []) {
        const schemaScript = document.getElementById('dynamic-schema');
        if(!schemaScript) return;

        try {
            const schemaData = JSON.parse(schemaScript.textContent);

            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const formattedDate = futureDate.toISOString().split('T')[0];
            
            if(schemaData.offers) {
                schemaData.offers.priceValidUntil = formattedDate;
            }

            if (count > 0) {
                schemaData.aggregateRating = {
                    "@type": "AggregateRating",
                    "ratingValue": avg.toString(),
                    "reviewCount": count.toString(),
                    "bestRating": "5",
                    "worstRating": "1"
                };

                schemaData.review = reviews.slice(0, 5).map(r => ({
                    "@type": "Review",
                    "author": { "@type": "Person", "name": r.name },
                    "datePublished": r.date,
                    "reviewRating": {
                        "@type": "Rating",
                        "ratingValue": r.rating.toString(),
                        "bestRating": "5",
                        "worstRating": "1"
                    },
                    "reviewBody": r.review
                }));
            }

            schemaScript.textContent = JSON.stringify(schemaData);

        } catch (e) {
            console.error("Schema Injection Error:", e);
        }
    }

    if(localStorage.getItem('ultra3_reviewed')) {
        const inputs = reviewForm.querySelectorAll('input, select, textarea, button');
        inputs.forEach(input => input.disabled = true);
        if(submitBtn) submitBtn.textContent = "Review Submitted";
        if(statusMsg) {
            statusMsg.textContent = "You have already reviewed this product.";
            statusMsg.classList.remove('hidden');
        }
    }
});
