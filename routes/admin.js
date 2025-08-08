const express = require('express');
const db = require('../models/db');
const router = express.Router();

// GET semua upload user
router.get('/uploads', (req, res) => {
  const query = `
    SELECT uploads.id, uploads.filename, uploads.status, users.nama
    FROM uploads
    JOIN users ON uploads.user_id = users.id
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).send('Gagal ambil data');
    res.json(results);
  });
});

// PUT update status
router.put('/update-status/:id', (req, res) => {
  const { status } = req.body;
  const uploadId = req.params.id;

  db.query('UPDATE uploads SET status = ? WHERE id = ?', [status, uploadId], (err) => {
    if (err) return res.status(500).send('Gagal update status');
    res.send('Status berhasil diupdate');
  });
});

module.exports = router;
