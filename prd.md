Koreksi dan penambahan yang sangat tepat. Menambahkan gambar referensi di halaman input akan meminimalisir kesalahan operator, dan fitur *share* berupa gambar (JPG) ke WhatsApp adalah langkah yang sangat praktis untuk pelaporan harian di lapangan.

Berikut adalah versi pembaruan dari **Product Requirements Document (PRD)** yang telah mengintegrasikan semua permintaan Anda beserta saran-saran pengembangan sebelumnya.

---

# 📄 Product Requirements Document (PRD): Aplikasi Laporan Cutting Scrap V2

## 1. Tujuan Produk

Membangun aplikasi web responsif untuk pencatatan, pemantauan, dan pelaporan hasil *cutting scrap*. Aplikasi ini akan mengotomatisasi konversi satuan kerja, mengukur kecepatan Manpower (MP), mengakomodasi perhitungan waktu kompleks (waktu istirahat & lintas hari), serta mempermudah distribusi laporan via WhatsApp.

## 2. Antarmuka Pengguna (UI/UX)

* **Responsivitas (Mobile & Desktop):** Antarmuka harus *Mobile-First*, mengingat operator kemungkinan besar menggunakan *smartphone* atau *tablet* di area pabrik. Elemen seperti tombol, *form*, dan *date/time picker* harus berukuran ramah jari (*touch-friendly*). Di layar desktop, tampilan menyesuaikan untuk memberikan ruang ekstra pada dasbor dan tabel.

## 3. Kebutuhan Fitur Utama (Core Features)

### A. Halaman Input (Data Entry)

Halaman formulir bagi operator untuk memasukkan data hasil kerja.

* **Visual Aid (Gambar Referensi):** Menampilkan gambar referensi Type A dan Type B di bagian atas atau di samping form *input* agar operator selalu ingat ketentuan bentuk dan berat masing-masing tipe.
* **Form Field:**
* **Nama MP:** Menggunakan **Sistem Dropdown/Searchable List** dari *database* karyawan untuk menghindari salah ketik (*typo*).
* **Shift:** Pilihan tombol (*Radio button* / *Toggle*) `Red` atau `White`.
* **Time:** Pilihan tombol `Day` atau `Night`.
* **Tanggal:** *Date picker*.
* **Waktu Kerja:** `Jam Mulai` dan `Jam Selesai` (*Time picker*).
* **Input Hasil:** * Type A (Input angka dalam satuan 'lembar').
* Type B (Input angka dalam satuan 'lembar').




* **Auto-Calculate (Real-time):**
* Menghitung otomatis saat input dimasukkan:
* **Berat Type A:** Total lembar Type A × **3.5 kg**.
* **Berat Type B:** Total lembar Type B × **2.6 kg**.
* **Total Keseluruhan:** (Total lembar A + B) dan (Total Berat A + Berat B dalam kg).


* **Visualisasi Output:** Rincian instan, contoh: *"Type A 154 lbr = 539 kg | Type B 0 lbr = 0 kg | Total = 154 lbr / 539 kg"*.



### B. Dashboard (Ringkasan & Analitik)

Halaman beranda untuk memantau metrik operasional secara keseluruhan (ideal untuk Supervisor/Admin).

* **Total Akumulasi:** Menampilkan metrik total hasil *cutting* (kg) secara global per hari/minggu.
* **Hasil per MP:** Rincian kontribusi total (kg) dari masing-masing MP.
* **Grafik Produksi:** Visualisasi *Bar/Line Chart* untuk tren produksi.
* **Top Performance:** Papan peringkat (Leaderboard) MP dengan total hasil tertinggi dan kecepatan *cutting* terbaik.

### C. Halaman Performance & Export Share

Halaman analitik personal dan pelaporan instan.

* **Tabel Performa Individu:** Menampilkan data kerja spesifik dari masing-masing MP.
* **Kalkulasi Kecepatan Cutting (Lembar/Menit):**
* Dihitung otomatis dari total lembar dibagi durasi efektif kerja.


