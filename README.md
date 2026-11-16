# SA-MP SD Phone — Repaired v12

## Isi
- `index.html` — antarmuka smartphone dan halaman aplikasi.
- `style.css` — styling, layout responsif, ikon, dan animasi.
- `assets/icons/` — ikon aplikasi SVG lokal.

## Menjalankan
Ekstrak ZIP, lalu buka `index.html` dengan browser modern. Tidak memerlukan proses build.

## Menjalankan dalam SA-MP dengan samp-cef
UI ini menyediakan adapter untuk API `cef.emit` / `cef.on` dari plugin `samp-cef` (zottce), serta contoh filterscript Pawn di `filterscripts/sdphone.pwn`.

1. Pasang client/server plugin `samp-cef` dan include `<cef>` sesuai dokumentasi plugin.
2. Salin folder UI ini ke `<folder GTA>/cef/assets/sdphone/`, sehingga file berada di `cef/assets/sdphone/index.html`, `cef/assets/sdphone/style.css`, dan seterusnya.
3. Compile `filterscripts/sdphone.pwn`, masukkan `sdphone` ke daftar filterscript server, lalu restart.
4. Di dalam game, gunakan `/phone` untuk membuka dan `/phoneclose` untuk menutup UI.

Adapter mengirim event browser sebagai satu event `__sdphone_bridge`; payload JSON di-encode agar spasi tidak memecah argumen yang diterima Pawn. Balasan dari Pawn harus dikirim melalui event yang sama. Contoh filterscript mengirim identitas pemain SA-MP dan mencatat nama event lain tanpa mencatat isi payload/kredensial.

Untuk event server→browser selain identitas, gunakan `SDPhoneEmitJson(playerid, "sdphone:call:incoming", "%7B%22number%22%3A%22555-0100%22%7D")` dari filterscript tersebut. Argumen terakhir harus berupa hasil `encodeURIComponent(JSON.stringify(data))` agar cocok dengan adapter.

Filterscript ini hanya menyiapkan tampilan, pembukaan browser, dan transport dasar. Panggilan, SMS, transaksi bank, autentikasi sosial, serta sinkronisasi data tetap memerlukan handler gamemode/backend. Payload browser dibatasi sekitar 4 KB; foto/lampiran besar harus diunggah lewat layanan terpisah, bukan dikirim langsung melalui event CEF. Bila gamemode sudah memakai `/phone`, ganti nama command pada filterscript.

## Perbaikan v4
- Navigasi halaman aplikasi mendukung swipe kiri/kanan dengan touch maupun pointer/mouse, serta tombol indikator halaman.
- Gesture horizontal tidak lagi memicu klik ikon aplikasi secara tidak sengaja.
- Menu Settings dirapikan dengan ikon seragam.
- Wallpaper dapat diganti dengan preset atau gambar dari perangkat, dan disimpan lokal di browser. Gambar kustom dibatasi 3 MB.
- Semua layar aplikasi memakai tampilan terang bergaya iOS dengan aksen warna, header, kartu, dan tipografi yang lebih konsisten.
- Instagram, WhatsApp, X, dan YouTube menggunakan login akun pemain melalui bridge CEF; lihat catatan integrasi.
- Widget jaringan dan tombol demo notifikasi/panggilan pada Home telah dihapus.
- Perbaikan interaksi notifikasi agar jenis notifikasi tetap terbaca sebelum banner ditutup.
- Home screen kini mengikuti komposisi referensi: wallpaper biru abstrak, widget cuaca biru dan kalender putih, grid empat kolom, Search pill, serta dock.
- Lock screen memakai komposisi coral, jam besar transparan, tanggal singkat, tombol senter/kamera, dan dapat dibuka dengan tap atau swipe ke atas.
- Aplikasi hanya kembali ke Home melalui garis Home di bawah; tombol tutup, tombol Home perangkat, dan navigasi Escape/Backspace untuk menutup aplikasi dihilangkan.
- HUD volume memakai indikator vertikal bergaya iOS, dan notifikasi Dynamic Island menampilkan banner animasi yang dapat diketuk.
- Tipografi dan kartu aplikasi dirapikan; WhatsApp mendapat daftar chat yang lebih jelas dan tab bar bergaya iPhone.
- Semua halaman aplikasi dan alur chat diperiksa di browser; tidak ditemukan luapan horizontal pada layar aplikasi.

