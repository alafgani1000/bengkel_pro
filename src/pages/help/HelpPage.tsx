import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, CreditCard, Package, BarChart3, 
  AlertTriangle, BookOpen, Clock, Printer, Moon
} from 'lucide-react';

export function HelpPage() {
  return (
    <div className="flex flex-col h-full space-y-4 max-w-5xl pb-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panduan Penggunaan</h2>
          <p className="text-muted-foreground text-sm">Pelajari cara mengoperasikan seluruh modul sistem Bengkel Pro secara efektif.</p>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <Tabs defaultValue="spk" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-4 lg:max-w-2xl bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="spk" className="gap-2 text-xs sm:text-sm font-semibold">
            <Wrench className="w-4 h-4" /> SPK & Servis
          </TabsTrigger>
          <TabsTrigger value="kasir" className="gap-2 text-xs sm:text-sm font-semibold">
            <CreditCard className="w-4 h-4" /> Kasir & Nota
          </TabsTrigger>
          <TabsTrigger value="inventori" className="gap-2 text-xs sm:text-sm font-semibold">
            <Package className="w-4 h-4" /> Inventori
          </TabsTrigger>
          <TabsTrigger value="laporan" className="gap-2 text-xs sm:text-sm font-semibold">
            <BarChart3 className="w-4 h-4" /> Laporan & Sistem
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto mt-4">
          {/* TAB: WORK ORDER (SPK) */}
          <TabsContent value="spk" className="space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Wrench className="w-5 h-5" /> Siklus Pekerjaan & SPK
                </CardTitle>
                <CardDescription>
                  Panduan pembuatan antrean, pengerjaan mekanik, hingga penambahan sparepart.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Langkah 1 */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">1</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Membuat SPK Baru</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Klik tombol <strong className="text-foreground font-semibold">+ Buat SPK Baru</strong> di sudut kanan atas halaman Work Order. Isi Nama Pelanggan, Nomor WhatsApp, Plat Nomor Kendaraan, Merek, Tipe, dan keluhan awal. Klik simpan dan status default adalah <Badge variant="outline">Antri</Badge>.
                    </p>
                  </div>
                </div>

                {/* Langkah 2 */}
                <div className="flex gap-4 border-t pt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">2</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Memulai Pengerjaan & Update Status</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Ketika kendaraan siap diservis oleh mekanik, klik tombol <strong className="text-foreground font-semibold">→ Dikerjakan</strong> pada kartu SPK. Anda juga bisa memindahkan status secara fleksibel melalui tombol chevron (<strong className="text-foreground font-semibold">&gt;</strong>) ke status lain seperti <Badge variant="outline">Tunggu Part</Badge>.
                    </p>
                  </div>
                </div>

                {/* Langkah 3 */}
                <div className="flex gap-4 border-t pt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">3</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Menambahkan Jasa & Sparepart</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Klik pada kartu SPK untuk masuk ke halaman Detail.
                    </p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground pl-2 space-y-1.5 mt-1.5">
                      <li><strong className="text-foreground font-medium">Tambah Jasa</strong>: Masukkan nama jasa (misal: *Ganti Oli*) dan nominal harga. Kolom input harga otomatis memformat ribuan dengan titik secara real-time untuk mencegah salah ketik.</li>
                      <li><strong className="text-foreground font-medium">Tambah Sparepart</strong>: Cari sparepart dari inventori berdasarkan nama/kode, lalu klik **Pilih**. Sistem akan mengaitkan barang ke SPK dan otomatis memotong stok barang.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-lg p-3 text-xs border border-primary/10 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground leading-relaxed">
                    <strong className="text-primary font-semibold">Tips Cepat:</strong> Saat status SPK diubah menjadi <strong className="text-foreground font-medium">SELESAI</strong>, sistem otomatis membuat tagihan invoice dan mengirimkannya ke antrean Kasir.
                  </span>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: KASIR & PEMBAYARAN */}
          <TabsContent value="kasir" className="space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <CreditCard className="w-5 h-5" /> Pembayaran & Cetak Nota
                </CardTitle>
                <CardDescription>
                  Panduan mengelola antrean kasir, diskon/pajak, metode bayar, dan cetak struk termal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Langkah 1 */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">1</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Memilih Antrean Invoice</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Buka menu Kasir, pada tab <strong className="text-foreground font-semibold">Belum Lunas</strong> akan tampil daftar invoice otomatis dari SPK yang telah berstatus selesai. Pilih salah satu invoice untuk memproses pembayaran.
                    </p>
                  </div>
                </div>

                {/* Langkah 2 */}
                <div className="flex gap-4 border-t pt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">2</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Menghitung Diskon & Pajak (PPN)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Ketik nominal diskon dalam Rupiah atau isi persentase pajak (misal: `11` untuk PPN 11%). Sistem akan otomatis menghitung Grand Total pembayaran secara real-time.
                    </p>
                  </div>
                </div>

                {/* Langkah 3 */}
                <div className="flex gap-4 border-t pt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">3</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Memilih Metode Pembayaran</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Bengkel Pro mendukung 5 metode pembayaran:
                    </p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground pl-2 space-y-1.5 mt-1.5">
                      <li><strong className="text-foreground font-medium">Tunai (Cash)</strong>: Masukkan jumlah uang yang diterima untuk menghitung uang kembalian secara otomatis.</li>
                      <li><strong className="text-foreground font-medium">Transfer Bank</strong>: Menampilkan rekening bank bengkel (diatur di Pengaturan).</li>
                      <li><strong className="text-foreground font-medium">QRIS</strong>: Menampilkan barcode scan QRIS untuk memudahkan pelanggan melakukan pembayaran nontunai.</li>
                      <li><strong className="text-foreground font-medium">Cicilan / Tempo</strong>: Mengizinkan pembayaran sebagian (DP) dengan mencatat sisa tagihan (piutang).</li>
                    </ul>
                  </div>
                </div>

                {/* Langkah 4 */}
                <div className="flex gap-4 border-t pt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">4</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Mencetak Struk Kasir (Printer Thermal & PDF)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Setelah menekan <strong className="text-foreground font-semibold">Proses Pembayaran</strong>, dialog sukses akan muncul. Klik tombol <strong className="text-foreground font-semibold">Cetak Struk</strong> untuk langsung mencetak struk belanja ke printer thermal lokal (80mm) atau menyimpannya sebagai file PDF yang rapi.
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-lg p-3 text-xs border border-primary/10 flex items-start gap-2.5">
                  <Printer className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground leading-relaxed">
                    <strong className="text-primary font-semibold">Format Kertas:</strong> Struk dicetak secara khusus menggunakan media css terisolasi sehingga hanya struk belanja saja yang tercetak ke printer (sidebar, header, dan layar latar belakang otomatis disembunyikan).
                  </span>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: INVENTORI */}
          <TabsContent value="inventori" className="space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Package className="w-5 h-5" /> Suku Cadang & Mutasi Stok
                </CardTitle>
                <CardDescription>
                  Panduan menambah sparepart baru, mengubah harga jual/beli, alarm stok minimum, dan mutasi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Langkah 1 */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">1</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Menambahkan Barang Baru</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pilih menu Inventori, lalu klik <strong className="text-foreground font-semibold">Tambah Barang</strong>. Isi semua detail seperti Kode, Nama, Merek, Kategori, Stok Awal, Stok Minimum Warning, Harga Beli (Harga Modal), Harga Jual, Satuan, dan Lokasi Rak.
                    </p>
                  </div>
                </div>

                {/* Langkah 2 */}
                <div className="flex gap-4 border-t pt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">2</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Melakukan Update / Edit Barang</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Klik tombol <strong className="text-foreground font-semibold">Edit</strong> di ujung kanan baris barang. Anda dapat mengubah detail spesifikasi barang, harga beli, maupun harga jual.
                    </p>
                  </div>
                </div>

                {/* Langkah 3 */}
                <div className="flex gap-4 border-t pt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">3</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Penyesuaian Stok (Audit Fisik)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Jika saat diedit, nilai <strong className="text-foreground font-medium">Stok Saat Ini</strong> Anda ubah (misal karena penyesuaian fisik opname stok di gudang), sistem akan **secara otomatis mencatat log mutasi** (stok masuk/keluar) di log mutasi database untuk keperluan audit audit inventori.
                    </p>
                  </div>
                </div>

                <div className="bg-destructive/10 rounded-lg p-3 text-xs border border-destructive/20 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-destructive font-medium leading-relaxed">
                    Penting: Selalu isi kolom Harga Beli dengan benar. Kolom ini menjadi acuan utama kalkulasi total nilai aset inventori modal bengkel Anda pada dashboard Laporan.
                  </span>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: LAPORAN & SISTEM */}
          <TabsContent value="laporan" className="space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <BarChart3 className="w-5 h-5" /> Laporan & Pengaturan Sistem
                </CardTitle>
                <CardDescription>
                  Panduan memantau performa keuangan, ekspor excel, backup database, dan ganti tema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Langkah 1 */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">1</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Membaca Grafik & Kinerja (Laporan)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Halaman Laporan dikonfigurasi dengan lebar 100% (penuh) untuk ruang baca maksimal:
                    </p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground pl-2 space-y-1.5 mt-1.5">
                      <li><strong className="text-foreground font-medium">Pendapatan & Kasir</strong>: Melihat grafik omzet 6 bulan terakhir, piutang tagihan, dan rekap transaksi kasir.</li>
                      <li><strong className="text-foreground font-medium">Rekapitulasi SPK</strong>: Melihat kinerja mekanik, jumlah SPK aktif, dan total biaya servis.</li>
                      <li><strong className="text-foreground font-medium">Inventori & Aset</strong>: Memantau valuasi modal aset (berdasarkan harga beli) dan perkiraan profit (berdasarkan harga jual).</li>
                    </ul>
                  </div>
                </div>

                {/* Langkah 2 */}
                <div className="flex gap-4 border-t pt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">2</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Ekspor ke Excel</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Ketik pencarian di kolom pencarian tabel laporan jika ingin memfilter data tertentu, lalu klik <strong className="text-foreground font-semibold">Export ke Excel</strong>. File spreadsheet `.xlsx` akan langsung terunduh secara rapi dan otomatis menyesuaikan lebar kolom.
                    </p>
                  </div>
                </div>

                {/* Langkah 3 */}
                <div className="flex gap-4 border-t pt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">3</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Backup & Restore Database</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Masuk ke halaman Pengaturan, gulir ke bagian paling bawah:
                    </p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground pl-2 space-y-1.5 mt-1.5">
                      <li><strong className="text-foreground font-medium">Backup Database</strong>: Klik tombol ini untuk membuka jendela "Save As". Anda bisa menyimpan salinan seluruh data bengkel secara bebas ke dalam Flashdisk atau folder Dokumen Anda.</li>
                      <li><strong className="text-foreground font-medium">Restore Database</strong>: Klik tombol ini untuk memulihkan data lama Anda. Pilih file `.db` hasil backup lama, dan aplikasi akan secara otomatis memuat data tersebut lalu me-reload (*restart*) sistem agar data langsung tampil!</li>
                    </ul>
                  </div>
                </div>

                {/* Langkah 4 */}
                <div className="flex gap-4 border-t pt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">4</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Aktivasi Mode Gelap (Dark Mode)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Di halaman Pengaturan bagian tengah, Anda dapat memilih tema: <strong className="text-foreground font-medium">Terang</strong>, <strong className="text-foreground font-medium">Gelap (Dark)</strong>, atau <strong className="text-foreground font-medium">Sistem</strong>. Preferensi tema tersimpan permanen di memori lokal dan tidak akan hilang saat aplikasi ditutup.
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-lg p-3 text-xs border border-primary/10 flex items-start gap-2.5">
                  <Moon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground leading-relaxed">
                    <strong className="text-primary font-semibold">Rekomendasi Keamanan:</strong> Lakukan backup database minimal seminggu sekali untuk mengamankan data pelanggan dan pembukuan Anda.
                  </span>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
