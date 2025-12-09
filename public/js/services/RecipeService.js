(function () {
    class RecipeService {
        constructor() {
            this.allRecipesCache = null; 
        }

        async getRecipes(params = {}) {
            if (!this.allRecipesCache) {
                try {
                    const response = await window.http.get('/recipes');
                    this.allRecipesCache = response.data;
                } catch (e) {
                    console.error("Failed to load recipes", e);
                    return { items: [], total: 0 };
                }
            }

            let filteredItems = [...this.allRecipesCache];

            if (params.q && params.q.trim().length > 0) {
                const search = params.q.toLowerCase().trim();
                filteredItems = filteredItems.filter(item => 
                    item.title.toLowerCase().includes(search)
                );
            }

            if (params.difficulty && params.difficulty !== 'all') {
                filteredItems = filteredItems.filter(item => 
                    item.difficulty === params.difficulty
                );
            }

            if (params.sort) {
                const field = params.sort;
                const order = params.order === 'desc' ? -1 : 1;

                filteredItems.sort((a, b) => {
                    let valA = a[field];
                    let valB = b[field];

                    if (typeof valA === 'string') valA = valA.toLowerCase();
                    if (typeof valB === 'string') valB = valB.toLowerCase();

                    if (valA < valB) return -1 * order;
                    if (valA > valB) return 1 * order;
                    return 0;
                });
            }

            const total = filteredItems.length;
            const page = Number(params.page) || 1;
            const limit = Number(params.limit) || 6;

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;

            const paginatedItems = filteredItems.slice(startIndex, endIndex);

            return {
                items: paginatedItems,
                total: total
            };
        }

        async getOne(id) {
            const response = await window.http.get(`/recipes/${id}`);
            return response.data;
        }
    }

    window.recipeService = new RecipeService();
})();