// public/js/services/UserService.js

(function () {
	class UserService {
		constructor() {
			this.currentUserKey = 'currentUser';
		}

		_getStoredUser() {
			const raw = localStorage.getItem(this.currentUserKey);
			if (!raw) return null;
			try {
				return JSON.parse(raw);
			} catch {
				return null;
			}
		}

		getCurrentUser() {
			return this._getStoredUser();
		}

		_setCurrentUser(user) {
			localStorage.setItem(this.currentUserKey, JSON.stringify(user));
		}

		async register({ email, password, confirmPassword }) {
			if (!email || !password || !confirmPassword) {
				throw new Error('All fields are required.');
			}
			if (password !== confirmPassword) {
				throw new Error('Passwords do not match.');
			}

			// Перевіряємо, чи немає такого користувача
			const existingResp = await window.http.get('/users', {
				params: { email }
			});
			const existingUsers = existingResp.data || [];
			if (existingUsers.length > 0) {
				throw new Error('User with this email already exists.');
			}

			const newUser = {
				email,
				password
			};

			const createResp = await window.http.post('/users', newUser);
			const created = createResp.data || createResp;

			this._setCurrentUser(created);
			return created;
		}

		async login({ email, password }) {
			if (!email || !password) {
				throw new Error('Email and password are required.');
			}

			const resp = await window.http.get('/users', {
				params: { email }
			});
			const users = resp.data || [];

			if (users.length === 0) {
				throw new Error('User not found.');
			}

			const user = users[0];
			if (user.password !== password) {
				throw new Error('Invalid password.');
			}

			this._setCurrentUser(user);
			return user;
		}

		async logout() {
			localStorage.removeItem(this.currentUserKey);
		}
	}

	window.userService = new UserService();
})();
