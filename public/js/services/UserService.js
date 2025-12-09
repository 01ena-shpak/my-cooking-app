// public/js/services/UserService.js
// User registration / login against json-server

(function (global) {
  if (!global.httpClient) {
    console.error('httpClient is not defined. Make sure http.js is loaded before UserService.js');
  }

  class UserService {
    constructor(httpClient) {
      this.http = httpClient;
      this.storageKey = 'currentUser';
    }

    // helper to read current user from localStorage
    getCurrentUser() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.error('Failed to parse current user from localStorage', e);
        return null;
      }
    }

    setCurrentUser(user) {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    }

    clearCurrentUser() {
      localStorage.removeItem(this.storageKey);
    }

    // --- API methods ---

    async register({ email, password, confirmPassword }) {
      // simple client-side validation
      if (!email || !password || !confirmPassword) {
        throw new Error('All fields are required.');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      // 1) check if user already exists
      const existing = await this.http.get('/users', {
        params: { email },
        useCache: false
      });

      if (Array.isArray(existing) && existing.length > 0) {
        throw new Error('User with this email already exists.');
      }

      // 2) create new user
      const newUser = await this.http.post('/users', {
        email,
        password
      });

      // 3) save to localStorage (user is considered logged-in after sign up)
      this.setCurrentUser(newUser);
      return newUser;
    }

    async login({ email, password }) {
      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      const users = await this.http.get('/users', {
        params: { email, password },
        useCache: false
      });

      if (!Array.isArray(users) || users.length === 0) {
        throw new Error('Invalid email or password.');
      }

      const user = users[0];
      this.setCurrentUser(user);
      return user;
    }

    logout() {
      this.clearCurrentUser();
    }
  }

  global.userService = new UserService(global.httpClient);
})(window);
