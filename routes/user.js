const PDFDocument = require('pdfkit');
const fs = require('fs');

// Route untuk download sertifikat
router.get('/sertifikat/:user_id', (req, res) => {
  const userId = req.params.user_id;

  const query = `
    SELECT users.nama, uploads.status
    FROM users
    JOIN uploads ON users.id = uploads.user_id
    WHERE users.id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).send('Gagal ambil data');
    if (results.length === 0) return res.status(404).send('User tidak ditemukan');

    const { nama, status } = results[0];
    if (status !== 'Lulus') return res.status(403).send('Belum dinyatakan lulus');

    // Buat PDF sertifikat
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=sertifikat-${nama}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('SERTIFIKAT SEMINAR', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Diberikan kepada:`);
    doc.fontSize(22).text(nama, { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(16).text('Sebagai bukti telah mengikuti seminar ini dan dinyatakan LULUS.', { align: 'center' });
    doc.moveDown(2);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, { align: 'right' });
    doc.text(`Tanda tangan`, { align: 'right' });

    doc.end();
  });
});
