const express = require('express');
const path = require('path');

const app = express();

// Налаштування EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Підключення статичних файлів
app.use(express.static(path.join(__dirname, 'public')));

// Маршрути
app.get('/', (req, res) => {
  res.render('pages/index');
});

app.get('/recipes', (req, res) => {
  res.render('pages/recipes');
});

app.get('/recipe', (req, res) => {
  res.render('pages/recipe');
});

app.get('/favorites', (req, res) => {
  res.render('pages/favorites');
});

app.get('/registration', (req, res) => {
  const mode = req.query.mode === 'signin' ? 'signin' : 'signup';
  res.render('pages/registration', { mode });
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
