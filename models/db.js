const mysql = require('mysql2');

// Konfigurasi koneksi
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',         // ← Ganti sesuai user MySQL kamu
  password: 'newpassword',         // ← Ganti kalau pakai password
  database: 'seminar_db'
});

// Tes koneksi
db.connect((err) => {
  if (err) {
    console.error('❌ Koneksi gagal:', err.message);
  } else {
    console.log('✅ Terhubung ke MySQL (seminar_db)');
  }
});

module.exports = db;
