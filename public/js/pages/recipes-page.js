(function () {
    document.addEventListener("DOMContentLoaded", init);

    let cardTemplate = null;

    function getFavoritesKey() {
        try {
            const raw = localStorage.getItem('currentUser');
            if (!raw) return 'favorites_anon';

            const user = JSON.parse(raw);
            const idPart = user.id || user.email || 'anon';
            return `favorites_${idPart}`;
        } catch {
            return 'favorites_anon';
        }
    }

    function loadFavoritesIds() {
        const key = getFavoritesKey();
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    function saveFavoritesIds(ids) {
        const key = getFavoritesKey();
        localStorage.setItem(key, JSON.stringify(ids));
    }

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
        if (grid) {
            const originalCard = grid.querySelector(".recipe-card");
            if (originalCard) {
                cardTemplate = originalCard.cloneNode(true);
                cardTemplate.classList.remove("visually-hidden");
                grid.innerHTML = "";
            }
        }

        setupSearch();
        setupFilters();

        window.addEventListener("hashchange", handleRouting);
        handleRouting();
    }

    async function handleRouting() {
        const hash = window.location.hash;
        const viewList = document.getElementById("view-list");
        const viewDetail = document.getElementById("view-detail");

        if (!hash || hash === "" || hash.startsWith("#/list")) {
            if (viewDetail) viewDetail.hidden = true;
            if (viewList) viewList.hidden = false;

            const grid = document.querySelector(".js-recipes-grid");
            if (grid && grid.children.length === 0) {
                loadRecipes();
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        // hash типу #/recipe/5
        else if (hash.startsWith("#/recipe/")) {
            const id = hash.split("/")[2]; 
            if (id) {
                if (viewList) viewList.hidden = true;
                if (viewDetail) viewDetail.hidden = false;
                await loadRecipeDetails(id);
            }
        }
    }

    async function loadRecipeDetails(id) {
        try {
            let recipe = null;
            if (window.recipeService.allRecipesCache) {
                recipe = window.recipeService.allRecipesCache.find(r => r.id == id);
            }

            if (!recipe) {
                recipe = await window.recipeService.getOne(id);
            }

            if (recipe) {
                renderDetailView(recipe);
            }
        } catch (e) {
            console.error("Error loading detail:", e);
        }
    }

    function renderDetailView(recipe) {
        const img = document.querySelector(".js-detail-img");
        if (img) { img.src = recipe.image; img.alt = recipe.title; }

        const title = document.querySelector(".js-detail-title");
        if (title) title.textContent = recipe.title;

        const time = document.querySelector(".js-detail-time");
        if (time) time.textContent = `${recipe.time} min`;

        const cal = document.querySelector(".js-detail-calories");
        if (cal) cal.textContent = `${recipe.calories} kcal`;

        const ingList = document.querySelector(".js-detail-ingredients");
        if (ingList) {
            ingList.innerHTML = "";
            const ingredients = recipe.ingredients || ["Check recipe description for details."];
            ingredients.forEach(ing => {
                const li = document.createElement("li");
                li.textContent = ing;
                ingList.appendChild(li);
            });
        }

        const instList = document.querySelector(".js-detail-instructions");
        if (instList) {
            instList.innerHTML = "";
            const instructions = recipe.instructions || ["Cook and enjoy!"];
            instructions.forEach(step => {
                const li = document.createElement("li");
                li.textContent = step;
                instList.appendChild(li);
            });
        }

        setupFavoriteButton(recipe.id);
    }

    function setupFavoriteButton(id) {
        const btn = document.querySelector(".js-fav-btn");
        if (!btn) return;

        const strId = String(id);

        //const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        const favorites = loadFavoritesIds();
        let isFav = favorites.includes(strId);

        updateBtnStyle(btn, isFav);

        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener("click", () => {
            isFav = !isFav;

            //const currentFavs = JSON.parse(localStorage.getItem("favorites") || "[]");
            const currentFavs = loadFavoritesIds();
            
            if (isFav) {
                if (!currentFavs.includes(strId)) currentFavs.push(strId);
            } else {
                const index = currentFavs.indexOf(strId);
                if (index > -1) currentFavs.splice(index, 1);
            }

            //localStorage.setItem("favorites", JSON.stringify(currentFavs));
            saveFavoritesIds(currentFavs);

            updateBtnStyle(newBtn, isFav);
        });
    }

    function updateBtnStyle(btn, isFav) {
        if (isFav) {
            btn.classList.add("is-favorite");
            btn.textContent = "Saved to Favorites";
        } else {
            btn.classList.remove("is-favorite");
            btn.textContent = "Save to Favorites";
        }
    }

    async function loadRecipes() {
        const grid = document.querySelector(".js-recipes-grid");
        const empty = document.querySelector(".recipes-empty");
        if (!grid) return;
        grid.innerHTML = "";

        try {
            const { items, total } = await window.recipeService.getRecipes(state);

            if (!items || items.length === 0) {
                if (empty) empty.classList.remove("visually-hidden");
                renderPagination(0);
                return;
            } else {
                if (empty) empty.classList.add("visually-hidden");
            }

            items.forEach((recipe) => {
                if (cardTemplate) {
                    const card = cardTemplate.cloneNode(true);
                    fillRecipeCard(card, recipe);
                    grid.appendChild(card);
                }
            });
            renderPagination(total);
        } catch (e) { console.error(e); }
    }

    function fillRecipeCard(card, recipe) {
        const img = card.querySelector(".js-recipe-image");
        const title = card.querySelector(".js-recipe-title");
        const time = card.querySelector(".js-recipe-time");
        const calories = card.querySelector(".js-recipe-calories");
        const difficulty = card.querySelector('.js-recipe-difficulty');
        const link = card.querySelector(".js-recipe-details-link");
        const btnLink = card.querySelector(".recipe-card__button");

        if (img) { img.src = recipe.image; img.alt = recipe.title; }
        if (title) title.textContent = recipe.title;
        if (time) time.textContent = `${recipe.time} min`;
        if (calories) calories.textContent = `${recipe.calories} kcal`;
        if (difficulty) difficulty.textContent = `Difficulty: ${recipe.difficulty}`;

        // посилання веде на хеш-роут
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
            state.q = qInput ? qInput.value.trim() : "";
            state.page = 1;
            window.location.hash = "#/list";
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
            window.location.hash = "#/list"; 
            updateSortUI();
            loadRecipes();
        };

        if (caloriesBtn) caloriesBtn.onclick = () => {
            state.sort = "calories";
            state.order = state.order === "asc" ? "desc" : "asc";
            state.page = 1;
            window.location.hash = "#/list"; 
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
                    window.location.hash = "#/list"; 
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
            if (disabled) { btn.style.opacity = "0.5"; btn.style.cursor = "default"; }
            btn.addEventListener("click", onClick);
            return btn;
        };

        const prev = createBtn("Prev", () => {
            if (state.page > 1) { state.page--; loadRecipes(); window.scrollTo({top:0,behavior:'smooth'});}
        }, state.page === 1);

        const next = createBtn("Next", () => {
            if (state.page < totalPages) { state.page++; loadRecipes(); window.scrollTo({top:0,behavior:'smooth'});}
        }, state.page === totalPages);

        const info = document.createElement("span");
        info.className = "pagination-info";
        info.textContent = `Page ${state.page} of ${totalPages}`;

        container.append(prev, info, next);
    }
})();