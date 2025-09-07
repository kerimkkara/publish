/**
 * QrMenu Custom JavaScript - Optimized
 * Version: 1.0.0
 */

(function() {
    'use strict';

    // ===== UTILITY FUNCTIONS =====
    
    const Utils = {
        // DOM Ready
        ready: function(fn) {
            if (document.readyState !== 'loading') {
                fn();
            } else {
                document.addEventListener('DOMContentLoaded', fn);
            }
        },

        // Element selector with caching
        $: function(selector, context = document) {
            return context.querySelector(selector);
        },

        $$: function(selector, context = document) {
            return Array.from(context.querySelectorAll(selector));
        },

        // Event delegation
        delegate: function(element, eventType, selector, handler) {
            element.addEventListener(eventType, function(event) {
                const target = event.target.closest(selector);
                if (target && element.contains(target)) {
                    handler.call(target, event);
                }
            });
        },

        // Debounce function
        debounce: function(func, wait, immediate) {
            let timeout;
            return function executedFunction() {
                const context = this;
                const args = arguments;
                const later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        },

        // Throttle function
        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Smooth scroll
        smoothScroll: function(target, duration = 300) {
            const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
            if (!targetElement) return;

            const targetPosition = targetElement.offsetTop;
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            let startTime = null;

            function animation(currentTime) {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const run = ease(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            }

            function ease(t, b, c, d) {
                t /= d / 2;
                if (t < 1) return c / 2 * t * t + b;
                t--;
                return -c / 2 * (t * (t - 2) - 1) + b;
            }

            requestAnimationFrame(animation);
        },

        // Show/Hide elements
        show: function(element) {
            element.style.display = 'block';
            element.classList.add('fade-in');
        },

        hide: function(element) {
            element.style.display = 'none';
            element.classList.remove('fade-in');
        },

        toggle: function(element) {
            if (element.style.display === 'none') {
                this.show(element);
            } else {
                this.hide(element);
            }
        },

        // AJAX helper
        ajax: function(options) {
            const defaults = {
                method: 'GET',
                url: '',
                data: null,
                headers: {},
                timeout: 10000
            };

            const settings = Object.assign({}, defaults, options);

            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.timeout = settings.timeout;
                xhr.open(settings.method, settings.url, true);

                // Set headers
                Object.keys(settings.headers).forEach(key => {
                    xhr.setRequestHeader(key, settings.headers[key]);
                });

                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (e) {
                            resolve(xhr.responseText);
                        }
                    } else {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                };

                xhr.onerror = function() {
                    reject(new Error('Network error'));
                };

                xhr.ontimeout = function() {
                    reject(new Error('Request timeout'));
                };

                xhr.send(settings.data);
            });
        },

        // Local storage helper
        storage: {
            set: function(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                } catch (e) {
                    console.warn('Failed to save to localStorage:', e);
                }
            },

            get: function(key, defaultValue = null) {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : defaultValue;
                } catch (e) {
                    console.warn('Failed to read from localStorage:', e);
                    return defaultValue;
                }
            },

            remove: function(key) {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.warn('Failed to remove from localStorage:', e);
                }
            }
        }
    };

    // ===== STORY PLAYER =====
    
    const StoryPlayer = {
        init: function() {
            this.logoTrigger = Utils.$('#logoStoryTrigger');
            this.storyPopup = Utils.$('#storyPopup');
            this.storyClose = Utils.$('#storyClose');
            this.storyNext = Utils.$('#storyNext');
            this.storyPrev = Utils.$('#storyPrev');
            this.progressWrap = Utils.$('#storyProgressContainer');
            this.storyContent = Utils.$('#storyContent');

            if (!this.logoTrigger || !this.storyPopup) return;

            this.bindEvents();
        },

        bindEvents: function() {
            this.logoTrigger.addEventListener('click', () => this.open());
            this.storyClose.addEventListener('click', () => this.close());
            this.storyNext.addEventListener('click', () => this.next());
            this.storyPrev.addEventListener('click', () => this.prev());

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (!this.isOpen()) return;
                
                switch(e.key) {
                    case 'Escape':
                        this.close();
                        break;
                    case 'ArrowRight':
                        this.next();
                        break;
                    case 'ArrowLeft':
                        this.prev();
                        break;
                }
            });

            // Touch/swipe support
            let startX = 0;
            let startY = 0;

            this.storyContent.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            });

            this.storyContent.addEventListener('touchend', (e) => {
                if (!this.isOpen()) return;

                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = startX - endX;
                const diffY = startY - endY;

                // Minimum swipe distance
                if (Math.abs(diffX) < 50) return;

                // Horizontal swipe only
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 0) {
                        this.next();
                    } else {
                        this.prev();
                    }
                }
            });
        },

        open: function() {
            this.medias = Array.from(this.storyContent.querySelectorAll('.story-img, .story-video'));
            if (!this.medias.length) return;

            this.current = 0;
            this.storyPopup.style.display = 'flex';
            this.initBars();
            this.show(0);
        },

        close: function() {
            this.storyPopup.style.display = 'none';
            this.stopAll();
        },

        isOpen: function() {
            return this.storyPopup.style.display === 'flex';
        },

        next: function() {
            this.show(this.current + 1);
        },

        prev: function() {
            this.show(this.current - 1);
        },

        show: function(index) {
            this.stopAll();
            this.current = (index + this.medias.length) % this.medias.length;

            this.medias.forEach(m => m.style.display = 'none');
            const active = this.medias[this.current];
            const id = active.getAttribute('data-story-id');

            if (this.isVideo(active)) {
                this.showVideo(active, id);
            } else {
                this.showImage(active, id);
            }
        },

        showVideo: function(video, id) {
            this.progressWrap.style.display = 'none';
            video.style.display = 'block';

            video.muted = true;
            video.playsInline = true;
            video.setAttribute('webkit-playsinline', '');

            const tryPlay = () => video.play().catch(() => {});
            if (video.readyState >= 2) {
                tryPlay();
            } else {
                video.addEventListener('loadeddata', tryPlay, { once: true });
            }

            video.addEventListener('play', () => {
                this.incrementView(id);
            }, { once: true });

            video.onended = () => this.next();
        },

        showImage: function(image, id) {
            this.progressWrap.style.display = 'flex';
            image.style.display = 'block';
            this.incrementView(id);

            this.setBar(this.current, 0);
            let progress = 0;
            this.timer = setInterval(() => {
                progress += 100 / (5000 / 50);
                this.setBar(this.current, progress);
                if (progress >= 100) this.next();
            }, 50);
        },

        stopAll: function() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }

            this.medias.forEach(m => {
                if (m.tagName.toLowerCase() === 'video') {
                    try {
                        m.pause();
                        m.currentTime = 0;
                        m.onended = null;
                    } catch (e) {}
                }
            });
        },

        initBars: function() {
            this.progressWrap.innerHTML = '';
            this.medias.forEach(() => {
                const bar = document.createElement('div');
                bar.className = 'story-progress';
                const inner = document.createElement('div');
                inner.className = 'story-progress-inner';
                bar.appendChild(inner);
                this.progressWrap.appendChild(bar);
            });
        },

        setBar: function(index, percent) {
            const inners = this.progressWrap.querySelectorAll('.story-progress-inner');
            inners.forEach((el, idx) => {
                if (idx < index) {
                    el.style.width = '100%';
                } else if (idx === index) {
                    el.style.width = `${Math.max(0, Math.min(100, percent))}%`;
                } else {
                    el.style.width = '0%';
                }
            });
        },

        isVideo: function(element) {
            return element && element.tagName && element.tagName.toLowerCase() === 'video';
        },

        incrementView: function(id) {
            if (!id) return;
            Utils.ajax({
                method: 'POST',
                url: `/Story/IncrementView/${id}`
            }).catch(() => {});
        }
    };

    // ===== MENU CUSTOMIZATION =====
    
    const MenuCustomizer = {
        init: function() {
            this.bindEvents();
            this.applyAllVars();
        },

        bindEvents: function() {
            // Font preview
            Utils.delegate(document, 'change', '.preview-font', (e) => {
                const target = e.target.getAttribute('data-var');
                const value = e.target.value;
                Utils.$(':root').style.setProperty(target, value);
            });

            // Color and number preview
            Utils.delegate(document, 'input', '.preview-change', (e) => {
                const target = e.target.getAttribute('data-preview');
                const value = e.target.value;
                const pxValue = this.needsPx(target) ? value + 'px' : value;
                Utils.$(':root').style.setProperty(target, pxValue);
            });

            // Icon pack preview
            Utils.delegate(document, 'change', '.preview-pack', (e) => {
                const value = e.target.value;
                document.body.className = document.body.className.replace(/icons-\w+/, '') + ' icons-' + value;
            });

            // Refresh preview
            const refreshBtn = Utils.$('#refreshPreview');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.applyAllVars());
            }
        },

        applyAllVars: function() {
            const mappings = [
                ['--brand-name-size', '[name="BrandNameFontSize"]'],
                ['--brand-slogan-size', '[name="BrandSloganFontSize"]'],
                ['--brand-name-color', '[name="BrandNameColor"]'],
                ['--brand-slogan-color', '[name="BrandSloganColor"]'],
                ['--cat-size', '[name="CategoryFontSize"]'],
                ['--cat-text', '[name="CategoryTextColor"]'],
                ['--cat-header-min', '[name="CategoryHeaderMinHeight"]'],
                ['--cat-header-pad-y', '[name="CategoryHeaderPaddingY"]'],
                ['--subcat-size', '[name="SubCategoryFontSize"]'],
                ['--subcat-text', '[name="SubCategoryTextColor"]'],
                ['--subcat-header-min', '[name="SubCategoryHeaderMinHeight"]'],
                ['--item-size', '[name="ItemFontSize"]'],
                ['--item-text', '[name="ItemTextColor"]'],
                ['--item-bg', '[name="ItemContentBackgroundColor"]'],
                ['--item-img-h', '[name="ItemImageHeight"]'],
                ['--grid-bg', '[name="ItemsGridBackgroundColor"]'],
                ['--prod-cols', '[name="ProductGridMaxColumns"]'],
                ['--mixed-min', '[name="MixedGridMinWidth"]'],
                ['--mixed-gap', '[name="MixedGridGap"]'],
                ['--subitems-min', '[name="SubItemsGridMinWidth"]'],
                ['--subitems-gap', '[name="SubItemsGridGap"]'],
                ['--items-min', '[name="ItemsGridMinWidth"]'],
                ['--items-gap', '[name="ItemsGridGap"]'],
                ['--logo-size', '[name="LogoSize"]'],
                ['--logo-ring', '[name="LogoRingThickness"]'],
                ['--icon-size', '[name="IconSizePx"]'],
                ['--arrow-color', '[name="ArrowColor"]']
            ];

            mappings.forEach(([cssVar, selector]) => {
                const element = Utils.$(selector);
                if (element) {
                    const value = element.value;
                    const pxValue = this.needsPx(cssVar) ? value + 'px' : value;
                    Utils.$(':root').style.setProperty(cssVar, pxValue);
                }
            });
        },

        needsPx: function(cssVar) {
            const pxVars = [
                '--brand-name-size', '--brand-slogan-size',
                '--cat-size', '--subcat-size', '--item-size',
                '--cat-header-min', '--cat-header-pad-y',
                '--subcat-header-min', '--item-img-h',
                '--mixed-min', '--mixed-gap',
                '--subitems-min', '--subitems-gap',
                '--items-min', '--items-gap',
                '--logo-size', '--logo-ring', '--icon-size'
            ];
            return pxVars.includes(cssVar);
        }
    };

    // ===== FORM VALIDATION =====
    
    const FormValidator = {
        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            Utils.delegate(document, 'submit', 'form[data-validate]', (e) => {
                if (!this.validateForm(e.target)) {
                    e.preventDefault();
                }
            });

            Utils.delegate(document, 'blur', 'input[data-validate]', (e) => {
                this.validateField(e.target);
            });
        },

        validateForm: function(form) {
            const fields = form.querySelectorAll('input[data-validate], select[data-validate], textarea[data-validate]');
            let isValid = true;

            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            return isValid;
        },

        validateField: function(field) {
            const rules = field.getAttribute('data-validate').split('|');
            let isValid = true;
            let errorMessage = '';

            rules.forEach(rule => {
                const [ruleName, ruleValue] = rule.split(':');
                
                switch (ruleName) {
                    case 'required':
                        if (!field.value.trim()) {
                            isValid = false;
                            errorMessage = 'Bu alan zorunludur.';
                        }
                        break;
                    case 'email':
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (field.value && !emailRegex.test(field.value)) {
                            isValid = false;
                            errorMessage = 'Geçerli bir e-posta adresi giriniz.';
                        }
                        break;
                    case 'min':
                        if (field.value && field.value.length < parseInt(ruleValue)) {
                            isValid = false;
                            errorMessage = `En az ${ruleValue} karakter olmalıdır.`;
                        }
                        break;
                    case 'max':
                        if (field.value && field.value.length > parseInt(ruleValue)) {
                            isValid = false;
                            errorMessage = `En fazla ${ruleValue} karakter olmalıdır.`;
                        }
                        break;
                }
            });

            this.showFieldError(field, errorMessage);
            return isValid;
        },

        showFieldError: function(field, message) {
            // Remove existing error
            const existingError = field.parentNode.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }

            // Add new error if message exists
            if (message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error text-danger mt-1';
                errorDiv.textContent = message;
                field.parentNode.appendChild(errorDiv);
                field.classList.add('is-invalid');
            } else {
                field.classList.remove('is-invalid');
            }
        }
    };

    // ===== NOTIFICATION SYSTEM =====
    
    const Notification = {
        show: function(message, type = 'info', duration = 5000) {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type} fade-in`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-message">${message}</span>
                    <button class="notification-close">&times;</button>
                </div>
            `;

            // Add styles
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 300px;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;

            document.body.appendChild(notification);

            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 10);

            // Close button
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => this.hide(notification));

            // Auto hide
            if (duration > 0) {
                setTimeout(() => this.hide(notification), duration);
            }

            return notification;
        },

        hide: function(notification) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        },

        success: function(message, duration) {
            return this.show(message, 'success', duration);
        },

        error: function(message, duration) {
            return this.show(message, 'error', duration);
        },

        warning: function(message, duration) {
            return this.show(message, 'warning', duration);
        }
    };

    // ===== INITIALIZATION =====
    
    Utils.ready(function() {
        // Initialize all components
        StoryPlayer.init();
        MenuCustomizer.init();
        FormValidator.init();

        // Show success messages from TempData
        const successMessage = Utils.$('[data-success-message]');
        if (successMessage) {
            const message = successMessage.getAttribute('data-success-message');
            Notification.success(message);
        }

        // Show error messages from TempData
        const errorMessage = Utils.$('[data-error-message]');
        if (errorMessage) {
            const message = errorMessage.getAttribute('data-error-message');
            Notification.error(message);
        }

        // Initialize tooltips
        const tooltips = Utils.$$('[data-tooltip]');
        tooltips.forEach(element => {
            element.addEventListener('mouseenter', function() {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = this.getAttribute('data-tooltip');
                tooltip.style.cssText = `
                    position: absolute;
                    background: #333;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    z-index: 1000;
                    pointer-events: none;
                `;
                
                document.body.appendChild(tooltip);
                
                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
                
                this.tooltip = tooltip;
            });
            
            element.addEventListener('mouseleave', function() {
                if (this.tooltip) {
                    this.tooltip.remove();
                    this.tooltip = null;
                }
            });
        });
    });

    // ===== EXPOSE TO GLOBAL SCOPE =====
    
    window.QrMenu = {
        Utils,
        StoryPlayer,
        MenuCustomizer,
        FormValidator,
        Notification
    };

})();


