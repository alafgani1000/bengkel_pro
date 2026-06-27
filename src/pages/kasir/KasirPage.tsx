import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertCircle, CheckCircle2, Printer, Banknote, QrCode,
  CreditCard, Clock, Receipt
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const PAYMENT_METHODS = [
  { value: 'TUNAI',    label: 'Tunai (Cash)',        icon: Banknote,  desc: 'Pembayaran tunai langsung' },
  { value: 'TRANSFER', label: 'Transfer Bank',       icon: Receipt,   desc: 'Transfer ke rekening bengkel' },
  { value: 'QRIS',     label: 'QRIS',                icon: QrCode,    desc: 'Scan QR code' },
  { value: 'KARTU',    label: 'Kartu Debit/Kredit',  icon: CreditCard, desc: 'Gesek kartu di mesin EDC' },
  { value: 'CICILAN',  label: 'Cicilan / Tempo',     icon: Clock,     desc: 'Bayar sebagian, sisanya kemudian' },
];

/* ─── receipt print component ─────────────────────────────── */
function PrintReceipt({ invoice, bengkelInfo }: { invoice: any; bengkelInfo: any }) {
  const wo = invoice?.workOrder;
  return (
    <div className="text-black text-sm font-mono space-y-2">
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-black">
        <div className="text-lg font-bold">{bengkelInfo?.nama || 'BENGKEL PRO'}</div>
        {bengkelInfo?.alamat && <div className="text-xs">{bengkelInfo.alamat}{bengkelInfo.kota ? `, ${bengkelInfo.kota}` : ''}</div>}
        {bengkelInfo?.telepon && <div className="text-xs">Telp: {bengkelInfo.telepon}</div>}
        <div className="text-xs mt-1">─ STRUK PEMBAYARAN ─</div>
      </div>

      {/* Invoice info */}
      <div className="space-y-0.5 pb-2 border-b border-dashed border-black text-xs">
        <div className="flex justify-between"><span>No Invoice</span><span>{invoice?.nomorInvoice}</span></div>
        <div className="flex justify-between"><span>Tanggal</span><span>{invoice?.paidAt ? new Date(invoice.paidAt).toLocaleString('id-ID') : '-'}</span></div>
        <div className="flex justify-between"><span>Pelanggan</span><span>{wo?.customer?.name || wo?.customer?.nama || '-'}</span></div>
        <div className="flex justify-between"><span>Kendaraan</span><span>{wo?.kendaraan?.platNomor || '-'}</span></div>
        {wo?.kendaraan?.merek && <div className="flex justify-between"><span></span><span>{wo.kendaraan.merek} {wo.kendaraan.model || ''}</span></div>}
        <div className="flex justify-between"><span>Mekanik</span><span>{wo?.mekanik?.name || '-'}</span></div>
      </div>

      {/* Items */}
      <div className="pb-2 border-b border-dashed border-black space-y-1 text-xs">
        {wo?.items?.map((item: any) => (
          <div key={item.id}>
            <div className="font-semibold truncate">{item.nama}</div>
            <div className="flex justify-between text-gray-600">
              <span>{item.qty} x {item.hargaSatuan.toLocaleString('id-ID')}</span>
              <span>{item.subtotal.toLocaleString('id-ID')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="pb-2 border-b border-black text-xs space-y-0.5">
        <div className="flex justify-between"><span>Subtotal</span><span>{(invoice?.subtotal || 0).toLocaleString('id-ID')}</span></div>
        {(invoice?.diskon || 0) > 0 && <div className="flex justify-between"><span>Diskon</span><span>-{invoice.diskon.toLocaleString('id-ID')}</span></div>}
        {(invoice?.pajak || 0) > 0 && <div className="flex justify-between"><span>Pajak</span><span>+{invoice.pajak.toLocaleString('id-ID')}</span></div>}
        <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
          <span>TOTAL</span><span>{(invoice?.total || 0).toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Payment info */}
      <div className="text-xs space-y-0.5">
        <div className="flex justify-between"><span>Metode</span><span>{invoice?.metodeBayar || 'TUNAI'}</span></div>
        <div className="flex justify-between"><span>Dibayar</span><span>{(invoice?.nominalDibayar || 0).toLocaleString('id-ID')}</span></div>
        {(invoice?.kembalian || 0) > 0 && <div className="flex justify-between"><span>Kembali</span><span>{invoice.kembalian.toLocaleString('id-ID')}</span></div>}
      </div>

      {/* Footer */}
      <div className="text-center text-xs pt-2 border-t border-dashed border-black space-y-0.5">
        <div>Terima kasih atas kunjungan Anda!</div>
        <div>Servis berikutnya harap bawa struk ini.</div>
      </div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────── */
export function KasirPage() {
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('TUNAI');
  const [diskon, setDiskon] = useState<string>('');
  const [pajakPersen, setPajakPersen] = useState<string>('');
  const [nominalDibayar, setNominalDibayar] = useState<string>('');
  const [uangMuka, setUangMuka] = useState<string>('');        // for CICILAN
  const [grandTotal, setGrandTotal] = useState(0);
  const [kembalian, setKembalian] = useState(0);

  // modal state
  const [successInvoice, setSuccessInvoice] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  /* queries */
  const { data: unpaidInvoices = [] } = useQuery({
    queryKey: ['unpaidInvoices'],
    queryFn: async () => window.api?.invoke('kasir:list-unpaid', {}) ?? [],
  });

  const { data: paidInvoices = [] } = useQuery({
    queryKey: ['paidInvoices'],
    queryFn: async () => window.api?.invoke('kasir:list-paid', {}) ?? [],
  });

  const { data: bengkelInfo } = useQuery({
    queryKey: ['settings-bengkel'],
    queryFn: async () => window.api?.invoke('settings:get-bengkel') ?? null,
  });

  /* calculate totals */
  useEffect(() => {
    if (!selectedInvoice || selectedInvoice.status === 'LUNAS') return;
    const subtotal = selectedInvoice.subtotal || 0;
    const disc = Number(diskon) || 0;
    const afterDisc = Math.max(0, subtotal - disc);
    const tax = afterDisc * ((Number(pajakPersen) || 0) / 100);
    const total = afterDisc + tax;
    setGrandTotal(total);
    const bayar = Number(nominalDibayar) || 0;
    setKembalian(Math.max(0, bayar - total));
  }, [selectedInvoice, diskon, pajakPersen, nominalDibayar]);

  const resetForm = () => {
    setPaymentMethod('TUNAI');
    setDiskon('');
    setPajakPersen('');
    setNominalDibayar('');
    setUangMuka('');
    setGrandTotal(0);
    setKembalian(0);
  };

  const handleSelectInvoice = (inv: any) => {
    setSelectedInvoice(inv);
    resetForm();
    if (inv.status !== 'LUNAS') {
      setNominalDibayar(String(inv.subtotal));
    }
  };

  /* pay mutation */
  const payMutation = useMutation({
    mutationFn: async (payload: any) => window.api.invoke('kasir:pay', payload),
    onSuccess: (updatedInvoice: any) => {
      queryClient.invalidateQueries({ queryKey: ['unpaidInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['paidInvoices'] });
      // merge workOrder data for receipt
      const fullInvoice = { ...updatedInvoice, workOrder: selectedInvoice?.workOrder };
      setSuccessInvoice(fullInvoice);
      setSelectedInvoice(null);
      resetForm();
      setShowSuccessModal(true);
    },
  });

  const handlePay = () => {
    if (!selectedInvoice) return;
    const numBayar = Number(nominalDibayar) || 0;
    const numDiskon = Number(diskon) || 0;
    const isCicilan = paymentMethod === 'CICILAN';
    const numUangMuka = Number(uangMuka) || 0;

    // validation
    if (!isCicilan && numBayar < grandTotal) return;
    if (isCicilan && numUangMuka <= 0) return;

    const payload = {
      invoiceId: selectedInvoice.id,
      paymentMethod,
      diskon: numDiskon,
      pajak: grandTotal - ((selectedInvoice.subtotal || 0) - numDiskon),
      total: grandTotal,
      nominalDibayar: isCicilan ? numUangMuka : numBayar,
      kembalian: isCicilan ? 0 : kembalian,
    };
    payMutation.mutate(payload);
  };

  const handlePrint = () => window.print();

  const isCicilan = paymentMethod === 'CICILAN';
  const numBayar = Number(nominalDibayar) || 0;
  const canPay = isCicilan
    ? (Number(uangMuka) || 0) > 0
    : numBayar >= grandTotal;

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === paymentMethod);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Kasir & Pembayaran</h2>
        <p className="text-muted-foreground text-sm">Kelola pembayaran dari SPK yang telah selesai.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5 print:hidden flex-1 min-h-0">
        {/* LEFT: invoice list */}
        <div className="lg:col-span-3 overflow-auto">
          <Tabs defaultValue="belum-lunas" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="belum-lunas">
                Belum Lunas
                {unpaidInvoices.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">{unpaidInvoices.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="riwayat">Riwayat Transaksi</TabsTrigger>
            </TabsList>

            {/* UNPAID */}
            <TabsContent value="belum-lunas">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Kendaraan</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaidInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            Semua tagihan sudah lunas!
                          </TableCell>
                        </TableRow>
                      ) : (
                        unpaidInvoices.map((inv: any) => (
                          <TableRow
                            key={inv.id}
                            className={`cursor-pointer hover:bg-muted/50 transition-colors ${selectedInvoice?.id === inv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                            onClick={() => handleSelectInvoice(inv)}
                          >
                            <TableCell className="font-mono text-xs">{inv.nomorInvoice}</TableCell>
                            <TableCell className="font-medium">{inv.workOrder?.customer?.name || inv.workOrder?.customer?.nama || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{inv.workOrder?.kendaraan?.platNomor || '-'}</TableCell>
                            <TableCell className="text-right font-semibold">{fmt(inv.subtotal)}</TableCell>
                            <TableCell>
                              <Button variant={selectedInvoice?.id === inv.id ? 'default' : 'ghost'} size="sm">
                                {selectedInvoice?.id === inv.id ? 'Dipilih' : 'Pilih'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PAID HISTORY */}
            <TabsContent value="riwayat">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tgl</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Metode</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground h-32">Belum ada transaksi lunas.</TableCell>
                        </TableRow>
                      ) : (
                        paidInvoices.map((inv: any) => (
                          <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSelectInvoice(inv)}>
                            <TableCell className="text-xs text-muted-foreground">{new Date(inv.paidAt).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell className="font-mono text-xs">{inv.nomorInvoice}</TableCell>
                            <TableCell className="font-medium">{inv.workOrder?.customer?.name || inv.workOrder?.customer?.nama || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{inv.metodeBayar || 'TUNAI'}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">{fmt(inv.total)}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="gap-1" onClick={(e) => { e.stopPropagation(); setSuccessInvoice(inv); setShowSuccessModal(true); }}>
                                <Printer className="w-3 h-3" /> Cetak
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT: payment panel */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detail Pembayaran</CardTitle>
              {selectedInvoice && (
                <CardDescription className="font-mono text-xs">{selectedInvoice.nomorInvoice}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedInvoice ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground space-y-2">
                  <Receipt className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Klik tagihan di kiri untuk memproses pembayaran</p>
                </div>
              ) : selectedInvoice.status === 'LUNAS' ? (
                /* VIEW MODE for paid invoice */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 p-3 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                    <div>
                      <div className="font-semibold text-sm">Sudah Lunas</div>
                      <div className="text-xs">{selectedInvoice.paidAt ? new Date(selectedInvoice.paidAt).toLocaleString('id-ID') : ''}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Pelanggan</span><span className="font-medium">{selectedInvoice.workOrder?.customer?.name || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(selectedInvoice.subtotal)}</span></div>
                    {(selectedInvoice.diskon || 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Diskon</span><span className="text-red-500">-{fmt(selectedInvoice.diskon)}</span></div>}
                    {(selectedInvoice.pajak || 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Pajak</span><span>{fmt(selectedInvoice.pajak)}</span></div>}
                    <Separator />
                    <div className="flex justify-between font-bold text-primary"><span>Total</span><span>{fmt(selectedInvoice.total)}</span></div>
                    <div className="flex justify-between text-xs text-muted-foreground"><span>Dibayar via</span><span>{selectedInvoice.metodeBayar}</span></div>
                    {(selectedInvoice.kembalian || 0) > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Kembalian</span><span>{fmt(selectedInvoice.kembalian)}</span></div>}
                  </div>
                  <Button className="w-full gap-2" onClick={() => { setSuccessInvoice(selectedInvoice); setShowSuccessModal(true); }}>
                    <Printer className="w-4 h-4" /> Cetak Struk
                  </Button>
                </div>
              ) : (
                /* PAYMENT FORM */
                <div className="space-y-4">
                  {/* Subtotal summary */}
                  <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pelanggan</span>
                      <span className="font-medium">{selectedInvoice.workOrder?.customer?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kendaraan</span>
                      <span>{selectedInvoice.workOrder?.kendaraan?.platNomor || '-'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">{fmt(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Diskon (Rp)</span>
                      <Input type="number" className="w-28 h-7 text-right text-sm" value={diskon} onChange={e => setDiskon(e.target.value)} min="0" placeholder="0" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pajak (%)</span>
                      <Input type="number" className="w-20 h-7 text-right text-sm" value={pajakPersen} onChange={e => setPajakPersen(e.target.value)} min="0" max="100" placeholder="0" />
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-primary text-base">
                      <span>GRAND TOTAL</span>
                      <span>{fmt(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Payment method selector */}
                  <div className="space-y-2">
                    <Label className="text-sm">Metode Pembayaran</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map(m => {
                        const Icon = m.icon;
                        const active = paymentMethod === m.value;
                        return (
                          <button
                            key={m.value}
                            onClick={() => setPaymentMethod(m.value)}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all ${
                              active
                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="leading-tight">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment method specific info */}
                  {paymentMethod === 'TRANSFER' && (
                    <div className="bg-blue-500/10 rounded-lg p-3 text-xs space-y-1 border border-blue-500/20">
                      <div className="font-semibold text-blue-700 dark:text-blue-400">Instruksi Transfer</div>
                      <div className="text-muted-foreground">Transfer ke rekening bengkel berikut:</div>
                      <div className="font-mono bg-white/50 dark:bg-black/20 p-2 rounded text-sm">
                        <div>{bengkelInfo?.namaBankRekening || 'BCA'} — {bengkelInfo?.nomorRekening || 'Hubungi Admin'}</div>
                        <div>a.n. {bengkelInfo?.nama || 'Bengkel Pro'}</div>
                      </div>
                      <div className="text-muted-foreground">Nominal: <strong className="text-foreground">{fmt(grandTotal)}</strong></div>
                      <div className="text-muted-foreground italic">Klik "Proses" setelah konfirmasi transfer diterima.</div>
                    </div>
                  )}

                  {paymentMethod === 'QRIS' && (
                    <div className="bg-purple-500/10 rounded-lg p-3 text-xs text-center space-y-2 border border-purple-500/20">
                      <div className="font-semibold text-purple-700 dark:text-purple-400">Pembayaran QRIS</div>
                      <div className="w-32 h-32 mx-auto bg-white border-2 border-purple-300 rounded-lg flex items-center justify-center">
                        <QrCode className="w-20 h-20 text-purple-600" />
                      </div>
                      <div className="text-muted-foreground">Minta pelanggan scan QR code di atas</div>
                      <div className="font-bold text-purple-700 dark:text-purple-400">{fmt(grandTotal)}</div>
                      <div className="text-muted-foreground italic">Klik "Proses" setelah pembayaran QRIS terkonfirmasi.</div>
                    </div>
                  )}

                  {paymentMethod === 'KARTU' && (
                    <div className="bg-slate-500/10 rounded-lg p-3 text-xs space-y-1 border border-slate-500/20">
                      <div className="font-semibold">Pembayaran Kartu EDC</div>
                      <div className="text-muted-foreground">Gesekkan kartu debit/kredit pelanggan di mesin EDC.</div>
                      <div>Nominal: <strong>{fmt(grandTotal)}</strong></div>
                      <div className="text-muted-foreground italic">Klik "Proses" setelah struk EDC tercetak.</div>
                    </div>
                  )}

                  {/* TUNAI: nominal input */}
                  {paymentMethod === 'TUNAI' && (
                    <div className="space-y-2">
                      <Label className="text-sm">Uang Diterima (Rp)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={nominalDibayar}
                        onChange={e => setNominalDibayar(e.target.value)}
                        className="text-lg font-bold"
                      />
                      <div className={`flex justify-between items-center p-3 rounded-lg text-sm font-semibold ${kembalian > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                        <span>Kembalian</span>
                        <span className="text-base">{fmt(kembalian)}</span>
                      </div>
                    </div>
                  )}

                  {/* CICILAN: uang muka input */}
                  {paymentMethod === 'CICILAN' && (
                    <div className="space-y-2">
                      <Label className="text-sm">Uang Muka / DP (Rp)</Label>
                      <Input
                        type="number"
                        placeholder="Masukkan nominal DP"
                        value={uangMuka}
                        onChange={e => setUangMuka(e.target.value)}
                        className="text-lg font-bold"
                      />
                      {Number(uangMuka) > 0 && (
                        <div className="flex justify-between text-sm p-2 bg-orange-500/10 rounded text-orange-600">
                          <span>Sisa tagihan</span>
                          <span className="font-semibold">{fmt(grandTotal - (Number(uangMuka) || 0))}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Status invoice akan menjadi SEBAGIAN. Sisa bisa dilunasi kemudian.</p>
                    </div>
                  )}

                  {/* Non-tunai: just show total reminder */}
                  {!['TUNAI', 'CICILAN'].includes(paymentMethod) && (
                    <Input
                      type="number"
                      value={grandTotal}
                      readOnly
                      className="font-bold text-lg bg-muted cursor-not-allowed"
                    />
                  )}

                  {/* Validation warning */}
                  {paymentMethod === 'TUNAI' && numBayar > 0 && numBayar < grandTotal && (
                    <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 p-2 rounded">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Kurang {fmt(grandTotal - numBayar)}</span>
                    </div>
                  )}

                  {/* Process button */}
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handlePay}
                    disabled={payMutation.isPending || !canPay}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {payMutation.isPending ? 'Memproses...' : `Proses ${selectedMethod?.label || ''}`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── SUCCESS MODAL ─────────────────────────────────────── */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-sm print:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              Pembayaran Berhasil!
            </DialogTitle>
          </DialogHeader>

          {successInvoice && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-mono font-semibold">{successInvoice.nomorInvoice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pelanggan</span>
                  <span>{successInvoice.workOrder?.customer?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode</span>
                  <Badge variant="outline">{successInvoice.metodeBayar}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-emerald-700 text-base">
                  <span>Total Dibayar</span>
                  <span>{fmt(successInvoice.total)}</span>
                </div>
                {(successInvoice.kembalian || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kembalian</span>
                    <span className="font-semibold">{fmt(successInvoice.kembalian)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
                  <Printer className="w-4 h-4" /> Cetak Struk
                </Button>
                <Button className="flex-1" onClick={() => setShowSuccessModal(false)}>
                  Selesai
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── PRINTABLE AREA (hidden on screen) ─────────────────── */}
      {successInvoice && (
        <div className="hidden print:block print-area">
          <PrintReceipt invoice={successInvoice} bengkelInfo={bengkelInfo} />
        </div>
      )}
    </div>
  );
}
