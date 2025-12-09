// public/js/services/RecipeService.js

(function () {
	class RecipeService {
		constructor() {
			this.cache = new Map(); // in-memory кеш
		}

		_buildQuery(params = {}) {
			const query = new URLSearchParams();

			if (params.q) {
                // пошук по назві рецепта
                query.append("title_like", params.q);
            }

			if (params.difficulty && params.difficulty !== 'all') {
				query.append('difficulty', params.difficulty);
			}

			if (params.sort) query.append('_sort', params.sort);
			if (params.order) query.append('_order', params.order);

			if (params.page) query.append('_page', params.page);
			if (params.limit) query.append('_limit', params.limit);

			return query.toString();
		}

		async getRecipes(params = {}) {
			const key = JSON.stringify(params);

			// кеш
			if (this.cache.has(key)) {
				return this.cache.get(key);
			}

			const query = this._buildQuery(params);
			const response = await window.http.get(`/recipes?${query}`);

			const total =
				Number(response.headers['x-total-count']) ||
				(response.data ? response.data.length : 0);

			const result = {
				items: response.data || [],
				total
			};

			this.cache.set(key, result);
			return result;
		}

		async getOne(id) {
			const response = await window.http.get(`/recipes/${id}`);
			return response.data;
		}
	}

	window.recipeService = new RecipeService();
})();
