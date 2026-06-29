// Initialize Lucide Icons
lucide.createIcons();

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if(targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            // Offset for fixed navbar
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    });
});

// FAQ Accordion Logic
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const item = question.parentElement;
        const icon = question.querySelector('i');
        
        // Close all other items
        document.querySelectorAll('.faq-item').forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
                otherItem.classList.remove('active');
                otherItem.querySelector('i').setAttribute('data-lucide', 'chevron-down');
            }
        });
        
        // Toggle current item
        item.classList.toggle('active');
        
        // Change icon
        if (item.classList.contains('active')) {
            icon.setAttribute('data-lucide', 'chevron-up');
        } else {
            icon.setAttribute('data-lucide', 'chevron-down');
        }
        lucide.createIcons();
    });
});

// Simple intersection observer for fade-in animations on scroll
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Apply initial styles and attach observer
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Also observe the bottom CTA
    const bottomCta = document.querySelector('.bottom-cta');
    if (bottomCta) {
        bottomCta.style.opacity = '0';
        bottomCta.style.transform = 'translateY(30px)';
        bottomCta.style.transition = `all 0.7s cubic-bezier(0.4, 0, 0.2, 1)`;
        observer.observe(bottomCta);
    }

    // Slider Modal Logic
    const sliderModal = document.getElementById('slider-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    const sliderTrack = document.getElementById('slider-track');
    const sliderTitle = document.getElementById('slider-title');
    const sliderDesc = document.getElementById('slider-desc');
    const sliderDotsContainer = document.getElementById('slider-dots');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    let currentSlide = 0;
    let slidesData = [];
    
    if (sliderModal) {
        // Collect slide data from feature cards
        cards.forEach((card, index) => {
            const title = card.querySelector('h3').innerText;
            const desc = card.querySelector('p').innerText;
            const imgSrc = card.querySelector('img').getAttribute('src');
            
            slidesData.push({ title, desc, imgSrc });
            
            // Create slide element
            const slideEl = document.createElement('div');
            slideEl.className = 'slider-slide';
            slideEl.innerHTML = `<img src="${imgSrc}" alt="${title}">`;
            sliderTrack.appendChild(slideEl);
            
            // Create dot element
            const dotEl = document.createElement('div');
            dotEl.className = 'slider-dot';
            if (index === 0) dotEl.classList.add('active');
            dotEl.addEventListener('click', () => goToSlide(index));
            sliderDotsContainer.appendChild(dotEl);
            
            // Add click event to card
            card.addEventListener('click', () => {
                goToSlide(index);
                sliderModal.classList.add('active');
            });
        });
        
        function goToSlide(index) {
            if (index < 0) index = slidesData.length - 1;
            if (index >= slidesData.length) index = 0;
            
            currentSlide = index;
            sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            sliderTitle.innerText = slidesData[currentSlide].title;
            sliderDesc.innerText = slidesData[currentSlide].desc;
            
            // Update dots
            document.querySelectorAll('.slider-dot').forEach((dot, idx) => {
                dot.classList.toggle('active', idx === currentSlide);
            });
        }
        
        function closeModal() {
            sliderModal.classList.remove('active');
        }
        
        modalClose.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', closeModal);
        
        prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
        nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!sliderModal.classList.contains('active')) return;
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowLeft') goToSlide(currentSlide - 1);
            if (e.key === 'ArrowRight') goToSlide(currentSlide + 1);
        });
    }
});
