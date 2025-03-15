const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = 'users.json'; // Where we store the verified users

// Enable CORS for multiple origins
const ALLOWED_ORIGINS = [
  'https://scratch-image-hoster.netlify.app', // First site
  'https://ubbload.netlify.app',                // Second site
  'https://krxzykrxzy.github.io/Image-Hoster'            // Third site, etc.
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Configure image uploads
const upload = multer({ dest: 'images/', limits: { fileSize: 5 * 1024 * 1024 } });
app.use('/images', express.static(path.join(__dirname, 'images')));

// Load verified users from file
let users = {};
if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE));
}

// Save verified users to file
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Login - Generate code
app.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: 'Username required' });

  if (users[username]) {
    return res.json({ message: 'You are already verified! You can upload images.', verified: true });
  }

  const code = Math.random().toString(36).substring(2, 8);
  users[username] = { code, verified: false };
  saveUsers();
  
  res.json({ message: `Add this code to your Scratch bio: ${code}. This may take a few minutes to find the code in your bio as the api takes a long time to update.` });
});

// Verify code in Scratch bio
app.post('/verify', async (req, res) => {
  const { username } = req.body;
  if (!username || !users[username]) return res.status(400).json({ message: 'Invalid username' });

  if (users[username].verified) {
    return res.json({ message: 'You are already verified!', verified: true });
  }

  try {
    const response = await axios.get(`https://api.scratch.mit.edu/users/${username}`);
    const bio = response.data.profile.bio;

    if (bio.includes(users[username].code)) {
      users[username].verified = true;
      saveUsers();
      res.json({ message: 'Verification successful', verified: true });
    } else {
      res.status(400).json({ message: 'Code not found in bio' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking profile' });
  }
});

// Image Upload
app.post('/upload', upload.single('image'), (req, res) => {
  const { username } = req.body;
  if (!username || !users[username]?.verified) return res.status(403).json({ message: 'Unauthorized' });

  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const userDir = path.join(__dirname, 'images', username);

  // Create directory for the user if it doesn't exist
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const tempPath = req.file.path;
  const targetPath = path.join(userDir, req.file.originalname);

  fs.rename(tempPath, targetPath, err => {
    if (err) return res.status(500).json({ message: 'File upload failed' });

    // Update to the new URL structure
    const publicUrl = `https://image-hoster.onrender.com/images/${username}/${req.file.originalname}`;
    res.json({ message: 'Image uploaded successfully', url: publicUrl });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
