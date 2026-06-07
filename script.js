const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKS-Krc0WqgE2zOlPfd772Sa-QNhXdWQWoEqtj-J11QQox0N_0AqXX4HV5tU6fzsOK/exec";
const KANTOR_LAT = -6.628209010488044; 
const KANTOR_LNG = 106.29402842818563;
const MAX_JARAK = 50; 

const videoEl = document.getElementById('camera');
const canvasEl = document.getElementById('canvas');
const btnAbsen = document.getElementById('btn-absen');
const statusEl = document.getElementById('status');

let userLat = 0, userLng = 0;

// === 1. FUNGSI AKTIFKAN KAMERA ===
async function aktifkanKamera() {
    statusEl.innerText = "Meminta izin kamera...";
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: false 
        });
        videoEl.srcObject = stream;
        statusEl.innerText = "Kamera aktif. Mengecek lokasi...";
        cekLokasi(); // Jalankan cek lokasi setelah kamera aktif
    } catch (err) {
        statusEl.innerHTML = "<span style='color:red'>Gagal Kamera: " + err.message + "<br>Pastikan Izin Kamera Diaktifkan!</span>";
    }
}

// === 2. FUNGSI HITUNG JARAK ===
function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// === 3. FUNGSI CEK LOKASI ===
function cekLokasi() {
    if (!navigator.geolocation) {
        statusEl.innerText = "Browser tidak mendukung GPS";
        return;
    }

    // Gunakan watchPosition agar lebih responsif daripada getCurrentPosition
    navigator.geolocation.watchPosition(pos => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        const jarak = hitungJarak(userLat, userLng, KANTOR_LAT, KANTOR_LNG);
        
        if (jarak <= MAX_JARAK) {
            statusEl.innerHTML = "<span style='color:green'>✅ LOKASI TERVERIFIKASI ("+Math.round(jarak)+"m)</span>";
            btnAbsen.disabled = false;
            btnAbsen.style.background = "#28a745";
        } else {
            statusEl.innerHTML = "<span style='color:red'>❌ DI LUAR RADIUS (" + Math.round(jarak) + "m)</span>";
            btnAbsen.disabled = true;
            btnAbsen.style.background = "#dc3545";
        }
    }, err => {
        if(err.code === 1) {
            statusEl.innerHTML = "<span style='color:red'>Izin Lokasi Ditolak. Tolong izinkan di pengaturan browser!</span>";
        } else {
            statusEl.innerText = "Mencari sinyal GPS...";
        }
    }, { enableHighAccuracy: true });
}

// === 4. PROSES KLIK ABSEN ===
btnAbsen.addEventListener('click', function() {
    const nama = prompt("Masukkan Nama Lengkap:");
    if (!nama) return;
    
    btnAbsen.disabled = true;
    btnAbsen.innerText = "Mengirim...";
    
    canvasEl.width = 320;
    canvasEl.height = 240;
    canvasEl.getContext('2d').drawImage(videoEl, 0, 0, 320, 240);
    const foto = canvasEl.toDataURL('image/jpeg', 0.5);
    
    const dataStr = encodeURIComponent(JSON.stringify({
        nama: nama, lat: userLat, lng: userLng, photo: foto
    }));
    
    const tag = document.createElement('script');
    tag.src = SCRIPT_URL + '?data=' + dataStr + '&callback=cbSukses';
    window.cbSukses = function(res) {
        alert("✅ ABSENSI TERSIMPAN!");
        location.reload();
    };
    document.body.appendChild(tag);
});

// Jalankan Kamera saat halaman selesai dimuat
window.onload = aktifkanKamera;