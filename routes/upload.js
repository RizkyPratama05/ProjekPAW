const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../models/db');
const { isUserLoggedIn } = require('../middlewares/auth');

const router = express.Router();

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Endpoint POST /upload
router.post('/upload', isUserLoggedIn, upload.single('berkas'), (req, res) => {
  const userId = req.session.user.id;
  const filename = req.file.filename;

  // Simpan ke DB
  db.query('INSERT INTO uploads (user_id, filename) VALUES (?, ?)', [userId, filename], (err) => {
    if (err) return res.status(500).send('Gagal simpan data');
    res.send('Upload berhasil!');
  });
});

module.exports = router;
