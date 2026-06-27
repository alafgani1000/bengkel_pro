import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Download, FileText, BarChart3, PieChart, Search, 
  TrendingUp, Wrench, Boxes, AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export function ReportsPage() {
  const [reportType, setReportType] = useState('revenue');
  const [searchQuery, setSearchQuery] = useState('');

  /* 1. Monthly Revenue for Chart */
  const { data: monthlyRevenue = [] } = useQuery({
    queryKey: ['monthlyRevenue'],
    queryFn: async () => {
      if (window.api?.invoke) {
        return await window.api.invoke('reports:monthly-revenue', {});
      }
      return [];
    },
  });

  /* 2. Detailed Revenue List */
  const { data: revenueList = [], isLoading: isRevenueLoading } = useQuery({
    queryKey: ['revenueList'],
    queryFn: async () => {
      if (window.api?.invoke) {
        return await window.api.invoke('reports:revenue-summary', {});
      }
      return [];
    },
    enabled: reportType === 'revenue',
  });

  /* 3. Detailed SPK List */
  const { data: spkList = [], isLoading: isSpkLoading } = useQuery({
    queryKey: ['spkList'],
    queryFn: async () => {
      if (window.api?.invoke) {
        return await window.api.invoke('reports:spk-summary', {});
      }
      return [];
    },
    enabled: reportType === 'spk',
  });

  /* 4. Detailed Inventory List */
  const { data: inventoryList = [], isLoading: isInventoryLoading } = useQuery({
    queryKey: ['inventoryList'],
    queryFn: async () => {
      if (window.api?.invoke) {
        return await window.api.invoke('reports:inventory-summary', {});
      }
      return [];
    },
    enabled: reportType === 'inventory',
  });

  /* Filter search queries */
  const filteredRevenue = revenueList.filter((inv: any) => {
    const q = searchQuery.toLowerCase();
    return !q ||
      inv.nomorInvoice?.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q) ||
      inv.workOrder?.nomorSPK?.toLowerCase().includes(q) ||
      inv.metodeBayar?.toLowerCase().includes(q) ||
      inv.status?.toLowerCase().includes(q);
  });

  const filteredSpk = spkList.filter((wo: any) => {
    const q = searchQuery.toLowerCase();
    return !q ||
      wo.nomorSPK?.toLowerCase().includes(q) ||
      wo.customer?.name?.toLowerCase().includes(q) ||
      wo.kendaraan?.platNomor?.toLowerCase().includes(q) ||
      wo.mekanik?.name?.toLowerCase().includes(q) ||
      wo.status?.toLowerCase().includes(q);
  });

  const filteredInventory = inventoryList.filter((sp: any) => {
    const q = searchQuery.toLowerCase();
    return !q ||
      sp.kode?.toLowerCase().includes(q) ||
      sp.nama?.toLowerCase().includes(q) ||
      sp.merek?.toLowerCase().includes(q) ||
      sp.kategori?.toLowerCase().includes(q);
  });

  /* Calculations */
  const revenueStats = {
    totalRevenue: revenueList.reduce((sum: number, item: any) => sum + (item.status === 'LUNAS' ? item.total : 0), 0),
    totalUnpaid: revenueList.reduce((sum: number, item: any) => sum + (item.status !== 'LUNAS' ? (item.total - item.nominalDibayar) : 0), 0),
    invoiceCount: revenueList.length,
    unpaidCount: revenueList.filter((item: any) => item.status !== 'LUNAS').length
  };

  const spkStats = {
    total: spkList.length,
    active: spkList.filter((item: any) => ['ANTRI', 'DIKERJAKAN', 'MENUNGGU_PART'].includes(item.status)).length,
    completed: spkList.filter((item: any) => ['SELESAI', 'DIAMBIL'].includes(item.status)).length,
    cancelled: spkList.filter((item: any) => item.status === 'BATAL').length
  };

  const inventoryStats = {
    totalSKUs: inventoryList.length,
    lowStock: inventoryList.filter((item: any) => item.stokSaatIni <= item.stokMinimum).length,
    assetValBuy: inventoryList.reduce((sum: number, item: any) => sum + (item.stokSaatIni * item.hargaBeli), 0),
    assetValSell: inventoryList.reduce((sum: number, item: any) => sum + (item.stokSaatIni * item.hargaJual), 0)
  };

  const handleExportExcel = () => {
    let dataToExport: any[] = [];
    let fileName = '';

    if (reportType === 'revenue') {
      fileName = 'Laporan_Pendapatan';
      dataToExport = filteredRevenue.map((inv: any) => ({
        'Nomor Invoice': inv.nomorInvoice,
        'Nomor SPK': inv.workOrder?.nomorSPK || '-',
        'Tanggal Dibuat': new Date(inv.createdAt).toLocaleDateString('id-ID'),
        'Tanggal Bayar': inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('id-ID') : '-',
        'Pelanggan': inv.customer?.name || '-',
        'Subtotal (Rp)': inv.subtotal,
        'Diskon (Rp)': inv.diskon,
        'Pajak (Rp)': inv.pajak,
        'Total (Rp)': inv.total,
        'Status': inv.status,
        'Metode Pembayaran': inv.metodeBayar || '-'
      }));
    } else if (reportType === 'spk') {
      fileName = 'Laporan_Rekap_SPK';
      dataToExport = filteredSpk.map((wo: any) => ({
        'Nomor SPK': wo.nomorSPK,
        'Tanggal Masuk': new Date(wo.createdAt).toLocaleDateString('id-ID'),
        'Pelanggan': wo.customer?.name || '-',
        'Plat Nomor': wo.kendaraan?.platNomor || '-',
        'Kendaraan': `${wo.kendaraan?.merek || ''} ${wo.kendaraan?.model || ''}`,
        'Mekanik': wo.mekanik?.name || '-',
        'Status': wo.status,
        'Total Biaya (Rp)': wo.totalBiaya
      }));
    } else if (reportType === 'inventory') {
      fileName = 'Laporan_Stok_Barang';
      dataToExport = filteredInventory.map((sp: any) => ({
        'Kode Sparepart': sp.kode,
        'Nama Barang': sp.nama,
        'Merek': sp.merek || '-',
        'Kategori': sp.kategori,
        'Stok Saat Ini': sp.stokSaatIni,
        'Stok Minimum': sp.stokMinimum,
        'Harga Beli (Rp)': sp.hargaBeli,
        'Harga Jual (Rp)': sp.hargaJual,
        'Satuan': sp.satuan,
        'Lokasi Rak': sp.lokasiRak || '-',
        'Total Aset Beli (Rp)': sp.stokSaatIni * sp.hargaBeli,
        'Total Aset Jual (Rp)': sp.stokSaatIni * sp.hargaJual
      }));
    }

    if (dataToExport.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');
    
    // Auto-fit column widths
    const maxLens = dataToExport.reduce((acc: any, row: any) => {
      Object.keys(row).forEach((key) => {
        const valLen = String(row[key] ?? '').length;
        const keyLen = key.length;
        acc[key] = Math.max(acc[key] || 0, valLen, keyLen);
      });
      return acc;
    }, {});
    
    worksheet['!cols'] = Object.keys(maxLens).map((key) => ({
      wch: maxLens[key] + 3
    }));

    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getExportCount = () => {
    if (reportType === 'revenue') return filteredRevenue.length;
    if (reportType === 'spk') return filteredSpk.length;
    return filteredInventory.length;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Laporan Keuangan & Kinerja</h2>
          <p className="text-muted-foreground text-sm">Analisis kinerja bisnis, riwayat transaksi, dan inventori bengkel Anda.</p>
        </div>
        <Button className="gap-2" onClick={handleExportExcel} disabled={getExportCount() === 0}>
          <Download className="w-4 h-4" /> Export ke Excel ({getExportCount()})
        </Button>
      </div>

      {/* CATEGORY TABS (HORIZONTAL) */}
      <div className="flex gap-1 border-b border-border pb-0">
        <button
          onClick={() => { setReportType('revenue'); setSearchQuery(''); }}
          className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-all border-b-2 -mb-px flex items-center gap-2 ${
            reportType === 'revenue'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Pendapatan & Kasir
        </button>
        <button
          onClick={() => { setReportType('spk'); setSearchQuery(''); }}
          className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-all border-b-2 -mb-px flex items-center gap-2 ${
            reportType === 'spk'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Rekapitulasi SPK
        </button>
        <button
          onClick={() => { setReportType('inventory'); setSearchQuery(''); }}
          className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-all border-b-2 -mb-px flex items-center gap-2 ${
            reportType === 'inventory'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Inventori & Aset
        </button>
      </div>

      {/* MAIN REPORT AREA */}
      <div className="flex-1 space-y-4 flex flex-col overflow-auto pb-4">
          
          {/* ─── SUMMARY CARDS ─── */}
          {reportType === 'revenue' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">Total Pendapatan (Lunas)</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> {fmt(revenueStats.totalRevenue)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">Piutang / Belum Lunas</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold text-orange-600">{fmt(revenueStats.totalUnpaid)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">Jumlah Invoice Diterbitkan</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">{revenueStats.invoiceCount} Transaksi</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">Invoice Belum Lunas</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold text-destructive">{revenueStats.unpaidCount} Invoice</div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'spk' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">Total SPK Terdaftar</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold text-primary flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" /> {spkStats.total} SPK
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">SPK Sedang Aktif</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold text-blue-600">{spkStats.active} SPK</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">SPK Selesai & Diambil</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold text-emerald-600">{spkStats.completed} SPK</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">SPK Dibatalkan</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold text-muted-foreground">{spkStats.cancelled} SPK</div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'inventory' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">Total SKU Barang</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold text-primary flex items-center gap-1.5">
                    <Boxes className="w-4 h-4" /> {inventoryStats.totalSKUs} Item
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">Stok Menipis / Habis</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className={`text-lg font-bold flex items-center gap-1 ${inventoryStats.lowStock > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {inventoryStats.lowStock > 0 && <AlertTriangle className="w-4 h-4" />}
                    {inventoryStats.lowStock} Item
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">Nilai Aset (Harga Beli)</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">{fmt(inventoryStats.assetValBuy)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription className="text-xs">Nilai Aset (Harga Jual)</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold text-primary">{fmt(inventoryStats.assetValSell)}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── VISUAL CHART (For revenue only) ─── */}
          {reportType === 'revenue' && monthlyRevenue.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Grafik Pendapatan Bulanan</CardTitle>
                <CardDescription>Visualisasi transaksi lunas selama 6 bulan terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => `Rp ${value / 1000000}jt`}
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value: any) => fmt(Number(value))}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── SEARCH & DATA TABLES ─── */}
          <Card className="flex-1 flex flex-col min-h-[400px]">
            <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base">
                  {reportType === 'revenue' && 'Rincian Transaksi Keuangan'}
                  {reportType === 'spk' && 'Rincian Aktivitas SPK'}
                  {reportType === 'inventory' && 'Rincian Stok & Aset Barang'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {reportType === 'revenue' && 'Riwayat pembayaran tagihan invoice dari kasir.'}
                  {reportType === 'spk' && 'Daftar rekapitulasi surat perintah kerja.'}
                  {reportType === 'inventory' && 'Informasi stok minimum, harga beli/jual, serta nilai aset barang.'}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari data..." 
                  className="pl-9 h-9 text-xs" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-auto flex-1">
              {/* 1. REVENUE TABLE */}
              {reportType === 'revenue' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">No Invoice</TableHead>
                      <TableHead className="text-xs">No SPK</TableHead>
                      <TableHead className="text-xs">Tgl Dibuat</TableHead>
                      <TableHead className="text-xs">Pelanggan</TableHead>
                      <TableHead className="text-xs text-right">Subtotal</TableHead>
                      <TableHead className="text-xs text-right">Diskon</TableHead>
                      <TableHead className="text-xs text-right">Pajak</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                      <TableHead className="text-xs">Metode</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isRevenueLoading ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-8 text-xs text-muted-foreground">Memuat data transaksi...</TableCell></TableRow>
                    ) : filteredRevenue.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-8 text-xs text-muted-foreground">Tidak ada data transaksi ditemukan</TableCell></TableRow>
                    ) : (
                      filteredRevenue.map((inv: any) => (
                        <TableRow key={inv.id} className="text-xs">
                          <TableCell className="font-mono">{inv.nomorInvoice}</TableCell>
                          <TableCell className="font-mono">{inv.workOrder?.nomorSPK || '-'}</TableCell>
                          <TableCell>{new Date(inv.createdAt).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell className="font-medium">{inv.customer?.name || '-'}</TableCell>
                          <TableCell className="text-right">{fmt(inv.subtotal)}</TableCell>
                          <TableCell className="text-right text-red-500">{inv.diskon > 0 ? `-${fmt(inv.diskon)}` : '-'}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{inv.pajak > 0 ? fmt(inv.pajak) : '-'}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">{fmt(inv.total)}</TableCell>
                          <TableCell><Badge variant="outline">{inv.metodeBayar || 'TUNAI'}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={inv.status === 'LUNAS' ? 'secondary' : 'destructive'} className="text-[10px]">
                              {inv.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {/* 2. SPK TABLE */}
              {reportType === 'spk' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">No SPK</TableHead>
                      <TableHead className="text-xs">Tgl Masuk</TableHead>
                      <TableHead className="text-xs">Pelanggan</TableHead>
                      <TableHead className="text-xs">Kendaraan</TableHead>
                      <TableHead className="text-xs">Mekanik</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Total Biaya</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isSpkLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">Memuat data SPK...</TableCell></TableRow>
                    ) : filteredSpk.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">Tidak ada data SPK ditemukan</TableCell></TableRow>
                    ) : (
                      filteredSpk.map((wo: any) => (
                        <TableRow key={wo.id} className="text-xs">
                          <TableCell className="font-mono">{wo.nomorSPK}</TableCell>
                          <TableCell>{new Date(wo.createdAt).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell className="font-medium">{wo.customer?.name || '-'}</TableCell>
                          <TableCell>
                            <div className="font-medium">{wo.kendaraan?.platNomor}</div>
                            <div className="text-[10px] text-muted-foreground">{wo.kendaraan?.merek} {wo.kendaraan?.model || ''}</div>
                          </TableCell>
                          <TableCell>{wo.mekanik?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              wo.status === 'SELESAI' || wo.status === 'DIAMBIL' ? 'secondary' : 
                              wo.status === 'DIKERJAKAN' ? 'default' : 
                              wo.status === 'BATAL' ? 'destructive' : 'outline'
                            } className="text-[10px]">
                              {wo.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{fmt(wo.totalBiaya)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {/* 3. INVENTORY TABLE */}
              {reportType === 'inventory' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Kode</TableHead>
                      <TableHead className="text-xs">Nama Barang</TableHead>
                      <TableHead className="text-xs">Merek</TableHead>
                      <TableHead className="text-xs">Kategori</TableHead>
                      <TableHead className="text-xs text-right">Stok</TableHead>
                      <TableHead className="text-xs text-right">Min. Stok</TableHead>
                      <TableHead className="text-xs text-right">Harga Beli</TableHead>
                      <TableHead className="text-xs text-right">Harga Jual</TableHead>
                      <TableHead className="text-xs text-right">Total Aset (Beli)</TableHead>
                      <TableHead className="text-xs">Lokasi Rak</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isInventoryLoading ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-8 text-xs text-muted-foreground">Memuat data barang...</TableCell></TableRow>
                    ) : filteredInventory.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-8 text-xs text-muted-foreground">Tidak ada data barang ditemukan</TableCell></TableRow>
                    ) : (
                      filteredInventory.map((sp: any) => {
                        const isLow = sp.stokSaatIni <= sp.stokMinimum;
                        return (
                          <TableRow key={sp.id} className="text-xs">
                            <TableCell className="font-mono">{sp.kode}</TableCell>
                            <TableCell className="font-medium">{sp.nama}</TableCell>
                            <TableCell>{sp.merek || '-'}</TableCell>
                            <TableCell><Badge variant="outline">{sp.kategori}</Badge></TableCell>
                            <TableCell className="text-right">
                              <span className={isLow ? 'text-destructive font-bold' : ''}>
                                {sp.stokSaatIni} {sp.satuan}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{sp.stokMinimum}</TableCell>
                            <TableCell className="text-right">{fmt(sp.hargaBeli)}</TableCell>
                            <TableCell className="text-right font-medium text-primary">{fmt(sp.hargaJual)}</TableCell>
                            <TableCell className="text-right font-semibold">{fmt(sp.stokSaatIni * sp.hargaBeli)}</TableCell>
                            <TableCell className="font-mono">{sp.lokasiRak || '-'}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
