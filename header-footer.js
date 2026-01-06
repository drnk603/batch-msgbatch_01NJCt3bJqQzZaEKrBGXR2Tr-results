(function () {
  var header = document.querySelector('.hf-header');
  var toggle = document.querySelector('.hf-nav-toggle');
  var yearEl = document.querySelector('.hf-footer-year');

  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var isOpen = header.classList.toggle('hf-nav-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  if (yearEl) {
    var now = new Date();
    yearEl.textContent = now.getFullYear();
  }
})();
