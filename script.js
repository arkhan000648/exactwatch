// --- IMPORT FIREBASE MODULES (No extra downloads needed) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- FIREBASE CONFIGURATION ---
// REPLACE THIS WHOLE SECTION WITH YOUR COPIED CONFIG FROM PHASE 2
const firebaseConfig = {
  apiKey: "AIzaSyBNNUA3tXuVgvvkew786hB3hhGgQsoQzS0",
  authDomain: "apple-watch-ultra-3-reviews.firebaseapp.com",
  databaseURL: "https://apple-watch-ultra-3-reviews-default-rtdb.firebaseio.com",
  projectId: "apple-watch-ultra-3-reviews",
  storageBucket: "apple-watch-ultra-3-reviews.firebasestorage.app",
  messagingSenderId: "285528635238",
  appId: "1:285528635238:web:98a221cc51d1c7316bbaa7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const reviewsRef = ref(db, 'reviews'); // This connects to the 'reviews' folder in DB

document.addEventListener('DOMContentLoaded', () => {

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

    // 3. Infinite Image Carousel
    const setupCarousel = (container) => {
        const track = container.querySelector('.carousel-track');
        const nextBtn = container.querySelector('.next-btn');
        const prevBtn = container.querySelector('.prev-btn');
        
        if (!track || !nextBtn || !prevBtn) return;

        let slides = Array.from(track.children);
        if(slides.length === 0) return;

        const firstClone = slides[0].cloneNode(true);
        const lastClone = slides[slides.length - 1].cloneNode(true);
        
        track.appendChild(firstClone);
        track.insertBefore(lastClone, slides[0]);
        
        slides = Array.from(track.children);
        
        let index = 1;
        let isTransitioning = false;

        const updateSlidePosition = (enableTransition = true) => {
            if (enableTransition) {
                track.style.transition = 'transform 0.5s ease-out';
            } else {
                track.style.transition = 'none';
            }
            track.style.transform = `translateX(-${index * 100}%)`;
        };

        updateSlidePosition(false);

        track.addEventListener('transitionend', () => {
            isTransitioning = false;
            if (slides[index] === firstClone) {
                index = 1;
                updateSlidePosition(false);
            }
            if (slides[index] === lastClone) {
                index = slides.length - 2;
                updateSlidePosition(false);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (index >= slides.length - 1) return;
            if (isTransitioning) return;
            isTransitioning = true;
            index++;
            updateSlidePosition(true);
        });

        prevBtn.addEventListener('click', () => {
            if (index <= 0) return;
            if (isTransitioning) return;
            isTransitioning = true;
            index--;
            updateSlidePosition(true);
        });

        // Touch Events
        let touchStartX = 0;
        let touchEndX = 0;

        track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const threshold = 50; 
            if (touchStartX - touchEndX > threshold) {
                if (index >= slides.length - 1) return;
                if (!isTransitioning) {
                    isTransitioning = true;
                    index++;
                    updateSlidePosition(true);
                }
            }
            if (touchEndX - touchStartX > threshold) {
                if (index <= 0) return;
                if (!isTransitioning) {
                    isTransitioning = true;
                    index--;
                    updateSlidePosition(true);
                }
            }
        }
    };
    document.querySelectorAll('.carousel-container').forEach(setupCarousel);

    // 4. REAL-TIME REVIEW SYSTEM (Firebase)
    const reviewForm = document.getElementById('reviewForm');
    const reviewsContainer = document.getElementById('reviewsContainer');
    const heroStarsContainer = document.getElementById('hero-stars');
    const heroRatingText = document.getElementById('hero-rating-text');
    const submitBtn = document.getElementById('submitBtn');
    const statusMsg = document.getElementById('review-status');

    // A. LISTEN FOR DATA (This runs on load AND when new data arrives instantly)
    onValue(reviewsRef, (snapshot) => {
        const data = snapshot.val();
        
        if (reviewsContainer) reviewsContainer.innerHTML = ''; // Clear current list

        if (!data) {
            // No reviews found
            if(reviewsContainer) reviewsContainer.innerHTML = '<p class="loading-reviews">No reviews yet. Be the first!</p>';
            updateHeroRating([]); 
            return;
        }

        // Convert Object {id: {data}, id: {data}} to Array [{data}, {data}]
        const reviewsArray = Object.values(data);
        
        // Update Stats & Schema
        updateHeroRating(reviewsArray);

        // Render List (Newest First)
        reviewsArray.reverse().forEach(r => {
            renderReviewCard(r);
        });
    });

    // B. SUBMIT DATA TO FIREBASE
    if(reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 1. Anti-Spam Check
            if(localStorage.getItem('ultra3_reviewed')) {
                alert("You have already reviewed this product.");
                return;
            }

            // 2. Gather Data
            const name = document.getElementById('reviewerName').value;
            const rating = parseInt(document.getElementById('reviewerRating').value);
            let text = document.getElementById('reviewerText').value;

            // 3. Sanitize
            text = text.replace(/<\/?[^>]+(>|$)/g, ""); 
            if(/(https?:\/\/[^\s]+)/g.test(text)) text = text.replace(/(https?:\/\/[^\s]+)/g, "[link removed]");

            const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            // 4. Update UI Button
            submitBtn.textContent = "Submitting...";
            submitBtn.disabled = true;

            // 5. Send to Firebase (Realtime Database)
            const newReviewData = {
                name: name,
                rating: rating,
                review: text,
                date: dateStr,
                timestamp: Date.now() // Good for sorting later if needed
            };

            push(reviewsRef, newReviewData)
                .then(() => {
                    // Success!
                    localStorage.setItem('ultra3_reviewed', 'true');
                    finalizeSubmission();
                })
                .catch((error) => {
                    console.error("Firebase Error:", error);
                    alert("Error submitting review. Please try again.");
                    submitBtn.textContent = "Submit Review";
                    submitBtn.disabled = false;
                });
        });
    }

    function finalizeSubmission() {
        if(submitBtn) submitBtn.textContent = "Review Submitted";
        if(reviewForm) reviewForm.reset();
        
        const inputs = reviewForm.querySelectorAll('input, select, textarea, button');
        inputs.forEach(input => input.disabled = true);
        
        if(statusMsg) {
            statusMsg.textContent = "Thanks! Your review has been added.";
            statusMsg.classList.remove('hidden');
        }
    }

    function renderReviewCard(data) {
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
        reviewsContainer.appendChild(card);
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

                // Add schema for top 5 reviews
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

    // Check LocalStorage on load to disable form if already reviewed
    if(localStorage.getItem('ultra3_reviewed')) {
        const inputs = reviewForm ? reviewForm.querySelectorAll('input, select, textarea, button') : [];
        inputs.forEach(input => input.disabled = true);
        if(submitBtn) submitBtn.textContent = "Review Submitted";
        if(statusMsg) {
            statusMsg.textContent = "You have already reviewed this product.";
            statusMsg.classList.remove('hidden');
        }
    }
});
