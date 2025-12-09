// public/js/pages/recipes-page.js

(function () {
    document.addEventListener("DOMContentLoaded", init);

    let cardTemplate = null;

    const state = {
        q: "",
        difficulty: "all",
        sort: null,
        order: "asc",
        page: 1,
        limit: 6
    };

    function init() {
        const grid = document.querySelector(".js-recipes-grid");
        if (!grid) {
            console.error("CRITICAL: .js-recipes-grid not found in DOM");
            return;
        }

        const originalCard = grid.querySelector(".recipe-card");
        if (originalCard) {
            cardTemplate = originalCard.cloneNode(true);
            cardTemplate.classList.remove("visually-hidden");
            grid.innerHTML = ""; 
        } else {
            console.error("CRITICAL: .recipe-card template not found inside grid!");
        }

        setupSearch();
        setupFilters();
        loadRecipes();
    }

    async function loadRecipes() {
        const grid = document.querySelector(".js-recipes-grid");
        const empty = document.querySelector(".recipes-empty");
        
        // cкролл вгору при завантаженні (щоб користувач бачив зміни)
        if (state.page > 1) window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            // очищаємо сітку перед вставкою нових
            grid.innerHTML = "";

            const { items, total } = await window.recipeService.getRecipes(state);

            console.log(`Loaded ${items.length} items. Total: ${total}`); 

            if (!items || items.length === 0) {
                if (empty) empty.classList.remove("visually-hidden");
                renderPagination(0);
                return;
            } else {
                if (empty) empty.classList.add("visually-hidden");
            }

            if (!cardTemplate) {
                grid.innerHTML = "<p style='color:red'>Error: Template missing. Refresh page.</p>";
                return;
            }

            items.forEach((recipe) => {
                const card = cardTemplate.cloneNode(true);
                fillRecipeCard(card, recipe);
                grid.appendChild(card);
            });

            renderPagination(total);

        } catch (e) {
            console.error(e);
            grid.innerHTML = "<p>Error loading recipes.</p>";
        }
    }

    function fillRecipeCard(card, recipe) {
        card.dataset.recipeId = recipe.id;

        const img = card.querySelector(".js-recipe-image");
        const title = card.querySelector(".js-recipe-title");
        const time = card.querySelector(".js-recipe-time");
        const calories = card.querySelector(".js-recipe-calories");
        const difficulty = card.querySelector('.js-recipe-difficulty');
        const link = card.querySelector(".js-recipe-details-link"); 
        const btnLink = card.querySelector(".recipe-card__button"); 

        if (!title) console.warn("Warning: .js-recipe-title not found in card");

        if (img) {
            img.src = recipe.image;
            img.alt = recipe.title;
        }
        if (title) title.textContent = recipe.title;
        if (time) time.textContent = `${recipe.time} min`;
        if (calories) calories.textContent = `${recipe.calories} kcal`;
        if (difficulty) difficulty.textContent = `Difficulty: ${recipe.difficulty}`;
        
        const href = `#/recipe/${recipe.id}`; 
        if (link) link.href = href;
        if (btnLink) btnLink.href = href;
    }

    function setupSearch() {
        const form = document.querySelector(".recipes-search-form");
        if (!form) return;

        form.addEventListener("submit", (e) => {
            e.preventDefault(); 
            const qInput = form.querySelector("#recipes-query");
            
            const newVal = qInput ? qInput.value.trim() : "";
            console.log("Searching for:", newVal); 

            state.q = newVal;
            state.page = 1; 
            loadRecipes();
        });
    }

    function setupFilters() {
        const timeBtn = document.querySelector(".js-filter-time");
        const caloriesBtn = document.querySelector(".js-filter-calories");
        const difficultyTrigger = document.querySelector(".js-difficulty-trigger");
        const difficultyMenu = document.querySelector(".js-difficulty-menu");
        const difficultyItems = difficultyMenu ? difficultyMenu.querySelectorAll(".recipes-filter-dropdown__item") : [];

        function updateSortUI() {
            [timeBtn, caloriesBtn].forEach(btn => {
                if(btn) btn.classList.toggle("recipes-filter-btn--active", btn.dataset.sortField === state.sort);
            });
        }

        if (timeBtn) timeBtn.onclick = () => {
            state.sort = "time";
            state.order = state.order === "asc" ? "desc" : "asc";
            state.page = 1;
            updateSortUI();
            loadRecipes();
        };

        if (caloriesBtn) caloriesBtn.onclick = () => {
            state.sort = "calories";
            state.order = state.order === "asc" ? "desc" : "asc";
            state.page = 1;
            updateSortUI();
            loadRecipes();
        };

        if (difficultyTrigger && difficultyMenu) {
            difficultyTrigger.onclick = (e) => { e.stopPropagation(); difficultyMenu.classList.toggle("is-open"); };
            
            difficultyItems.forEach(item => {
                item.onclick = (e) => {
                    e.stopPropagation();
                    const val = item.dataset.difficulty || "all";
                    state.difficulty = val;
                    state.page = 1;
                    difficultyTrigger.textContent = val === "all" ? "Difficulty ▾" : `Difficulty: ${val}`;
                    difficultyMenu.classList.remove("is-open");
                    loadRecipes();
                };
            });
            
            document.addEventListener("click", (e) => {
                 if (!difficultyMenu.contains(e.target) && !difficultyTrigger.contains(e.target)) difficultyMenu.classList.remove("is-open");
            });
        }
    }

    function renderPagination(total) {
        const container = document.querySelector(".js-recipes-pagination");
        if (!container) return;
        container.innerHTML = "";

        const totalPages = Math.ceil(total / state.limit);
        if (totalPages <= 1) return;

        const createBtn = (text, onClick, disabled) => {
            const btn = document.createElement("button");
            btn.textContent = text;

            btn.className = "btn btn--filter"; 
            
            btn.disabled = disabled;

            if (disabled) btn.style.opacity = "0.5"; 
            if (disabled) btn.style.cursor = "default";

            btn.addEventListener("click", onClick);
            return btn;
        };

        const prev = createBtn("Prev", () => {
            if (state.page > 1) { state.page--; loadRecipes(); }
        }, state.page === 1);

        const next = createBtn("Next", () => {
            if (state.page < totalPages) { state.page++; loadRecipes(); }
        }, state.page === totalPages);

        const info = document.createElement("span");
        info.className = "pagination-info"; 
        info.textContent = `Page ${state.page} of ${totalPages}`;

        container.append(prev, info, next);
    }
})();