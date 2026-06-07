// ⚠️ GANTI DENGAN LINK GOOGLE APPS SCRIPT ANDA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKS-Krc0WqgE2zOlPfd772Sa-QNhXdWQWoEqtj-J11QQox0N_0AqXX4HV5tU6fzsOK/exec";
const KANTOR_LAT = -6.628209010488044;   // Ganti koordinat kantor
const KANTOR_LNG = 106.29402842818563;
const MAX_JARAK = 50;          // Radius dalam meter

const videoEl = document.getElementById('camera');
const canvasEl = document.getElementById('canvas');
const btnAbsen = document.getElementById('btn-absen');
const statusEl = document.getElementById('status');
const previewEl = document.getElementById('preview');

let userLat = 0, userLng = 0;

// Aktifkan Kamera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => videoEl.srcObject = stream)
    .catch(err => statusEl.innerText = "Kamera Gagal: " + err.message);

// Hitung Jarak
function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Cek Lokasi
function cekLokasi() {
    navigator.geolocation.getCurrentPosition(pos => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        const jarak = hitungJarak(userLat, userLng, KANTOR_LAT, KANTOR_LNG);
        
        if (jarak <= MAX_JARAK) {
            statusEl.innerHTML = "<span style='color:green'>✅ LOKASI TERVERIFIKASI</span>";
            btnAbsen.disabled = false;
            btnAbsen.style.background = "#28a745";
        } else {
            statusEl.innerHTML = "<span style='color:red'>❌ LUAR RADIUS (" + Math.round(jarak) + "m)</span>";
            btnAbsen.disabled = true;
            btnAbsen.style.background = "#dc3545";
        }
    }, err => {
        statusEl.innerText = "GPS: " + err.message;
    }, { enableHighAccuracy: true });
}

// Proses Absen
btnAbsen.addEventListener('click', function() {
    const nama = prompt("Masukkan Nama Lengkap:");
    if (!nama) return;
    
    btnAbsen.disabled = true;
    btnAbsen.innerText = "Mengirim...";
    btnAbsen.style.background = "#6c757d";
    
    // Ambil foto
    canvasEl.width = 320;
    canvasEl.height = 240;
    canvasEl.getContext('2d').drawImage(videoEl, 0, 0, 320, 240);
    const foto = canvasEl.toDataURL('image/jpeg', 0.5);
    
    // Tampilkan preview
    previewEl.src = foto;
    previewEl.style.display = "block";
    videoEl.style.display = "none";
    
    // Kirim via JSONP
    const dataStr = encodeURIComponent(JSON.stringify({
        nama: nama,
        lat: userLat,
        lng: userLng,
        photo: foto
    }));
    
    const tag = document.createElement('script');
    tag.src = SCRIPT_URL + '?data=' + dataStr + '&callback=cbSukses';
    window.cbSukses = function(res) {
        if (res.status === 'success') {
            alert("✅ ABSENSI TERSIMPAN!");
            location.reload();
        } else {
            alert("Gagal: " + res.msg);
            btnAbsen.disabled = false;
            btnAbsen.innerText = "Coba Lagi";
        }
    };
    document.body.appendChild(tag);
});

// Mulai
window.onload = function() {
    setInterval(cekLokasi, 3000);