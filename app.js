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
app.use(express.static('public'));

// Routes
app.use('/admin', adminRoutes);
app.use('/upload', uploadRoutes);
app.use('/', authRoutes);

// Halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Halaman pendaftaran
app.get('/daftar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'daftar.html'));
});

// Aksi daftar (POST)
app.post('/daftar', (req, res) => {
  console.log('Data yang dikirim:', req.body);
  // Simpan data ke database jika diperlukan
  res.sendFile(path.join(__dirname, 'public', 'daftar.html'));
});

app.post('/daftar', async (req, res) => {
  const { email, password } = req.body;

  const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (existingUser.length > 0) {
    return res.status(400).json({ message: 'Email sudah terdaftar' });
  }

  await db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password]);
  res.status(201).json({ message: 'Pendaftaran berhasil' });
});


// Ambil semua peserta
app.get('/peserta', (req, res) => {
  const query = 'SELECT * FROM peserta';
  db.query(query, (err, results) => {
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
