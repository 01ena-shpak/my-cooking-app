// public/js/api/http.js
// Єдиний HTTP-клієнт для json-server (http://localhost:3001)

(function (global) {
	const API_BASE_URL = 'http://localhost:3001';

	const instance = axios.create({
		baseURL: API_BASE_URL,
		headers: { 'Content-Type': 'application/json' }
	});

	// Обгортка, щоб усі сервіси користувались однаково
	const http = {
		get(url, config = {}) {
			return instance.get(url, config);			// повертаємо повну відповідь axios
		},
		post(url, data, config = {}) {
			return instance.post(url, data, config);
		},
		put(url, data, config = {}) {
			return instance.put(url, data, config);
		},
		delete(url, config = {}) {
			return instance.delete(url, config);
		}
	};

	global.http = http;
})(window);
