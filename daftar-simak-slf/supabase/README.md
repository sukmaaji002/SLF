# Login dan draf online SLF

Website tetap di Cloudflare Pages. Supabase menyediakan autentikasi, tabel draf, dan bucket foto privat. Saat pengaturan Supabase kosong, editor lokal dan fitur cadangan tetap tersedia.

## Aktivasi

1. Di Supabase, buka **SQL Editor** dan jalankan seluruh isi `001-drafts.sql` pada proyek yang akan dipakai SLF.
2. Pada **Authentication → URL Configuration**, atur **Site URL** ke `https://slf-1g9.pages.dev` dan tambahkan `https://slf-1g9.pages.dev/` sebagai redirect URL. Jika menguji di komputer lokal, tambahkan URL lokal pengujian secara terpisah.
3. Aktifkan penyedia **Email** dan pertahankan **Confirm email**. Siapkan **Custom SMTP** untuk pendaftaran dan pemulihan kata sandi pelanggan. Email bawaan Supabase hanya melayani alamat anggota tim proyek.
4. Di `../dist/cloud-config.js`, isi Project URL dan Publishable key `sb_publishable_…`. Kedua nilai ini ditujukan untuk kode browser. Simpan password, kunci rahasia, dan kunci service role di dashboard masing-masing.
5. Push ke `main` dan cek bahwa Cloudflare Pages berhasil deploy. Coba daftar, konfirmasi email dari browser tempat pendaftaran, lalu gunakan akun yang sama pada browser kedua. Uji memakai dua akun yang berbeda untuk memastikan daftar draf terpisah.

Rujukan: [URL redirect](https://supabase.com/docs/guides/auth/redirect-urls), [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [kuota Free](https://supabase.com/pricing).

## Pemakaian

- Masuk, buka draf, lalu edit isian atau unggah foto. Tunggu status **Draf tersinkron** sebelum pindah perangkat. Tombol **Sinkronkan** juga bisa dipakai setelah koneksi pulih.
- Untuk memindahkan draf lama, unduh cadangan dari mode lokal, masuk, dan impor cadangan sebagai draf akun. Guest dan tiap akun punya cache lokal yang berbeda.
- Jika perangkat lain sudah menyimpan versi baru, **Simpan salinan perubahan** menyimpan edit perangkat ini sebagai draf terpisah.
- Foto ditransfer sebagai file privat dan hanya diunduh saat draf terkait dibuka. Foto yang dikeluarkan dari draf berhenti tampil di laporan. Berkas foto lama tetap berada di bucket privat hingga admin membersihkan objek tak terpakai. Hindari menghapus objek yang masih dirujuk oleh `payload.media`.
- Cadangan proyek mencakup foto. Gunakan cadangan berkala selama memakai paket gratis.

SDK browser: @supabase/supabase-js 2.119.2, bundel UMD resmi dari npm dan lisensi MIT.


