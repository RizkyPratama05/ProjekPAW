const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcrypt');

// Endpoint POST /register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validasi input
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Semua field wajib diisi!' });
  }

  // Cek apakah email sudah terdaftar
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    if (results.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru
    db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'user'],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Gagal daftar' });
        return res.status(201).json({ message: 'Pendaftaran berhasil!' });
      }
    );
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email dan password wajib diisi!' });

  // Cek user
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(401).json({ message: 'Email tidak ditemukan' });

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) return res.status(401).json({ message: 'Password salah' });

    // Simpan sesi
    req.session.user = {
      id: user.id,
      name: user.name,
      role: user.role
    };

    res.redirect('/dashboard.html'); // Ganti nanti kalau pakai halaman berbeda
  });
});

module.exports = router;