## Catatan integrasi
Proyek ini menyediakan UI HTML/CSS/JavaScript dan contoh filterscript SA-MP untuk `samp-cef`. Proyek ini tidak menyertakan gamemode atau backend sosial, sehingga autentikasi pemain dan sinkronisasi multi-player perlu ditangani oleh server melalui bridge CEF.

## Profil sosial dan WhatsApp demo
- Instagram, WhatsApp, X, dan YouTube menampilkan halaman login/daftar dengan identitas visual masing-masing. Pemain memasukkan username dan password akun aplikasi; akun aplikasi ditautkan server ke sesi pemain SA-MP yang aktif. Password game SA-MP tidak diminta atau dikirim.
- Status login hanya disimpan di memori UI dan diminta ulang dari server ketika aplikasi dibuka. UI tidak menganggap akun lokal sebagai autentikasi.
- Identitas pemain dapat dikirim melalui event `sdphone:player:identity` dengan `playerId`, `accountName`, `displayName`, dan `authenticated`. UI juga mengirim `sdphone:player:identity:request`.
- Saat status akun, login, pendaftaran, atau logout diperlukan, UI mengirim event CEF `sdphone:social:auth:request` dengan payload seperti:

  ```json
  {"platform":"instagram","action":"login","requestId":"social-...","username":"player_name","password":"<password akun aplikasi>"}
  ```

  `status` dan `logout` tidak membawa kredensial. Nilai `action` lainnya: `login`, `register`. Pendaftaran mensyaratkan password akun aplikasi minimal 8 karakter; UI mengosongkan field password setelah pengiriman dan tidak menyimpan kredensial di local storage.
- Backend perlu membalas melalui `sdphone:social:auth:result` dengan `requestId`, `platform`, `action`, `authenticated`, `success`, `playerId`, `profile` (`displayName`, `username`), dan opsional `message`. Server harus mengambil identitas pemain dari sesi SA-MP yang tepercaya, memvalidasi setiap aksi, dan mengirim hasil hanya ke CEF pemain tersebut.
- Backend wajib memvalidasi bahwa username/password milik akun aplikasi, menautkan akun ke pemain dari sesi tepercaya (bukan `playerId` kiriman klien), menerapkan rate limit, tidak mencatat password, dan menyimpan password dengan password hash yang aman. Jangan pernah menganggap password akun aplikasi sebagai password login game.
- Tanpa handler server, layar login tetap tampil dan menjelaskan bahwa bridge/backend belum merespons. Tidak ada bypass demo yang menganggap login berhasil.
- Chat, feed, pencarian, posting, dan interaksi lain tetap berupa simulasi lokal sampai handler backend masing-masing ditambahkan; proyek ini belum memiliki data store atau layanan sosial server.


## Lifecycle and Home-indicator behavior
- Mengetuk garis Home mengembalikan ponsel ke Home dan membersihkan media serta UI sementara.
- Escape hanya menutup overlay landscape; aplikasi tetap terbuka sampai garis Home diketuk.
- Notifikasi Dynamic Island tetap terlihat selama durasi notifikasi dan dibersihkan saat Home diketuk atau aplikasi ditutup.
- Leaving apps, powering off, and page teardown stop audio/video and clear the YouTube iframe.
- Dynamic notifications, landscape overlays, volume indicators, and temporary file selections are cleared.
- Saved wallpaper preferences are preserved when closing an app.

