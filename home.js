document.addEventListener('DOMContentLoaded', () => {
    // Global variables
    let currentSlide = 0;
    let isScrolling = false;
    let isMenuOpen = false;
    const slides = document.querySelectorAll('.video-slide');
    const totalSlides = slides.length;
    const navDots = document.querySelectorAll('.nav-dot');
    const menuToggle = document.getElementById('menuToggle');
    const sideMenu = document.getElementById('sideMenu');
    const loader = document.getElementById('loader');
    const navbar = document.querySelector('.navbar');
    const scrollHint = document.getElementById('scrollHint');
    const slideVideos = document.querySelectorAll('.slide-video');
    const menuLinks = document.querySelectorAll('.menu-items a');
    const body = document.body;

    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out-cubic',
            once: true
        });
    }

    // Preload videos
    function preloadVideos() {
        slideVideos.forEach(video => {
            video.load();
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
        });
    }

    // Loading screen transition
    function initLoader() {
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.style.overflow = 'auto';
            slideVideos[currentSlide].play();
        }, 2000);
    }

    // Handle scroll events
    function handleScroll() {
        if (isScrolling) return;
        
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const newSlide = Math.round(scrollPosition / windowHeight);
        
        if (newSlide !== currentSlide && newSlide >= 0 && newSlide < totalSlides) {
            changeSlide(newSlide);
        }
    }

    // Handle slide change
    function changeSlide(newSlide) {
        if (newSlide === currentSlide) return;
        
        // Pause current video
        slideVideos[currentSlide].pause();
        
        // Update current slide
        currentSlide = newSlide;
        
        // Play new video
        slideVideos[currentSlide].play();
        
        // Update navigation dots
        updateNavDots();
        
        // Hide scroll hint after first interaction
        if (scrollHint && !scrollHint.classList.contains('hidden')) {
            scrollHint.classList.add('hidden');
        }
    }

    // Update navigation dots
    function updateNavDots() {
        navDots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // Initialize menu functionality
    function initMenu() {
        // Toggle menu on hamburger click
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            isMenuOpen = !isMenuOpen;
            menuToggle.classList.toggle('active');
            sideMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (sideMenu.classList.contains('active')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });

        // Handle menu link clicks
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                
                // Add transition effect
                sideMenu.style.opacity = '0';
                menuToggle.classList.remove('active');
                isMenuOpen = false;
                body.style.overflow = '';
                
                // Navigate after transition
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (isMenuOpen && !sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                sideMenu.classList.remove('active');
                isMenuOpen = false;
                body.style.overflow = '';
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                menuToggle.classList.remove('active');
                sideMenu.classList.remove('active');
                isMenuOpen = false;
                body.style.overflow = '';
            }
        });

        // Prevent menu close when clicking inside menu
        sideMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Initialize navigation dots
    function initNavDots() {
        navDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                if (index !== currentSlide) {
                    window.scrollTo({
                        top: index * window.innerHeight,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Initialize navbar scroll behavior
    function initNavbarScroll() {
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;
            
            if (currentScroll <= 0) {
                navbar.classList.remove('scroll-up');
                return;
            }

            if (currentScroll > lastScroll && !navbar.classList.contains('scroll-down')) {
                // Scroll Down
                navbar.classList.remove('scroll-up');
                navbar.classList.add('scroll-down');
            } else if (currentScroll < lastScroll && navbar.classList.contains('scroll-down')) {
                // Scroll Up
                navbar.classList.remove('scroll-down');
                navbar.classList.add('scroll-up');
            }
            
            lastScroll = currentScroll;
        });
    }

    // Add active class to current page link
    function initActivePage() {
        const currentPage = window.location.pathname.split('/').pop();
        menuLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }

    // Initialize everything
    function init() {
        preloadVideos();
        initLoader();
        initMenu();
        initNavDots();
        initNavbarScroll();
        initActivePage();
        
        // Add scroll event listener
        window.addEventListener('scroll', handleScroll);
    }

    // Start the application
    init();
});