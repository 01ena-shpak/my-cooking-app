// public/js/header.js
// public/js/header-auth.js
// Стан хедера: показ Sign in/Sign up або "Hello, username" + Sign out

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const anonBlock = document.querySelector('.auth-controls__anonymous');
    const userMenu = document.querySelector('.user-menu');
    const favoritesItem = document.querySelector('.js-nav-favorites');

    const trigger = userMenu ? userMenu.querySelector('.user-menu__trigger') : null;
    const dropdown = userMenu ? userMenu.querySelector('.user-menu__dropdown') : null;
    const logoutBtn = userMenu ? userMenu.querySelector('.user-menu__logout') : null;
    const userNameEls = userMenu ? userMenu.querySelectorAll('.js-user-name') : [];
    const avatarLetterEl = userMenu ? userMenu.querySelector('.user-avatar__letter') : null;

    // поточний користувач з userService/localStorage
    const currentUser =
      window.userService && typeof window.userService.getCurrentUser === 'function'
        ? window.userService.getCurrentUser()
        : null;

    function setAnonState() {
      if (anonBlock) anonBlock.classList.remove('visually-hidden');
      if (userMenu) userMenu.classList.add('visually-hidden');
      if (favoritesItem) favoritesItem.classList.add('visually-hidden');
    }

    function setUserState(user) {
      const email = (user && user.email) || '';
      const username = email.split('@')[0] || 'user';
      const firstLetter = username.charAt(0).toUpperCase() || 'U';

      userNameEls.forEach((el) => (el.textContent = username));
      if (avatarLetterEl) avatarLetterEl.textContent = firstLetter;

      if (anonBlock) anonBlock.classList.add('visually-hidden');
      if (userMenu) userMenu.classList.remove('visually-hidden');
      if (favoritesItem) favoritesItem.classList.remove('visually-hidden');
    }

    if (!currentUser) {
      setAnonState();
    } else {
      setUserState(currentUser);
    }

    // відкриття/закриття дропдауну
    if (trigger && dropdown) {
      trigger.addEventListener('click', () => {
        const isOpen = dropdown.classList.toggle('user-menu__dropdown--open');
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      document.addEventListener('click', (event) => {
        if (!userMenu.contains(event.target)) {
          dropdown.classList.remove('user-menu__dropdown--open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Sign out
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          if (window.userService && typeof window.userService.logout === 'function') {
            await window.userService.logout();
          } else {
            // fallback: чистимо localStorage, якщо метод не описаний
            localStorage.removeItem('currentUser');
          }
        } catch (e) {
          console.error(e);
        } finally {
          window.location.href = '/';
        }
      });
    }
  });
})();
