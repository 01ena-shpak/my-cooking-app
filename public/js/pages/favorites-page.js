(function () {
    document.addEventListener("DOMContentLoaded", init);

    let cardTemplate = null;
    let allFavoriteRecipes = []; // тут зберігаємо повні об'єкти рецептів

    // стан саме для сторінки Favorites
    const state = {
        q: "",
        difficulty: "all",
        sort: null,
        order: "asc",
        page: 1,
        limit: 6
    };

    function init() {
        const grid = document.querySelector(".js-favorites-grid");
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

    // === ROUTER ===
    // використовуємо префікс #/favorites
    async function handleRouting() {
        const hash = window.location.hash;
        const viewList = document.getElementById("fav-view-list");
        const viewDetail = document.getElementById("fav-view-detail");

        if (!hash || hash === "" || hash === "#/favorites") {
            if (viewDetail) viewDetail.hidden = true;
            if (viewList) viewList.hidden = false;

            await loadFavoritesList();
            window.scrollTo({ top: 0, behavior: "smooth" });
        } 
        // #/favorites/detail/ID
        else if (hash.startsWith("#/favorites/detail/")) {
            const id = hash.split("/").pop(); 
            if (id) {
                if (viewList) viewList.hidden = true;
                if (viewDetail) viewDetail.hidden = false;
                await loadFavoriteDetail(id);
            }
        }
    }

    async function loadFavoritesList() {
        const grid = document.querySelector(".js-favorites-grid");
        const emptyState = document.querySelector(".favorites-empty");
        const noMatchState = document.querySelector(".favorites-no-match");
        const favPagination = document.querySelector(".js-favorites-pagination");

        if (!grid) return;

        // отримуємо ID
        const favoritesIds = JSON.parse(localStorage.getItem("favorites") || "[]");

        // якщо список ID зовсім пустий (користувач нічого не додав)
        if (favoritesIds.length === 0) {
            grid.innerHTML = "";
            if (favPagination) favPagination.innerHTML = "";
            
            if (emptyState) emptyState.classList.remove("visually-hidden");
            if (noMatchState) noMatchState.classList.add("visually-hidden");
            return;
        } else {
            // якщо рецепти Є, ховаємо блок "немає рецептів"
            if (emptyState) emptyState.classList.add("visually-hidden");
        }

        if (allFavoriteRecipes.length === 0) {
            try {
                const { items } = await window.recipeService.getRecipes({ limit: 1000 });
                allFavoriteRecipes = items.filter(r => favoritesIds.includes(String(r.id)));
            } catch (e) { console.error(e); return; }
        } else {
             allFavoriteRecipes = allFavoriteRecipes.filter(r => favoritesIds.includes(String(r.id)));
        }

        let filtered = [...allFavoriteRecipes];

        if (state.q) {
            const term = state.q.toLowerCase();
            filtered = filtered.filter(r => r.title.toLowerCase().includes(term));
        }

        if (state.difficulty !== "all") {
            filtered = filtered.filter(r => r.difficulty === state.difficulty);
        }

        if (state.sort) {
            const field = state.sort;
            const dir = state.order === "asc" ? 1 : -1;
            filtered.sort((a, b) => {
                const valA = a[field];
                const valB = b[field];
                if (valA < valB) return -1 * dir;
                if (valA > valB) return 1 * dir;
                return 0;
            });
        }

        const total = filtered.length;
        const totalPages = Math.ceil(total / state.limit);
        if (state.page > totalPages && totalPages > 0) state.page = 1;

        const start = (state.page - 1) * state.limit;
        const pageItems = filtered.slice(start, start + state.limit);

        grid.innerHTML = "";
        
        if (pageItems.length === 0) {
            if (noMatchState) noMatchState.classList.remove("visually-hidden");

            renderPagination(0);
        } else {
            if (noMatchState) noMatchState.classList.add("visually-hidden");

            pageItems.forEach(recipe => {
                if (cardTemplate) {
                    const card = cardTemplate.cloneNode(true);
                    fillCard(card, recipe);
                    grid.appendChild(card);
                }
            });
            renderPagination(total);
        }
    }

    function fillCard(card, recipe) {
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

        const href = `#/favorites/detail/${recipe.id}`;
        if (link) link.href = href;
        if (btnLink) btnLink.href = href;

        const favBtn = card.querySelector(".recipe-favorite-button");
        if (favBtn) {
            favBtn.classList.add("is-favorite");
            favBtn.textContent = "Remove";
            favBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                removeFromFavorites(recipe.id);
            });
        }
    }

    function removeFromFavorites(id) {
        const strId = String(id);
        const currentFavs = JSON.parse(localStorage.getItem("favorites") || "[]");
        const index = currentFavs.indexOf(strId);
        
        if (index > -1) {
            currentFavs.splice(index, 1);
            localStorage.setItem("favorites", JSON.stringify(currentFavs));

            allFavoriteRecipes = allFavoriteRecipes.filter(r => String(r.id) !== strId);

            if (window.location.hash.includes("/detail/")) {
                window.location.hash = "#/favorites";
            } else {
                loadFavoritesList();
            }
        }
    }

    async function loadFavoriteDetail(id) {
        let recipe = allFavoriteRecipes.find(r => String(r.id) === String(id));

        if (!recipe) {
            try {
                recipe = await window.recipeService.getOne(id);
                if (recipe) allFavoriteRecipes.push(recipe);
            } catch (e) { console.error(e); }
        }

        if (recipe) renderDetailView(recipe);
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
            (recipe.ingredients || ["See description"]).forEach(i => {
                const li = document.createElement("li");
                li.textContent = i;
                ingList.appendChild(li);
            });
        }

        const instList = document.querySelector(".js-detail-instructions");
        if (instList) {
            instList.innerHTML = "";
            (recipe.instructions || ["Just cook it"]).forEach(i => {
                const li = document.createElement("li");
                li.textContent = i;
                instList.appendChild(li);
            });
        }

        const btn = document.querySelector(".js-fav-btn");
        if (btn) {
            btn.classList.add("is-favorite"); 
            btn.textContent = "Remove from Favorites";

            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.onclick = () => {
                removeFromFavorites(recipe.id);
            };
        }
    }

    function setupSearch() {
        const form = document.querySelector(".favorites-search form"); 
        if (!form) return;

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const input = form.querySelector("input");
            state.q = input ? input.value.trim() : "";
            state.page = 1;
            window.location.hash = "#/favorites"; 
            loadFavoritesList();
        });
    }

    function setupFilters() {
        const timeBtn = document.querySelector(".js-filter-time");
        const caloriesBtn = document.querySelector(".js-filter-calories");
        
        const difficultyTrigger = document.querySelector(".js-difficulty-trigger");
        const difficultyMenu = document.querySelector(".js-difficulty-menu");
        const difficultyItems = difficultyMenu ? difficultyMenu.querySelectorAll("button") : [];

        function updateSortUI() {
             [timeBtn, caloriesBtn].forEach(b => {
                 if(b) b.classList.toggle("recipes-filter-btn--active", b.dataset.sortField === state.sort);
             });
        }

        if (timeBtn) timeBtn.onclick = () => {
            state.sort = "time";
            state.order = state.order === "asc" ? "desc" : "asc";
            state.page = 1;
            window.location.hash = "#/favorites"; 
            updateSortUI();
            loadFavoritesList();
        };

        if (caloriesBtn) caloriesBtn.onclick = () => {
            state.sort = "calories";
            state.order = state.order === "asc" ? "desc" : "asc";
            state.page = 1;
            window.location.hash = "#/favorites"; 
            updateSortUI();
            loadFavoritesList();
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
                     window.location.hash = "#/favorites"; 
                     loadFavoritesList();
                 };
             });
             document.addEventListener("click", (e) => {
                 if (!difficultyMenu.contains(e.target) && !difficultyTrigger.contains(e.target)) difficultyMenu.classList.remove("is-open");
             });
        }
    }

    function renderPagination(total) {
        const container = document.querySelector(".js-favorites-pagination");
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
            if (state.page > 1) { state.page--; loadFavoritesList(); window.scrollTo({top:0,behavior:'smooth'}); }
        }, state.page === 1);

        const next = createBtn("Next", () => {
            if (state.page < totalPages) { state.page++; loadFavoritesList(); window.scrollTo({top:0,behavior:'smooth'}); }
        }, state.page === totalPages);

        const info = document.createElement("span");
        info.className = "pagination-info";
        info.textContent = `Page ${state.page} of ${totalPages}`;

        container.append(prev, info, next);
    }
})();