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

const users = {}; // Store generated codes for verification

// Generate a random verification code
function generateCode() {
    return Math.random().toString(36).substring(2, 10);
}

// Handle login request
app.post('/login', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username required' });

    const code = generateCode();
    users[username] = code;
    res.json({ message: `Post this code on your Scratch profile: ${code}`, code });
});

// Verify login
app.post('/verify', async (req, res) => {
    const { username } = req.body;
    if (!username || !users[username]) return res.status(400).json({ message: 'Invalid request' });

    try {
        const profileUrl = `https://api.scratch.mit.edu/users/${username}`;
        const response = await axios.get(profileUrl);
        const profileBio = response.data.profile.bio;

        if (profileBio.includes(users[username])) {
            delete users[username]; // Remove code after verification
            return res.json({ message: 'Login successful', username });
        } else {
            return res.status(400).json({ message: 'Code not found on profile' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error verifying profile' });
    }
});

// Configure multer for file uploads
const upload = multer({
    dest: 'images/',
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Handle image upload
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file || !req.body.username) {
        return res.status(400).json({ message: 'Username and file required' });
    }

    const username = req.body.username;
    const targetPath = path.join(__dirname, 'images', `${username}-${req.file.originalname}`);

    fs.rename(req.file.path, targetPath, err => {
        if (err) {
            return res.status(500).json({ message: 'File upload failed' });
        }
        const publicUrl = `${req.protocol}://${req.get('host')}/images/${username}-${req.file.originalname}`;
        res.json({ message: 'Image uploaded successfully', url: publicUrl });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
