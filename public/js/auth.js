// public/js/auth.js
// Робота з формою реєстрації/логіну + оновлення хедера

(function () {
  'use strict';

  // ===== Допоміжні функції стану користувача =====
  function getCurrentUser() {
    try {
      const raw = localStorage.getItem('currentUser');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearCurrentUser() {
    localStorage.removeItem('currentUser');
  }

  // ===== Оновлення хедера залежно від того, залогінений юзер чи ні =====
  function renderAuthHeader() {
    const user = getCurrentUser();
    const authControls = document.querySelector('.auth-controls');
    if (!authControls) return;

    const signInLink  = authControls.querySelector('a[href*="mode=signin"]');
    const signUpLink  = authControls.querySelector('a[href*="mode=signup"]');
    const userGreeting = authControls.querySelector('.user-greeting');

    // посилання на Favorites у навігації
    const favoritesLink = document.querySelector('.main-nav a[href="/favorites"]');
    const favoritesItem = favoritesLink ? favoritesLink.closest('li') : null;

    let logoutBtn = authControls.querySelector('.logout-button');

    if (user && user.email) {
      const name = user.email.split('@')[0] || 'User';

      // показуємо привітання
      if (userGreeting) {
        userGreeting.textContent = `Hello, ${name}!`;
        userGreeting.classList.remove('visually-hidden');
        userGreeting.style.display = 'inline-flex';
      }

      // ховаємо кнопки Sign in / Sign up
      if (signInLink) signInLink.classList.add('visually-hidden');
      if (signUpLink) signUpLink.classList.add('visually-hidden');

      // показуємо Favorites
      if (favoritesItem) favoritesItem.style.display = '';

      // створюємо кнопку Log out, якщо її ще немає
      if (!logoutBtn) {
        logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.className = 'logout-button';
        logoutBtn.textContent = 'Log out';

        authControls.appendChild(logoutBtn);

        logoutBtn.addEventListener('click', () => {
          clearCurrentUser();
          renderAuthHeader();
          // після логауту повертаємо на головну
          window.location.href = '/';
        });
      }
    } else {
      // користувача немає → показуємо Sign in / Sign up
      if (signInLink) signInLink.classList.remove('visually-hidden');
      if (signUpLink) signUpLink.classList.remove('visually-hidden');

      // ховаємо привітання
      if (userGreeting) {
        userGreeting.classList.add('visually-hidden');
        userGreeting.style.display = 'none';
      }

      // ховаємо Favorites
      if (favoritesItem) favoritesItem.style.display = 'none';

      // видаляємо кнопку Log out, якщо була
      if (logoutBtn) {
        logoutBtn.remove();
      }
    }
  }

  // ===== Повідомлення під формою =====
  function showMessage(container, type, text) {
    if (!container) return;
    container.textContent = text;
    container.classList.remove('auth-message--error', 'auth-message--success');
    if (text.trim() !== '') {
      container.classList.add(
        type === 'error' ? 'auth-message--error' : 'auth-message--success'
      );
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // одразу перемальовуємо хедер на всіх сторінках
    renderAuthHeader();

    // ===== Робота з формою /registration =====
    const form = document.querySelector('.auth-form');
    if (!form) return;

    let messageContainer = document.querySelector('.auth-message');
    if (!messageContainer) {
      messageContainer = document.createElement('p');
      messageContainer.className = 'auth-message';
      form.prepend(messageContainer);
    }

    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!window.userService) {
        console.error('userService is not defined');
        return;
      }

      const formData = new FormData(form);
      const email = (formData.get('email') || '').toString().trim();
      const password = (formData.get('password') || '').toString().trim();
      const confirmPasswordRaw = formData.get('confirmPassword');
      const confirmPassword = confirmPasswordRaw
        ? confirmPasswordRaw.toString().trim()
        : null;

      const mode = confirmPassword !== null ? 'signup' : 'signin';

      showMessage(messageContainer, 'success', '');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
      }

      try {
        if (mode === 'signup') {
          await window.userService.register({ email, password, confirmPassword });
          showMessage(
            messageContainer,
            'success',
            'Account created successfully. Redirecting to sign in...'
          );

          setTimeout(() => {
            window.location.href = '/registration?mode=signin';
          }, 1000);
        } else {
          const user = await window.userService.login({ email, password });
          // якщо UserService сам не зберігає користувача – на всяк випадок збережемо тут
          if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          }

          showMessage(messageContainer, 'success', 'Login successful. Redirecting...');
          renderAuthHeader(); // оновити хедер

          setTimeout(() => {
            window.location.href = '/';
          }, 800);
        }
      } catch (err) {
        console.error(err);
        showMessage(messageContainer, 'error', err.message || 'Unexpected error.');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove('is-loading');
        }
      }
    });
  });
})();
