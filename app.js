const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const FRONTEND_URL = 'https://scratch-image-hoster.netlify.app';
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

const upload = multer({
  dest: 'images/',
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use('/images', express.static(path.join(__dirname, 'images')));

const users = {}; 

app.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: 'Username required' });

  const code = Math.random().toString(36).substring(2, 8);
  users[username] = { code, verified: false };
  res.json({ message: `Add this code to your Scratch bio: ${code}` });
});

app.post('/verify', async (req, res) => {
  const { username } = req.body;
  if (!username || !users[username]) return res.status(400).json({ message: 'Invalid username' });

  try {
    const response = await axios.get(`https://api.scratch.mit.edu/users/${username}`);
    const bio = response.data.profile.bio;
    
    if (bio.includes(users[username].code)) {
      users[username].verified = true;
      res.json({ message: 'Verification successful' });
    } else {
      res.status(400).json({ message: 'Code not found in bio' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking profile' });
  }
});

app.post('/upload', upload.single('image'), (req, res) => {
  const { username } = req.body;
  if (!username || !users[username]?.verified) return res.status(403).json({ message: 'Unauthorized' });
  
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'images', req.file.originalname);

  fs.rename(tempPath, targetPath, err => {
    if (err) return res.status(500).json({ message: 'File upload failed' });

    const publicUrl = `${req.protocol}://${req.get('host')}/images/${req.file.originalname}`;
    res.json({ message: 'Image uploaded successfully', url: publicUrl });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
