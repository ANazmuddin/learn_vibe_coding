# Lanjutan Issue #6: Paginasi, Filter Pencarian, Keamanan Tambahan, dan Inisiasi Testing

## Latar Belakang
Pada Issue sebelumnya (#6), sistem telah memiliki fondasi autentikasi (Auth Middleware & Logout) beserta entitas *core* manajemen data CRUD untuk `Tasks` atau `Todos`. Namun, fungsionalitas saat ini masih mendasar. Misalnya, endpoint pembacaan data belum dibatasi (mengembalikan semua data) dan belum ada mekanisme pengujian otomatis untuk menjaga kestabilan aplikasi saat ada perubahan fitur di masa depan.

Pada issue lanjutan ini, target utama adalah untuk meningkatkan fungsionalitas pembacaan data (skalabilitas akses melalui paginasi & filter), meningkatkan sedikit lapisan keamanan API, dan mengawali pembuatan *automated tests* sederhana.

## Objektif (High Level)

### A. Implementasi Paginasi dan Filter/Search (Tasks)
- **Modifikasi Rute Pembacaan:** Perbarui rute `GET /api/tasks` agar dapat menerima *query parameters*.
- **List Fitur Paginasi:** API harus mengenali parameter pembatasan data seperti `page` (halaman ke-berapa) dan `limit` (jumlah data per halaman).
- **Search & Filter:** Dukung kemampuan untuk mem-filter task berdasarkan status penyelesaian (misal parameter `isCompleted`) dan kemampuan pencarian berbasis teks yang mencocokkan kata dengan judul task (misal `search`).
- **Format Meta:** Response JSON tidak hanya berisi objek array data, namun juga mencakup metadata seperti jumlah total baris/data, halaman saat ini, dan total halaman agar *client-side* lebih mudah merender paginasi UI.

### B. Standardisasi Error Handling & Keamanan Dasar
- **Global Error Handler:** Susun mekanisme tangkapan *error* terpusat (menggunakan fitur bawaan ElysiaJS). Tujuannya adalah memastikan setiap respon kertergangguan sistem (contoh status HTTP 400 Bad Request, 500 Internal Server Error) atau *validation error* selalu mempunyai struktur JSON yang terprediksi dan rapi, tanpa membocorkan rincian sensitif aplikasi.
- **CORS & Rate Limiting:** Implementasikan/pasang plugin *Cross-Origin Resource Sharing* (CORS) agar aplikasi ini siap apabila suatu saat di-konsumsi (hit) oleh platform Front-End yang berada di beda *domain/port*, dan berikan batasan *Rate Limiting* di tingkat aplikasi guna mencegah *spam* request atau serangan bruteforce sederhana terutama pada rute autentikasi.

### C. Inisiasi Automated Testing (Testing Dasar)
- **Setup Testing:** Manfaatkan r<i>unner</i> pengujian bawaan Bun, yaitu `bun:test`. Tidak perlu menginstall library external seperti Jest.
- **Skenario Happy Path:** Buat kerangka implementasi pengujian *End-to-End* / *Integration Test* minimal yang meliputi:
  1. Proses Register pengguna baru dan langsung Login.
  2. Pengambilan token (session) lalu menguji middleware dengan membuat (Create) sebuah data Task.
  3. Memastikan Task yang dibuat sebelumnya berhasil diambil balik (Read) sesuai kepemilikan.
- Implementasi *testing* ini sangat krusial sebagai fondasi awal; tak perlukan me-cover *edge case* rumit pada langkah ini, cukup pastikan fungsionalitas inti API beroperasi tanpa masalah sembari memastikan arsitektur pengujian bisa dijalankan lewat `bun test`.

## Panduan untuk Implementator (Programmer/AI)
- **Fokus Ke *Value*:** Terapkan pemfilteran secara efisien di sisi Drizzle (memanfaatkan query sebatas limit dan offset SQL, serta Like/Ilike query) tanpa perlu menarik seluruh memori ke aplikasi *Node/Bun*.
- **Kebebasan Styling/Struktur:** Tidak ada struktur folder spesifik yang dipaksakan untuk file pengujian. Silakan kelompokkan *tests* ke dalam folder pendamping secara konvensional.
- Gunakan alat *Validation/Type Safety* bawaan ElysiaJS (`t.*`) untuk memvalidasi limit, types dari parameters `query` untuk pencarian dan filter dengan aman tanpa celah.