* **Fitur Generate & Share Laporan (JPG):**
* Aplikasi dapat membungkus ringkasan hasil kerja shift tersebut ke dalam sebuah visual kartu digital (berisi: Nama MP, Tanggal, Shift, Jam Kerja, Total Lembar, Total Kg, dan Kecepatan).
* Tombol **"Share to WhatsApp"** atau **"Download JPG"** yang mengonversi tampilan HTML tersebut menjadi gambar JPG/PNG resolusi tinggi untuk langsung dikirim ke grup kerja.



### D. Halaman Riwayat Cutting (History)

Pusat *database* log harian.

* **Tabel Utama:** Berisi histori lengkap (Nama, Tanggal, Shift, Jam, Hasil Lembar, Hasil Kg, Kecepatan).
* **Filter & Pencarian:** Pilihan filter berdasarkan Tanggal, Shift, atau Nama MP.
* **Export Data:** Tombol **"Export to Excel/CSV"** untuk kebutuhan rekapitulasi data bulanan oleh manajemen atau tim admin.

## 4. Logika Sistem & Aturan Bisnis (Business Rules)

* **Pengecualian Waktu Istirahat (Break Time Deduction):** * Jika rentang jam kerja memotong pukul **11:00 - 13:00** (Day) atau **23:00 - 01:00** (Night), sistem otomatis mengurangi durasi kerja sebanyak 120 menit (2 jam) sebelum membaginya untuk mencari metrik kecepatan.
* **Validasi Lintas Hari (Cross-Day Validation):** * Untuk *Night Shift* yang dimulai sebelum tengah malam dan berakhir di pagi hari (misal: Tanggal 12 Jam 20:00 hingga Tanggal 13 Jam 05:00), sistem kalender otomatis mengenali penambahan hari agar perhitungan menit dan pengurang jam 23:00-01:00 berjalan tanpa *error* matematika (hasil minus).
* **Hak Akses (Role-Based Access Control):**
* **Operator:** Hanya dapat mengakses halaman Input, melihat Performance pribadinya, dan Riwayat *shift*-nya sendiri.
* **Supervisor/Admin:** Mengakses Dashboard penuh, menambah/menghapus daftar nama MP di *dropdown*, dan Export Excel semua Riwayat.



---

## 💻 Rekomendasi Tech Stack

Mengingat aplikasi ini membutuhkan kalkulasi *real-time*, antarmuka yang sangat responsif, dan konversi ke gambar JPG/Excel, berikut adalah komposisi teknologi yang paling efisien:

**1. Frontend (Antarmuka & Logika UI)**

* **Framework:** **Next.js** atau **React.js**. Keduanya sangat kuat untuk membangun aplikasi web yang responsif (SPA) dan perhitungan *real-time* di sisi klien tanpa perlu me-*refresh* halaman.
* **Styling:** **Tailwind CSS**. Memudahkan pembuatan UI yang sangat responsif, rapi, dan cepat disesuaikan baik untuk layar HP maupun desktop.
* **Library Tambahan:**
* `html2canvas`: Untuk "memotret" area laporan di halaman Performance dan mengubahnya menjadi file gambar (JPG/PNG) untuk di-*share* ke WhatsApp.
* `date-fns` atau `Day.js`: Paling krusial untuk menangani logika rumit terkait selisih jam lintas hari (*cross-day*) dan pengurangan waktu istirahat secara akurat.
* `Chart.js` atau `Recharts`: Untuk membuat grafik interaktif di Dashboard.



**2. Backend & Database (BaaS - Backend as a Service)**

* **Pilihan Terbaik:** **Supabase** (berbasis PostgreSQL) atau **Firebase**.
* *Alasan:* Anda tidak perlu membangun *server backend* dari nol. Layanan ini sudah menyediakan Database, Sistem Autentikasi (untuk login Operator/Admin), dan API siap pakai. Supabase sangat disarankan karena menggunakan relasi tabel (SQL) yang sangat cocok untuk data laporan (Tabel MP, Tabel Riwayat, Tabel Performa).

**3. Hosting & Deployment**

* **Vercel** atau **Netlify**: Untuk *hosting* frontend secara gratis atau dengan biaya sangat rendah. Keduanya terintegrasi sempurna dengan Next.js/React.