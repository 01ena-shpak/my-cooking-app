// public/js/pages/recipes-page.js

(function () {
	document.addEventListener("DOMContentLoaded", init);

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
		if (!grid) return;

		setupSearch();
		setupFilters();
		loadRecipes();
	}

	async function loadRecipes() {
		const grid = document.querySelector(".js-recipes-grid");
		const empty = document.querySelector(".recipes-empty");
		if (!grid) return;

		const template = grid.querySelector(".recipe-card");
		if (!template) {
			console.error("No .recipe-card template inside .js-recipes-grid");
			return;
		}

		template.classList.add("visually-hidden");

		// очищаємо список, але залишаємо шаблон
		grid.innerHTML = "";
		grid.appendChild(template);

		try {
			if (!window.recipeService || !window.recipeService.getRecipes) {
				console.error("window.recipeService.getRecipes is not defined");
				return;
			}

			const { items, total } = await window.recipeService.getRecipes(state);

			if (items.length === 0) {
				if (empty) empty.classList.remove("visually-hidden");
				return;
			} else {
				if (empty) empty.classList.add("visually-hidden");
			}

			items.forEach((recipe) => {
				const card = template.cloneNode(true);
				card.classList.remove("visually-hidden");
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

		if (img) {
			img.src = recipe.image;
			img.alt = recipe.title;
		}

		if (title) title.textContent = recipe.title;
		if (time) time.textContent = `${recipe.time} min`;
		if (calories) calories.textContent = `${recipe.calories} kcal`;
        if (difficulty) difficulty.textContent = `Difficulty: ${recipe.difficulty}`;
		if (link) link.href = `/recipe?id=${recipe.id}`;
	}

	function setupSearch() {
		const form = document.querySelector(".recipes-search-form");
		if (!form) return;

		form.addEventListener("submit", (e) => {
			e.preventDefault();
			const qInput = form.querySelector("#recipes-query");
			state.q = qInput ? qInput.value.trim() : "";
			state.page = 1;
			loadRecipes();
		});
	}

	function setupFilters() {
		const timeBtn = document.querySelector(".js-filter-time");
		const caloriesBtn = document.querySelector(".js-filter-calories");

		const difficultyTrigger = document.querySelector(".js-difficulty-trigger");
		const difficultyMenu = document.querySelector(".js-difficulty-menu");
		const difficultyItems = difficultyMenu
			? difficultyMenu.querySelectorAll(".recipes-filter-dropdown__item")
			: [];

		function updateSortButtonsUI() {
			const allSortBtns = [timeBtn, caloriesBtn];
			allSortBtns.forEach((btn) => {
				if (!btn) return;
				const field = btn.dataset.sortField;
				const isActive = state.sort === field;
				btn.classList.toggle("recipes-filter-btn--active", isActive);
			});
		}

		// --- Time sort ---
		if (timeBtn) {
			timeBtn.addEventListener("click", () => {
				const isSame = state.sort === "time";
				state.sort = "time";
				state.order = isSame && state.order === "asc" ? "desc" : "asc";
				state.page = 1;
				updateSortButtonsUI();
				loadRecipes();
			});
		}

		// --- Calories sort ---
		if (caloriesBtn) {
			caloriesBtn.addEventListener("click", () => {
				const isSame = state.sort === "calories";
				state.sort = "calories";
				state.order = isSame && state.order === "asc" ? "desc" : "asc";
				state.page = 1;
				updateSortButtonsUI();
				loadRecipes();
			});
		}

		// --- Difficulty dropdown ---
		if (difficultyTrigger && difficultyMenu) {
			difficultyTrigger.addEventListener("click", (e) => {
				e.stopPropagation();
				difficultyMenu.classList.toggle("is-open");
			});

			difficultyItems.forEach((item) => {
				item.addEventListener("click", (e) => {
					e.stopPropagation();
					const value = item.dataset.difficulty || "all";
					state.difficulty = value;
					state.page = 1;

					if (value === "all") {
						difficultyTrigger.textContent = "Difficulty ▾";
					} else {
						difficultyTrigger.textContent = `Difficulty: ${value}`;
					}

					difficultyItems.forEach((i) =>
						i.classList.toggle("is-active", i === item)
					);

					difficultyMenu.classList.remove("is-open");
					loadRecipes();
				});
			});

			document.addEventListener("click", (event) => {
				if (
					!difficultyMenu.contains(event.target) &&
					!difficultyTrigger.contains(event.target)
				) {
					difficultyMenu.classList.remove("is-open");
				}
			});
		}

		updateSortButtonsUI();
	}

	function renderPagination(total) {
		const container = document.querySelector(".js-recipes-pagination");
		if (!container) return;

		container.innerHTML = "";

		const totalPages = Math.ceil(total / state.limit);
		if (!totalPages || totalPages <= 1) return;

		const prev = document.createElement("button");
		prev.textContent = "Prev";
		prev.disabled = state.page === 1;
		prev.addEventListener("click", () => {
			if (state.page > 1) {
				state.page--;
				loadRecipes();
			}
		});

		const next = document.createElement("button");
		next.textContent = "Next";
		next.disabled = state.page === totalPages;
		next.addEventListener("click", () => {
			if (state.page < totalPages) {
				state.page++;
				loadRecipes();
			}
		});

		const info = document.createElement("span");
		info.textContent = `Page ${state.page} of ${totalPages}`;

		container.append(prev, info, next);
	}
})();