## Pembaruan v5
- Halaman aplikasi membentang di seluruh area layar ponsel, dengan status bar dan garis Home tetap di atasnya.
- Lock screen memakai sumber wallpaper yang sama dengan Home; preset dan gambar pilihan ikut diterapkan pada kedua layar.
- Tipografi menggunakan Outfit dengan pilihan Outfit, DM Sans, atau font sistem di Settings.
- Notifikasi Dynamic Island dapat diaktifkan atau dinonaktifkan dari Settings.
- Pencarian Home, dialer, inbox/pesan lokal, pencarian kontak, transaksi bank demo, pratinjau foto, lokasi, tab WhatsApp, dan tab feed X kini memiliki interaksi.
- Tombol YouTube tetap dapat mencari melalui situs YouTube tanpa API key; pencarian tertanam lewat API memerlukan key.
- Bank, panggilan, pesan, foto, dan chat tetap simulasi lokal jika bridge/backend tidak disediakan.
- Jika CEF menyediakan `window.cef.emit`, UI mengirim event `sdphone:call:start`, `sdphone:call:end`, `sdphone:sms:send`, `sdphone:bank:transaction`, `sdphone:camera:photo`, `sdphone:whatsapp:send`, dan `sdphone:whatsapp:attachment`. Server harus menangani event tersebut untuk operasi game yang nyata; gamemode/backend tidak termasuk dalam repository ini.

## Pembaruan v6
- Area aplikasi disejajarkan ke seluruh layar dan tidak lagi bergeser saat input mendapat fokus.
- Layar telepon menampilkan status panggilan keluar, panggilan masuk, jawab/tolak, bisu, speaker, keypad DTMF, dan akhiri panggilan seperti referensi.
- Instagram dan X dirapikan dengan header, feed, pencarian, serta navigasi bawah yang dapat digunakan.
- Login sosial menggantikan formulir profil lokal; server menentukan akun dan profil yang terhubung ke pemain SA-MP.
- CEF dapat mengirim `sdphone:call:incoming` dengan `number` dan opsional `name`/`displayName`. UI mengirim `sdphone:call:answer` dan `sdphone:call:dtmf`; penolakan/akhiri panggilan memakai `sdphone:call:end` dengan alasan.

## Pembaruan v7
- Layar Phone dirapikan agar dialer dan layar panggilan tidak tertutup garis Home; layar panggilan masuk dan aktif menampilkan avatar kontak, status, timer, dan kontrol yang lebih jelas.
- Tombol simulasi panggilan masuk dan status jaringan demo yang menampilkan sinyal “Excellent” di Settings dihapus. Panggilan masuk tetap tersedia melalui event CEF `sdphone:call:incoming`.
- Halaman Settings diperbarui dengan kartu profil pemain dan kelompok pengaturan yang lebih rapi. Tema, notifikasi, dan font tersimpan di browser.
- Feed YouTube mendapat bilah pencarian, kategori, rekomendasi, navigasi, dan tampilan pemutar yang lebih menyerupai aplikasi ponsel. Tanpa YouTube Data API key, pencarian memfilter rekomendasi lokal dan menyediakan tautan hasil YouTube; pencarian tertanam dan pemutaran video memerlukan API key.
- Tombol tautan ↗ pada header YouTube dihapus. Interaksi konten sosial tetap berupa demo lokal sampai bridge/backend CEF tersedia.

## Pembaruan v8
- Instagram, WhatsApp, X, dan YouTube sekarang meminta status login SA-MP saat dibuka; login/daftar/logout dikirim ke bridge CEF, tanpa menyimpan kredensial atau membuat login lokal.
- Ikon dock dan navigasi bawah memakai SVG yang lebih jelas. Bar Home berwarna abu-abu, dan konten sosial dirapatkan agar tidak terlalu membesar pada layar pendek.
- Dialog input dalam aplikasi menggantikan JavaScript `prompt()` untuk membuat pesan/kontak dan mengatur status WhatsApp, sehingga tetap bisa dipakai di CEF tanpa dialog browser.

