# DESIGN.md — InformaticQuiz "PAPAN KOMIK"

<!-- impeccable:design-schema 1 -->

Dunia visual untuk InformaticQuiz, ditetapkan 2026-09 melalui alur impeccable `new-work`
(direction roll `concept-seed --scope direction --mode operate`, seed key `c7118bda`,
candidate #6 "komik panel" dipilih pengguna, ditingkatkan dengan donasi tiga challenger:
split-flap → papan peringkat live; industrial quote grammar → label plate + hazard stripe;
Game Boy 4-warna → state via inversi blok).

## World

**PAPAN KOMIK** — setiap layar adalah satu panel komik: kanvas warna penuh yang tidak
berbagi dengan halaman lain, tinta hitam tebal, bayangan keras offset tanpa blur,
tipografi display monumental. Skor dan status diumumkan seperti judul bab.

**Refuses (anti-referensi):** kartu SaaS lembut, gradien dekoratif, `box-shadow` blur,
sudut membulat besar pada kontainer, default biru-ungu, emoji penuh warna, warna yang
tidak terdeklarasi di palet di bawah.

## Color Roles

| Token | Hex | Peran |
|---|---|---|
| `paper` | `#FDF6E3` | Kanvas dasar semua halaman |
| `paper-2` | `#F6EBD2` | Area sekunder, state disabled, plate label |
| `ink` | `#111111` | Border, teks, blok inversi, papan leaderboard |
| `pulse` | `#FF4D2E` | Aksi primer — satu tombol oranye per layar |
| `volt` | `#2F6BFF` | Tautan/info, header topik, chip mode |
| `sun` | `#FFD23F` | Sorotan, header band, state selected, podium #1 |
| `mint` | `#12B886` | Sukses/benar, podium #2, tombol submit/simpan |
| `blood` | `#E03131` | Error/salah, podium #3, tombol hapus |
| `ash` | `#6B6257` | Teks redup pada paper |
| `cloud` | `#FFFFFF` | Permukaan panel |

Strategi warna: **Full palette (3–4 peran named)** dengan ground paper terang. Warna
mengunci seluruh blok (panel judul, header band, kartu mode) — bukan aksen tersebar.

## Type

- **Display:** Archivo Black (`@fontsource/archivo-black`) — uppercase, `tracking-tight`,
  `leading-[0.82]` pada judul raksasa; dipakai untuk h1/h2/h3, angka skor, label aksi.
- **UI:** Archivo (`@fontsource/archivo`) 400/500/700 — body, form, tabel.
- `font-mono` sengaja dipetakan ke Archivo (bukan monospace sungguhan) — JSON di form
  admin tetap dalam suara dunia.
- Angka tabular (`tabular-nums`) wajib di semua angka skor/rank/timer.

## Form & Material

- **Border:** `border-3` (3px) standar, `border-y-3`/`divide-y-3` untuk band; hitam `ink`.
- **Bayangan keras (0 blur):** `shadow-pop` 4px · `shadow-pop-lg` 7px · `shadow-pop-sm` 2px,
  semua offset x/y +, warna `ink`; varian berwarna (`pop-sun`, `pop-mint`, `pop-pulse`).
  Interaksi "ditekan": `translate-x-1 translate-y-1` + `shadow-pop-none`.
- **Tekstur:** halftone dot grid (`bg-dots` 12px) pada kanvas Home; hazard stripe 45°
  (`bg-hazard` ink/sun) sebagai band pemisah struktur; `bg-hazard-blood` untuk bahaya.
- **Label plate:** `.label-plate` — border ink + dua sekrup sudut (pseudo-element) —
  kicker/label di atas judul, legend fieldset, badge status.
- **State = inversi blok:** terpilih/aktif → blok jadi `ink` dengan isi `cloud` (atau
  penuh warna blok); tidak pernah hanya tint/opacity. Terkunci → diagonal stripe + ✕.
- **Podium leaderboard:** #1 sun, #2 perak `#E8E4DA`, #3 perunggu `#C98A4B`, di atas
  papan `ink`; baris genap `bg-ink/60`.

## Components

- `.panel` — kontainer dasar: `border-3 border-ink bg-cloud shadow-pop`.
- `.btn-ink` — tombol dunia: border-3, font-display uppercase, shadow-pop, aktif =
  tekan-ke-dalam; disabled = `bg-paper-2 text-ash`; `:focus-visible` = `shadow-pop-sun`.
- `.input-ink` — input: border-3, focus = `shadow-pop-sun`; placeholder `ash`.
- `.tag-ink`, `HazardBand`, `Notice` (error=blod/info=volt/success=mint), `LoadingPanel`
  (blok blink `pulse`) di `client/src/components/ui.tsx`.
- Kartu soal QuizPlay: header band `sun` (label tipe + poin) di atas panel putih.

## Motion

`animate-panel-in` (muncul dari kiri-bawah), `animate-stamp-in` (cap verdict miring),
`animate-flip`, `animate-blink` (blok loading), `animate-row-in`. Semua ≤420ms,
cubic-bezier tegas; tidak ada float/parallax lembut.

## Page Roles

- **Siswa** (Home, Topics, Challenge, Campaign, QuizPlay, Result, Leaderboard):
  ekspresi penuh — panel judul warna, hazard band, podium, stamp verdict.
- **Guru** (Admin*): dunia sama, redam — header band `ink` + label plate, tanpa hazard
  di dalam form; `sun` untuk band daftar. Form kerja di `.panel` putih.
- Aksi primer per layar selalu **satu** tombol `pulse`; mint untuk submit/konfirmasi.

## Accessibility Floor

- Kontras teks kecil ≥4.5:1 — perunggu podium pakai `ink` penuh (bukan opacity).
- `role="timer"`, `role="progressbar"`, `role="alert"`, `aria-pressed`/`aria-checked`
  pada kontrol pilihan, `aria-label` pada tombol ikon (hapus pasangan ✕).
- Fokus keyboard terlihat dalam gramatika dunia (`shadow-pop-sun`), bukan ring bawaan.

## Copy Voice

Bahasa Indonesia, tegas dan ramah remaja; aksi imperatif ("Mulai", "Kerjakan"),
kesalahan menyebut masalah + jalan pulang ("Coba lagi ya."). Judul display uppercase;
body sentence-case. Tidak ada jargon teknis di jalur siswa.
