const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for the frontend site
const FRONTEND_URL = 'https://scratch-image-hoster.netlify.app';
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  dest: 'images/',
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Serve static images from the "images" directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Handle image uploads (no login required)
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'images', req.file.originalname);

  fs.rename(tempPath, targetPath, err => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(500).json({ message: 'File upload failed' });
    }
    const publicUrl = `${req.protocol}://${req.get('host')}/images/${req.file.originalname}`;
    res.json({ message: 'Image uploaded successfully', url: publicUrl });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
