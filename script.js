(function() {
    'use strict';

    const app = {
        initialized: false,
        modules: {}
    };

    const utils = {
        throttle(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    func(...args);
                };
                if (!timeout) {
                    timeout = setTimeout(later, wait);
                }
            };
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            };
        },

        sanitize(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    };

    class BurgerMenuController {
        constructor() {
            this.nav = document.querySelector('.navbar-collapse');
            this.toggleButton = document.querySelector('.navbar-toggler');
            this.overlay = null;
            this.init();
        }

        init() {
            if (!this.nav || !this.toggleButton) return;

            this.createOverlay();
            this.bindEvents();
        }

        createOverlay() {
            this.overlay = document.createElement('div');
            this.overlay.className = 'mobile-menu-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                top: var(--header-h);
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(15, 23, 42, 0.5);
                backdrop-filter: blur(4px);
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
                z-index: 999;
            `;
            document.body.appendChild(this.overlay);
        }

        open() {
            this.nav.classList.add('show');
            this.toggleButton.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
            
            if (this.overlay) {
                this.overlay.style.opacity = '1';
                this.overlay.style.visibility = 'visible';
            }

            this.nav.style.height = `calc(100vh - var(--header-h))`;
        }

        close() {
            this.nav.classList.remove('show');
            this.toggleButton.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            
            if (this.overlay) {
                this.overlay.style.opacity = '0';
                this.overlay.style.visibility = 'hidden';
            }

            this.nav.style.height = '';
        }

        toggleMenu() {
            if (this.nav.classList.contains('show')) {
                this.close();
            } else {
                this.open();
            }
        }

        bindEvents() {
            this.toggleButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMenu();
            });

            if (this.overlay) {
                this.overlay.addEventListener('click', () => this.close());
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.nav.classList.contains('show')) {
                    this.close();
                }
            });

            const navLinks = this.nav.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 768) {
                        this.close();
                    }
                });
            });

            window.addEventListener('resize', utils.debounce(() => {
                if (window.innerWidth >= 768) {
                    this.close();
                }
            }, 250));
        }
    }

    class FormValidator {
        constructor() {
            this.forms = document.querySelectorAll('.needs-validation, .c-form, .c-contact-form');
            this.patterns = {
                email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                phone: /^[\d\s+\-()]{10,20}$/,
                name: /^[a-zA-ZÀ-Ÿ\s\-']{2,50}$/,
                message: /^.{10,1000}$/
            };
            this.init();
        }

        init() {
            this.forms.forEach(form => {
                this.setupForm(form);
            });
        }

        setupForm(form) {
            const fields = form.querySelectorAll('input, textarea, select');
            
            fields.forEach(field => {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => {
                    if (field.classList.contains('is-invalid')) {
                        this.validateField(field);
                    }
                });
            });

            form.addEventListener('submit', (e) => this.handleSubmit(e, form));
        }

        validateField(field) {
            const value = field.value.trim();
            let isValid = true;
            let errorMessage = '';

            if (field.hasAttribute('required') && !value && field.type !== 'checkbox') {
                isValid = false;
                errorMessage = 'Dit veld is verplicht';
            } else if (value) {
                if (field.type === 'email' || field.id === 'email') {
                    if (!this.patterns.email.test(value)) {
                        isValid = false;
                        errorMessage = 'Voer een geldig e-mailadres in';
                    }
                } else if (field.type === 'tel' || field.id === 'phone') {
                    if (!this.patterns.phone.test(value)) {
                        isValid = false;
                        errorMessage = 'Voer een geldig telefoonnummer in';
                    }
                } else if (field.id === 'firstName' || field.id === 'lastName' || field.id === 'name') {
                    if (!this.patterns.name.test(value)) {
                        isValid = false;
                        errorMessage = 'Voer een geldige naam in (2-50 tekens)';
                    }
                } else if (field.id === 'message' && field.hasAttribute('required')) {
                    if (!this.patterns.message.test(value)) {
                        isValid = false;
                        errorMessage = 'Bericht moet minimaal 10 tekens bevatten';
                    }
                }
            }

            if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
                isValid = false;
                errorMessage = 'U moet akkoord gaan met de voorwaarden';
            }

            this.updateFieldState(field, isValid, errorMessage);
            return isValid;
        }

        updateFieldState(field, isValid, errorMessage) {
            const errorId = field.getAttribute('aria-describedby');
            let errorElement = errorId ? document.getElementById(errorId) : null;

            if (!errorElement) {
                errorElement = field.parentElement.querySelector('.invalid-feedback');
            }

            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'invalid-feedback';
                errorElement.style.display = 'none';
                field.parentElement.appendChild(errorElement);
            }

            if (isValid) {
                field.classList.remove('is-invalid');
                field.classList.add('is-valid');
                errorElement.style.display = 'none';
            } else {
                field.classList.remove('is-valid');
                field.classList.add('is-invalid');
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
            }
        }

        async handleSubmit(e, form) {
            e.preventDefault();

            const fields = form.querySelectorAll('input, textarea, select');
            let isFormValid = true;

            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isFormValid = false;
                }
            });

            if (!isFormValid) {
                return;
            }

            const submitBtn = form.querySelector('[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verzenden...';

            try {
                await this.simulateSubmission();
                this.showNotification('Uw bericht is succesvol verzonden!', 'success');
                form.reset();
                fields.forEach(field => {
                    field.classList.remove('is-valid', 'is-invalid');
                });
                
                setTimeout(() => {
                    window.location.href = 'thank_you.html';
                }, 1000);
            } catch (error) {
                this.showNotification('Er is een fout opgetreden. Probeer het later opnieuw.', 'danger');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }

        simulateSubmission() {
            return new Promise((resolve) => {
                setTimeout(resolve, 1500);
            });
        }

        showNotification(message, type) {
            let container = document.querySelector('.notification-container');
            
            if (!container) {
                container = document.createElement('div');
                container.className = 'notification-container';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    max-width: 400px;
                `;
                document.body.appendChild(container);
            }

            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show`;
            notification.style.cssText = `
                padding: 1rem 1.5rem;
                border-radius: var(--border-radius-md);
                box-shadow: var(--shadow-lg);
                animation: slideInRight 0.3s ease-out;
            `;
            notification.innerHTML = `
                ${utils.sanitize(message)}
                <button type="button" class="btn-close" aria-label="Close"></button>
            `;

            container.appendChild(notification);

            const closeBtn = notification.querySelector('.btn-close');
            closeBtn.addEventListener('click', () => {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            });

            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }
    }

    class ScrollAnimationController {
        constructor() {
            this.observer = null;
            this.init();
        }

        init() {
            const options = {
                root: null,
                rootMargin: '0px 0px -100px 0px',
                threshold: 0.1
            };

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, options);

            this.observeElements();
        }

        observeElements() {
            const elements = document.querySelectorAll('.card, .c-card, .c-btn, .btn, h2, h3, p, img, .accordion-item');
            
            elements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = `opacity 0.6s ease-out ${index * 0.05}s, transform 0.6s ease-out ${index * 0.05}s`;
                this.observer.observe(el);
            });
        }
    }

    class ScrollSpyController {
        constructor() {
            this.sections = document.querySelectorAll('[id]');
            this.navLinks = document.querySelectorAll('.nav-link[href^="#"]');
            this.init();
        }

        init() {
            if (this.sections.length === 0 || this.navLinks.length === 0) return;

            window.addEventListener('scroll', utils.throttle(() => {
                this.updateActiveLink();
            }, 100));

            this.navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (href.startsWith('#') && href !== '#') {
                        e.preventDefault();
                        const target = document.querySelector(href);
                        if (target) {
                            this.smoothScrollTo(target);
                        }
                    }
                });
            });
        }

        updateActiveLink() {
            let currentSection = '';
            const scrollPosition = window.pageYOffset + 150;

            this.sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSection = section.getAttribute('id');
                }
            });

            this.navLinks.forEach(link => {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
                
                if (link.getAttribute('href') === `#${currentSection}`) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                }
            });
        }

        smoothScrollTo(target) {
            const headerHeight = document.querySelector('.l-header')?.offsetHeight || 80;
            const targetPosition = target.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    class MicroInteractionController {
        constructor() {
            this.init();
        }

        init() {
            this.addButtonEffects();
            this.addCardEffects();
            this.addImageEffects();
        }

        addButtonEffects() {
            const buttons = document.querySelectorAll('.btn, .c-btn, .c-button, button[type="submit"]');
            
            buttons.forEach(button => {
                button.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = 'var(--shadow-lg)';
                });

                button.addEventListener('mouseleave', function() {
                    this.style.transform = '';
                    this.style.boxShadow = '';
                });

                button.addEventListener('click', function(e) {
                    const ripple = document.createElement('span');
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;

                    ripple.style.cssText = `
                        position: absolute;
                        width: ${size}px;
                        height: ${size}px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.5);
                        left: ${x}px;
                        top: ${y}px;
                        transform: scale(0);
                        animation: rippleEffect 0.6s ease-out;
                        pointer-events: none;
                    `;

                    this.style.position = 'relative';
                    this.style.overflow = 'hidden';
                    this.appendChild(ripple);

                    setTimeout(() => ripple.remove(), 600);
                });
            });
        }

        addCardEffects() {
            const cards = document.querySelectorAll('.card, .c-card');
            
            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-8px) scale(1.02)';
                    this.style.boxShadow = 'var(--shadow-xl)';
                });

                card.addEventListener('mouseleave', function() {
                    this.style.transform = '';
                    this.style.boxShadow = '';
                });
            });
        }

        addImageEffects() {
            const images = document.querySelectorAll('img');
            
            images.forEach(img => {
                if (!img.hasAttribute('loading') && !img.classList.contains('c-logo__img')) {
                    img.setAttribute('loading', 'lazy');
                }

                img.style.opacity = '0';
                img.style.transform = 'scale(0.95)';
                img.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'scale(1)';
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });

                observer.observe(img);
            });
        }
    }

    class PortfolioFilterController {
        constructor() {
            this.filterButtons = document.querySelectorAll('.c-filter-btn');
            this.portfolioItems = document.querySelectorAll('.portfolio-item');
            this.init();
        }

        init() {
            if (this.filterButtons.length === 0) return;

            this.filterButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const filter = button.getAttribute('data-filter');
                    this.filterItems(filter);
                    this.updateActiveButton(button);
                });
            });
        }

        filterItems(filter) {
            this.portfolioItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    item.style.display = '';
                    item.style.animation = 'fadeInScale 0.5s ease-out';
                } else {
                    item.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        }

        updateActiveButton(activeButton) {
            this.filterButtons.forEach(button => {
                button.classList.remove('active');
            });
            activeButton.classList.add('active');
        }
    }

    class AccordionController {
        constructor() {
            this.accordions = document.querySelectorAll('.accordion');
            this.init();
        }

        init() {
            this.accordions.forEach(accordion => {
                const buttons = accordion.querySelectorAll('.accordion-button');
                
                buttons.forEach(button => {
                    button.addEventListener('click', () => {
                        const target = button.getAttribute('data-bs-target');
                        const collapse = document.querySelector(target);
                        
                        if (collapse) {
                            const isOpen = collapse.classList.contains('show');
                            
                            if (isOpen) {
                                collapse.classList.remove('show');
                                button.classList.add('collapsed');
                            } else {
                                const openCollapses = accordion.querySelectorAll('.accordion-collapse.show');
                                openCollapses.forEach(openCollapse => {
                                    openCollapse.classList.remove('show');
                                    const openButton = accordion.querySelector(`[data-bs-target="#${openCollapse.id}"]`);
                                    if (openButton) openButton.classList.add('collapsed');
                                });
                                
                                collapse.classList.add('show');
                                button.classList.remove('collapsed');
                            }
                        }
                    });
                });
            });
        }
    }

    class ModalController {
        constructor() {
            this.modals = document.querySelectorAll('.modal');
            this.init();
        }

        init() {
            document.querySelectorAll('[data-bs-toggle="modal"]').forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = trigger.getAttribute('data-bs-target') || trigger.getAttribute('href');
                    const modal = document.querySelector(targetId);
                    if (modal) this.openModal(modal);
                });
            });

            this.modals.forEach(modal => {
                const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
                closeButtons.forEach(btn => {
                    btn.addEventListener('click', () => this.closeModal(modal));
                });

                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(modal);
                    }
                });
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const openModal = document.querySelector('.modal.show');
                    if (openModal) this.closeModal(openModal);
                }
            });
        }

        openModal(modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(4px);
                z-index: 1099;
                animation: fadeIn 0.3s ease-out;
            `;
            document.body.appendChild(backdrop);

            modal.style.animation = 'modalSlideIn 0.3s ease-out';
        }

        closeModal(modal) {
            modal.style.animation = 'modalSlideOut 0.3s ease-out';
            
            setTimeout(() => {
                modal.classList.remove('show');
                modal.style.display = 'none';
                document.body.style.overflow = '';
                
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }, 300);
        }
    }

    class ScrollToTopController {
        constructor() {
            this.button = this.createButton();
            this.init();
        }

        createButton() {
            const button = document.createElement('button');
            button.innerHTML = '↑';
            button.className = 'scroll-to-top';
            button.setAttribute('aria-label', 'Scroll naar boven');
            button.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: var(--color-accent);
                color: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease-out;
                z-index: 1000;
                box-shadow: var(--shadow-lg);
            `;
            document.body.appendChild(button);
            return button;
        }

        init() {
            window.addEventListener('scroll', utils.throttle(() => {
                if (window.pageYOffset > 300) {
                    this.button.style.opacity = '1';
                    this.button.style.visibility = 'visible';
                } else {
                    this.button.style.opacity = '0';
                    this.button.style.visibility = 'hidden';
                }
            }, 100));

            this.button.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

            this.button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.1)';
            });

            this.button.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        }
    }

    function injectAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rippleEffect {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            @keyframes fadeInScale {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes fadeOut {
                to {
                    opacity: 0;
                    transform: scale(0.9);
                }
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes modalSlideOut {
                to {
                    opacity: 0;
                    transform: translateY(50px) scale(0.95);
                }
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .animate-in {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }

            .card, .c-card, .btn, .c-btn {
                transition: all 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    }

    function initialize() {
        if (app.initialized) return;
        app.initialized = true;

        injectAnimationStyles();

        app.modules.burgerMenu = new BurgerMenuController();
        app.modules.formValidator = new FormValidator();
        app.modules.scrollAnimation = new ScrollAnimationController();
        app.modules.scrollSpy = new ScrollSpyController();
        app.modules.microInteractions = new MicroInteractionController();
        app.modules.portfolioFilter = new PortfolioFilterController();
        app.modules.accordion = new AccordionController();
        app.modules.modal = new ModalController();
        app.modules.scrollToTop = new ScrollToTopController();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    window.__app = app;

})();