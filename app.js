const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend at scratch-image-hoster.netlify.app
const FRONTEND_URL = 'https://scratch-image-hoster.netlify.app';  // Frontend URL
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// Set up multer to handle file uploads
const upload = multer({
  dest: 'images/', // Directory where images will be stored
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Serve static files (images) from the "images" folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Route to handle image uploads
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Generate the public URL for the image
  const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;

  // Return the image URL in the response
  res.json({
    message: 'Image uploaded successfully',
    url: imageUrl
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
