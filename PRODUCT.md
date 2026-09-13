# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Siswa SMP (Sekolah Menengah Pertama) kelas 7, 8, dan 9 di Indonesia — usia sekitar 12–15 tahun. Mereka membuka aplikasi di komputer sekolah/lab atau laptop pribadi, memasukkan nama + kelas tanpa membuat akun, lalu langsung mengerjakan kuis. Audiens kedua: guru (admin) yang login dengan username/password dan mengelola topik & soal lewat dashboard.

## Product Purpose

Platform kuis Informatika bergaya game: siswa belajar materi Informatika lewat kuis interaktif dalam 3 mode permainan (Topik, Tantangan/Challenge, Campaign), dan setiap skor yang diselesaikan langsung tersimpan ke database lewat server-side scoring. Leaderboard menampilkan peringkat siswa. Guru mengelola konten soal tanpa perlu akses database.

## Positioning

Nilai masuk database otomatis saat kuis selesai — tanpa akun siswa, tanpa input manual guru. Guru hanya perlu sekali membuat soal; siswa cukup nama + kelas untuk bermain dan tercatat.

## Operating Context

- Dipakai di sekolah (lab komputer / proyektor kelas) dan perangkat pribadi siswa; sesi belajar singkat (10–20 menit).
- Satu sekolah per deployment; SQLite single-file cukup untuk skala ini.
- Kuis dikerjakan individual; leaderboard diproyeksikan/dilihat bersama di kelas.

## Capabilities and Constraints

- 4 jenis soal: pilihan ganda (pg), true/false (tf), matching, ordering (drag-and-drop @dnd-kit).
- Mode `topic`: semua soal satu topik, tanpa timer. Mode `challenge`: soal acak lintas topik dengan timer countdown + auto-submit. Mode `campaign`: level 1–3 per topik (easy→medium→hard), progress unlock via LocalStorage per perangkat, lulus di ≥70%.
- Scoring biner di server (benar = poin penuh); kunci jawaban tidak pernah dikirim ke client sebelum submit; submit idempotent (409 jika sudah selesai).
- Siswa tanpa akun; identitas per sesi = nama + kelas. Guru: JWT auth, registrasi butuh kode (`REGISTRATION_KEY`).
- 12 halaman: Home, Topics, Challenge, Campaign, CampaignLevel, QuizPlay, Result, Leaderboard, AdminLogin, AdminRegister, AdminTopics, AdminQuestions.
- Constraint lintas redesign: pertahankan seluruh perilaku fungsional, route, state management, dan label aksi kunci yang dipakai test (mis. "Berikutnya", "Selesai & Submit", nama topik seed).

## Brand Commitments

- Nama produk: **InformaticQuiz**.
- Seluruh copy antarmuka dalam **Bahasa Indonesia** (dikonfirmasi pengguna).
- Arah visual dunia baru: **neo-brutalis playful** (dikonfirmasi pengguna) — border tebal, bayangan keras, warna jenuh, tipografi besar; energik untuk remaja, tidak kekanak-kanakan.

## Evidence on Hand

- Seed data nyata: 3 topik ("Algoritma & Pemrograman" kelas 7, "Jaringan Komputer & Internet" kelas 8, "Kewirausahaan Digital" kelas 9), 6 soal (pg/tf/matching/ordering), 1 guru demo (`guru`/`guru123`).
- Akun demo & kode registrasi default terdokumentasi di README.
- Tidak ada logo, foto, testimoni, atau aset brand lain — jangan mengarang klaim komersial; data ilustrasi boleh dibuat asal jujur konteksnya.

## Product Principles

1. **Bermain dulu, administrasi nol** — siswa berlatih dalam hitungan detik dari membuka halaman; tidak ada form, akun, atau verifikasi yang menghalangi.
2. **Juara terlihat** — skor, streak, dan peringkat dirayakan secara visual; leaderboard adalah panggung, bukan tabel.
3. **Guru efisien** — CRUD konten sederhana, jelas, tanpa jargon teknis di jalur guru.
4. **Jujur pada hasil** — skor dari server, feedback datang di akhir; UI tidak menggurui atau menipu soal benar/salah.