## Pembaruan v9
- Home memakai wallpaper aurora gelap dan widget kaca transparan, dengan dock dan ikon aplikasi yang memiliki bentuk, sorotan, dan bayangan lebih konsisten.
- Tipografi default memakai Plus Jakarta Sans, dengan Space Grotesk sebagai pilihan font display dan pilihan tambahan di Settings.
- Status bar, Dynamic Island, dan notifikasi diberi lapisan kaca/kontras yang lebih halus; perpindahan antar aplikasi mendapat transisi blur dan gerak singkat.
- Tetap menghormati pengaturan wallpaper kustom dan preferensi reduced motion sistem.

## Pembaruan v10
- Halaman login Instagram, WhatsApp, X, dan YouTube memiliki warna, brand, deskripsi, dan aksen tombol masing-masing.
- Form login/daftar meminta username dan password akun aplikasi. Password pendaftaran minimal 8 karakter, tidak disimpan lokal, dan langsung dihapus dari field setelah permintaan dikirim.
- Login, daftar, keluar, dan pengelolaan akun tetap terhubung ke bridge CEF; aplikasi bawaan SA-MP dan event game lainnya tidak diubah.
- Efek fokus, hover, tekan, status sibuk, serta layout form responsif ditambahkan untuk layar desktop dan Android.

## Pembaruan v11
- Kartu informasi “Akun game aktif” di halaman login sosial dihapus agar layar login lebih ringkas.
- Latar halaman di luar perangkat dibuat transparan, dan elemen promosi/intro disembunyikan agar tidak menutupi tampilan GTA saat dipakai sebagai overlay CEF.
- Ukuran perangkat diperkecil dan disesuaikan dengan viewport desktop maupun Android; animasi buka/tutup aplikasi dan efek tekan tombol diperhalus.
- Untuk menampilkan game di balik halaman, integrasi CEF juga perlu mengaktifkan komposisi/transparansi alpha pada browser surface. CSS transparan saja tidak dapat mengaktifkan alpha pada layer CEF yang dirender opak.

## Pembaruan v12
- Aplikasi memenuhi layar ponsel, sementara perangkat mempertahankan rasio potret, bezel membulat, dan tombol sisi bergaya iPhone.
- Pada viewport lebar, ponsel menggunakan tinggi yang tersedia dan area di luarnya tetap transparan untuk game.
- Bar status disembunyikan untuk memberi ruang layar penuh; Dynamic Island tetap terlihat dan HUD volume muncul di sisi atas tanpa menutupi konten.

## Integrasi Crystal Pride social feed
Gamemode Crystal Pride saat ini memuat `https://fountain-daily-roleplay.github.io/EternalStatePhone/`; menyalin ZIP ke folder GTA saja tidak mengubah halaman live tersebut. Untuk memakai file lokal, unggah folder Phone ke direktori client `cef/assets/sdphone/` dan ubah `CEF_PHONE_URL` di `gamemodes/Servers/CEF.pwn` ke URL/local entry yang sesuai untuk plugin CEF. Halaman dan gamemode memakai protokol `__sdphone_bridge` berpayload JSON serta event langsung untuk aksi Phone lama. ZIP ini menyertakan `database/phone_social_accounts.sql` dan `database/phone_social_feed.sql`; impor keduanya ke database MariaDB yang sama dengan server gamemode (accounts lebih dahulu). Akun Instagram, WhatsApp, X, dan YouTube di sini adalah akun roleplay internal yang ditautkan ke UCP SA-MP—bukan OAuth/login sungguhan ke platform tersebut. Password khusus akun roleplay di-hash di server dan bukan password game atau password akun pihak ketiga. Feed database mencakup post Instagram/X, berbagi video YouTube ke feed, feed per platform, dan like. Operasi feed memerlukan akun roleplay yang berhasil login pada sesi pemain SA-MP.

## EternalStatePhone deployment
Gamemode browser URL: https://fountain-daily-roleplay.github.io/EternalStatePhone/. The Crystal Pride source uses this URL in gamemodes/Servers/CEF.pwn; the compiled server gamemode is gamemodes/Crystal.amx. Local UI edits in this package do not automatically publish to GitHub Pages; publish them to the EternalStatePhone repository for the live URL to serve the same CSS and HTML.
