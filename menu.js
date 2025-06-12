document.addEventListener('DOMContentLoaded', () => {
    // Menu elements
    const menuToggle = document.getElementById('menuToggle');
    const sideMenu = document.getElementById('sideMenu');
    const menuLinks = document.querySelectorAll('.menu-items a');
    const body = document.body;
    let isMenuOpen = false;

    // Initialize menu functionality
    function initMenu() {
        if (!menuToggle || !sideMenu) return;

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

    // Initialize navbar scroll behavior
    function initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

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
        initMenu();
        initNavbarScroll();
        initActivePage();
    }

    // Start the application
    init();
}); 