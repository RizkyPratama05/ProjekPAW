const express = require('express');
const db = require('./models/db'); // Koneksi database
const path = require('path');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const session = require('express-session');
const PDFDocument = require('pdfkit');


const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));
app.use(session({
  secret: 'rahasia_super_amann',
  resave: false,
  saveUninitialized: true,
}));

// Routes
app.use('/admin', adminRoutes);
app.use('/upload', uploadRoutes);
app.use('/', authRoutes);

// Endpoint untuk cek autentikasi
app.get('/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Endpoint logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Gagal logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout berhasil' });
  });
});

// Middleware untuk cek autentikasi
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu untuk mendaftar seminar' });
  }
  next();
};

// Halaman utama - redirect ke beranda user
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'beranda.html'));
});

// Halaman upload berkas
app.get('/upload-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Halaman pendaftaran - hanya untuk user yang sudah login
app.get('/daftar', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'daftar.html'));
});

// Aksi daftar (POST) - hanya untuk user yang sudah login
app.post('/daftar', requireAuth, async (req, res) => {
  const { nama, email } = req.body;
  const userId = req.session.user.id;
  
  try {
    // Simpan data pendaftaran ke database
    const query = 'INSERT INTO peserta (nama, email, user_id, status) VALUES (?, ?, ?, ?)';
    await new Promise((resolve, reject) => {
      db.query(query, [nama, email, userId, 'Pending'], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    res.json({ message: 'Pendaftaran seminar berhasil! Status Anda akan diverifikasi oleh admin.' });
  } catch (err) {
    console.error('Error saat mendaftar:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat mendaftar seminar' });
  }
});

// Ambil semua peserta
app.get('/peserta', (req, res) => {
  const query = 'SELECT * FROM peserta';
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Ambil peserta berdasarkan user yang login
app.get('/my-registrations', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const query = 'SELECT * FROM peserta WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Verifikasi status peserta
app.put('/verifikasi/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const query = 'UPDATE peserta SET status = ? WHERE id = ?';
  db.query(query, [status, id], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

// Generate sertifikat PDF jika status = "Lulus"
app.get('/sertifikat/:id', (req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM peserta WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).send('Peserta tidak ditemukan');

    const peserta = results[0];
    if (peserta.status !== 'Lulus') return res.status(403).send('Sertifikat hanya untuk peserta yang Lulus');

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sertifikat_${peserta.nama}.pdf`);
    doc.pipe(res);

    // Isi sertifikat
    doc
      .fontSize(28)
      .text('SERTIFIKAT', { align: 'center' })
      .moveDown(1);

    doc
      .fontSize(20)
      .text(`Diberikan kepada:`, { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(24)
      .fillColor('blue')
      .text(peserta.nama, { align: 'center' })
      .fillColor('black')
      .moveDown(1);

    doc
      .fontSize(16)
      .text(`Atas partisipasinya dalam seminar/workshop`, { align: 'center' })
      .text(`Email: ${peserta.email}`, { align: 'center' })
      .moveDown(2);

    doc
      .fontSize(12)
      .text(`Tangerang, ${new Date().toLocaleDateString('id-ID')}`, { align: 'right', margin: 50 });

    doc.end();
  });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
