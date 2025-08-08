// public/js/registration.js

document.getElementById('registrationForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const response = await fetch('/daftar', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();

  const messageEl = document.getElementById('registrationMessage');
  if (result.success) {
    messageEl.textContent = '✅ Pendaftaran berhasil!';
    messageEl.className = 'text-green-600';
    form.reset();
  } else {
    messageEl.textContent = '❌ ' + (result.message || 'Pendaftaran gagal.');
    messageEl.className = 'text-red-600';
  }

  // Refresh data peserta setelah daftar
  fetchPeserta();
});
