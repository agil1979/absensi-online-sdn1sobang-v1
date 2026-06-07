const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxHlrbcstS_ZmvCrveySLjsScIEd2d28QmLOJ7uI4M-Nj8qSchPtAqH_Jfa0AB9ZNqB/exec"; // <--- PASTIIN URL BARU
const KANTOR_LAT = -6.628209010488044; 
const KANTOR_LNG = 106.29402842818563;
const MAX_JARAK = 50; 

const videoEl = document.getElementById('camera');
const canvasEl = document.getElementById('canvas');
const btnAbsen = document.getElementById('btn-absen');
const statusEl = document.getElementById('status');

let userLat = 0, userLng = 0;

// Kamera
navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
    .then(s => videoEl.srcObject = s)
    .catch(e => statusEl.innerText = "Kamera Gagal: " + e.message);

// Lokasi
function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

setInterval(() => {
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
    }, null, { enableHighAccuracy: true });
}, 3000);

// Proses Kirim
btnAbsen.addEventListener('click', async function() {
    const nama = prompt("Masukkan Nama Lengkap:");
    if (!nama) return;

    btnAbsen.disabled = true;
    btnAbsen.innerText = "Sedang Mengirim...";

    // KOMPRESI FOTO: Paksa ukuran kecil 300px agar HP tidak berat
    canvasEl.width = 300;
    canvasEl.height = 400;
    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, 300, 400);
    
    // Kualitas 0.3 (sangat ringan untuk HP)
    const foto = canvasEl.toDataURL('image/jpeg', 0.3);

    const payload = {
        nama: nama,
        lat: userLat,
        lng: userLng,
        photo: foto
    };

    try {
        // Gunakan Fetch POST (lebih kuat untuk data besar)
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Penting untuk bypass CORS di HP
            body: JSON.stringify(payload)
        });

        // Karena no-cors, kita tidak bisa baca respon, tapi kita asumsikan sukses jika lewat
        alert("✅ ABSENSI TERKIRIM!");
        location.reload();
    } catch (err) {
        alert("Gagal mengirim: " + err.message);
        btnAbsen.disabled = false;
        btnAbsen.innerText = "Ambil Foto & Absen";
    }
});
