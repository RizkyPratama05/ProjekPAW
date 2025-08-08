// public/js/event.js

document.getElementById('uploadForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const response = await fetch('/upload', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();

  const messageEl = document.getElementById('uploadMessage');
  if (result.success) {
    messageEl.textContent = '✅ Berkas berhasil diunggah.';
    messageEl.className = 'text-green-600';
    form.reset();
  } else {
    messageEl.textContent = '❌ ' + (result.message || 'Gagal mengunggah berkas.');
    messageEl.className = 'text-red-600';
  }

  // Refresh data peserta
  fetchPeserta();
});

// Fungsi untuk menampilkan data peserta & sertifikat
async function fetchPeserta() {
  const response = await fetch('/peserta');
  const data = await response.json();

  const container = document.getElementById('pesertaList');
  container.innerHTML = ''; // kosongkan dulu

  if (!Array.isArray(data)) return;

  data.forEach(p => {
    const div = document.createElement('div');
    div.className = 'p-4 mb-2 bg-gray-100 rounded';

    div.innerHTML = `
      <p><strong>Nama:</strong> ${p.nama}</p>
      <p><strong>Email:</strong> ${p.email}</p>
      <p><strong>Status:</strong> ${p.status}</p>
      ${p.status === 'Lulus' ? `<a href="/sertifikat/${p.id}" class="mt-2 inline-block text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded">Download Sertifikat</a>` : ''}
    `;

    container.appendChild(div);
  });
}

// Jalankan saat halaman load
fetchPeserta();
