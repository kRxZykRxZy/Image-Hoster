const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Storage setup for uploads
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/upload', upload.single('image'), (req, res) => {
  res.redirect('/gallery');
});

app.get('/gallery', (req, res) => {
  fs.readdir('./public/uploads/', (err, files) => {
    if (err) return res.send('Error loading images');

    let imageTags = files.map(file => `<img src="/uploads/${file}" alt="${file}">`).join('');

    fs.readFile('./views/gallery.html', 'utf8', (err, data) => {
      if (err) return res.send('Error loading gallery');
      res.send(data.replace('<!-- Images will be injected here -->', imageTags));
    });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
