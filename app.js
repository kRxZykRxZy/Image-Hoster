// server.js (Node.js + Express)
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for the frontend site
const FRONTEND_URL = 'https://scratch-image-hoster.netlify.app';
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

// Session setup
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true,
}));

// Configure multer for file uploads
const upload = multer({ dest: 'images/' });

// Serve static images from the "images" directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// ScratchAuth verification endpoint
app.post('/login', async (req, res) => {
  const { username, token } = req.body;
  try {
    const verificationResponse = await axios.get(`api.scratch.mit.edu/users/${username}`);

    if (verificationResponse.data.profile.bio.includes(bio)) {
      req.session.user = username;
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Authentication failed - token not found');
    }
  } catch (error) {
    res.status(401).send('Authentication failed');
  }
});

// Middleware to check login
function checkAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(403).send('You must be logged in to upload images');
  }
  next();
}

// Handle image uploads
app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'images', req.file.originalname);

  fs.rename(tempPath, targetPath, err => {
    if (err) return res.status(500).send('File upload failed');
    const publicUrl = `https://image-hoster.onrender.com/images/${req.file.originalname}`;
    res.json({ message: 'Image uploaded successfully', url: publicUrl });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
