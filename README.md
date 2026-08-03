# 🎮 Multiplication Adventure

Game edukasi untuk belajar **perkalian 1–10**, dibuat khusus untuk anak SD.
Dibangun murni dengan **HTML, CSS, dan JavaScript (Vanilla)** — tanpa framework
atau library eksternal apa pun. Cukup buka `index.html` di browser untuk memainkannya.

## 📁 Struktur Folder

```
MultiplicationAdventure/
│ index.html        → Struktur halaman & semua layar (screen)
│ style.css         → Seluruh styling, animasi, dan tema responsif
│ script.js         → Seluruh logika game (navigasi, skor, timer, dsb)
│
├── image/
│   logo.png         → Logo game
│   trophy.png        → Ikon trofi (layar hasil)
│   star.png         → Ikon bintang (efek jawaban benar)
│   heart.png        → Ikon nyawa
│   background.jpg   → Background dekoratif
│   mascot.png        → Maskot game
│
├── audio/
│   click.mp3        → Efek klik tombol
│   correct.mp3       → Efek jawaban benar
│   wrong.mp3         → Efek jawaban salah
│   gameover.mp3      → Efek game over
│   victory.mp3       → Efek menang
│   countdown.mp3     → Efek detik terakhir timer
│
└── README.md
```

> **Catatan tentang aset:** Semua gambar dan audio pada folder `image/` dan
> `audio/` adalah aset placeholder yang dibuat secara programatik (bentuk
> geometris & nada sintetis sederhana) agar proyek bisa langsung dijalankan
> tanpa aset eksternal. Silakan ganti file-file ini dengan aset ilustrasi/audio
> final sesuai selera — nama file dan lokasinya sudah dirancang agar bisa
> langsung ditimpa (replace) tanpa mengubah kode sama sekali.

## 🚀 Cara Menjalankan

1. Ekstrak/salin seluruh folder `MultiplicationAdventure`.
2. Buka file `index.html` dengan browser modern (Chrome, Edge, Firefox, Safari).
3. Selesai — tidak perlu instalasi, server, atau build tools apa pun.

## 🕹️ Cara Bermain

1. **Mode Belajar** — pilih angka 1–10 untuk melihat tabel perkaliannya lengkap
   beserta ilustrasi kotak titik (dot array) yang membantu anak memahami konsep
   perkalian sebagai "kelompok benda".
2. **Mulai Bermain** — masukkan nama, lalu jawab soal pilihan ganda yang muncul.
   - Setiap level berfokus pada satu tabel perkalian (Level 1 = ×1 ... Level 10 = ×10).
   - Setiap soal punya waktu 10 detik.
   - Jawaban benar +10 poin, ditambah bonus +5 jika dijawab cepat.
   - Nyawa (❤️❤️❤️) berkurang setiap kali salah atau waktu habis.
   - Jika nyawa habis → Game Over. Jika berhasil menyelesaikan Level 10 → Menang!
3. **Skor Tertinggi** — papan skor 10 besar tersimpan otomatis di browser (localStorage).
4. **Pengaturan** — atur musik, efek suara, mode gelap, atau reset skor.

## 🏅 Sistem Badge

| Skor Minimum | Badge |
|---|---|
| 0   | 🌱 Pemula |
| 100 | 🥉 Bronze |
| 250 | 🥈 Silver |
| 500 | 🥇 Gold |
| 700 | 👑 Master Perkalian |

## 🛠️ Teknologi

- **HTML5** — struktur semantik, satu halaman (SPA sederhana berbasis `show/hide` section).
- **CSS3** — custom properties (design tokens), gradient, animasi keyframe, flexbox/grid,
  media query responsif, `prefers-reduced-motion`, dan mode gelap berbasis class.
- **JavaScript ES6+** — modular berdasarkan section berkomentar, `localStorage` untuk
  data persisten (pengaturan & papan skor), Web Audio via elemen `<audio>` dengan
  penanganan error yang aman (tidak pernah menghentikan permainan).

## 📱 Responsif

Diuji pada breakpoint:
- Mobile kecil (< 380px)
- Mobile/tablet standar (≥ 600px)
- Desktop (≥ 900px)

Selamat belajar perkalian! ✖️🎉
