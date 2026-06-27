import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Trash2, Search, Wrench, Package } from 'lucide-react';

const formatRupiah = (value: string | number) => {
  const clean = String(value).replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('id-ID').format(Number(clean));
};

export function WorkOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddJasaOpen, setIsAddJasaOpen] = useState(false);
  const [isAddSparepartOpen, setIsAddSparepartOpen] = useState(false);
  const [newJasa, setNewJasa] = useState<{nama: string, hargaSatuan: number | string, qty: number | string}>({ nama: '', hargaSatuan: '', qty: 1 });
  const [newSparepartSearch, setNewSparepartSearch] = useState('');
  
  const { data: wo, isLoading } = useQuery({
    queryKey: ['workOrder', id],
    queryFn: async () => {
      if (!window.api || !window.api.invoke) return null;
      return await window.api.invoke('work-order:get', { id });
    },
    enabled: !!id,
  });

  const { data: spareparts = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      if (!window.api || !window.api.invoke) return [];
      return await window.api.invoke('inventory:list', {});
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await window.api.invoke('work-order:add-item', { ...data, workOrderId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAddJasaOpen(false);
      setIsAddSparepartOpen(false);
      setNewJasa({ nama: '', hargaSatuan: '', qty: 1 });
      setNewSparepartSearch('');
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await window.api.invoke('work-order:remove-item', { id: itemId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  if (isLoading) return <div className="p-8">Memuat data SPK...</div>;
  if (!wo) return <div className="p-8 text-destructive">SPK tidak ditemukan.</div>;

  const handleAddJasa = (e: React.FormEvent) => {
    e.preventDefault();
    addItemMutation.mutate({ 
      type: 'JASA', 
      nama: newJasa.nama,
      hargaSatuan: Number(newJasa.hargaSatuan) || 0,
      qty: Number(newJasa.qty) || 1
    });
  };

  const handleAddSparepart = (sp: any) => {
    addItemMutation.mutate({
      type: 'SPAREPART',
      nama: sp.nama,
      qty: 1, // Default 1 for now
      hargaSatuan: sp.hargaJual,
      sparepartId: sp.id
    });
  };

  const filteredSpareparts = spareparts.filter((s: any) => 
    s.nama.toLowerCase().includes(newSparepartSearch.toLowerCase()) ||
    s.kode.toLowerCase().includes(newSparepartSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/work-orders')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{wo.nomorSPK}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{wo.status}</Badge>
            <span className="text-sm text-muted-foreground">{new Date(wo.createdAt).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pelanggan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">{wo.customer?.name}</div>
            <div className="text-sm">{wo.customer?.phone || '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kendaraan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">{wo.kendaraan?.platNomor}</div>
            <div className="text-sm">{wo.kendaraan?.merek} {wo.kendaraan?.model}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mekanik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">{wo.mekanik?.name || '-'}</div>
            <div className="text-sm">Keluhan: {wo.keluhan || '-'}</div>
          </CardContent>
        </Card>
      </div>

      {/* TABS */}
      <Tabs defaultValue="pengerjaan" className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="pengerjaan">Pengerjaan & Sparepart</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Status</TabsTrigger>
          <TabsTrigger value="invoice">Draft Invoice</TabsTrigger>
        </TabsList>

        {/* TAB: PENGERJAAN */}
        <TabsContent value="pengerjaan" className="flex-1 mt-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Daftar Item Pengerjaan</CardTitle>
              <div className="flex gap-2">
                <Dialog open={isAddJasaOpen} onOpenChange={setIsAddJasaOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Wrench className="w-4 h-4" /> Tambah Jasa
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Jasa Servis</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddJasa} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nama Jasa *</label>
                        <Input required value={newJasa.nama} onChange={e => setNewJasa({...newJasa, nama: e.target.value})} placeholder="Contoh: Ganti Oli Mesin" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Harga (Rp) *</label>
                        <Input 
                          type="text" 
                          required 
                          value={formatRupiah(newJasa.hargaSatuan)} 
                          onChange={e => {
                            const clean = e.target.value.replace(/\D/g, '');
                            setNewJasa({...newJasa, hargaSatuan: clean ? Number(clean) : ''});
                          }} 
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddJasaOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={addItemMutation.isPending}>Simpan Jasa</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAddSparepartOpen} onOpenChange={setIsAddSparepartOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Package className="w-4 h-4" /> Tambah Sparepart
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Cari Sparepart</DialogTitle>
                      <CardDescription>Pilih sparepart dari inventori untuk dimasukkan ke SPK.</CardDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cari nama atau kode sparepart..."
                          className="pl-9"
                          value={newSparepartSearch}
                          onChange={(e) => setNewSparepartSearch(e.target.value)}
                        />
                      </div>
                      <div className="h-[300px] overflow-auto border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kode / Nama</TableHead>
                              <TableHead>Stok</TableHead>
                              <TableHead>Harga Jual</TableHead>
                              <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredSpareparts.map((sp: any) => (
                              <TableRow key={sp.id}>
                                <TableCell>
                                  <div className="font-medium">{sp.nama}</div>
                                  <div className="text-xs text-muted-foreground">{sp.kode}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={sp.stokSaatIni > 0 ? 'secondary' : 'destructive'}>{sp.stokSaatIni}</Badge>
                                </TableCell>
                                <TableCell>Rp {sp.hargaJual.toLocaleString('id-ID')}</TableCell>
                                <TableCell>
                                  <Button 
                                    size="sm" 
                                    disabled={sp.stokSaatIni <= 0 || addItemMutation.isPending}
                                    onClick={() => handleAddSparepart(sp)}
                                  >
                                    Pilih
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Nama Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wo.items?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada item ditambahkan.</TableCell>
                    </TableRow>
                  ) : (
                    wo.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={item.type === 'JASA' ? 'outline' : 'secondary'}>{item.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.nama}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell className="text-right">Rp {item.hargaSatuan.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right">Rp {item.subtotal.toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => removeItemMutation.mutate(item.id)}
                            disabled={removeItemMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {wo.items?.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={4} className="text-right">Total Biaya:</TableCell>
                      <TableCell className="text-right text-primary">Rp {(wo.totalBiaya || 0).toLocaleString('id-ID')}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: RIWAYAT */}
        <TabsContent value="riwayat" className="flex-1 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Status & Aktivitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-32 text-sm text-muted-foreground">{new Date(wo.createdAt).toLocaleString('id-ID')}</div>
                  <div className="flex-1">
                    <p className="font-medium">SPK Dibuat</p>
                    <p className="text-sm text-muted-foreground">Status awal: ANTRI</p>
                  </div>
                </div>
                {wo.startedAt && (
                  <div className="flex gap-4 border-t pt-4">
                    <div className="w-32 text-sm text-muted-foreground">{new Date(wo.startedAt).toLocaleString('id-ID')}</div>
                    <div className="flex-1">
                      <p className="font-medium">Mulai Dikerjakan</p>
                      <p className="text-sm text-muted-foreground">Oleh {wo.mekanik?.name}</p>
                    </div>
                  </div>
                )}
                {wo.completedAt && (
                  <div className="flex gap-4 border-t pt-4">
                    <div className="w-32 text-sm text-muted-foreground">{new Date(wo.completedAt).toLocaleString('id-ID')}</div>
                    <div className="flex-1">
                      <p className="font-medium">Pengerjaan Selesai</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: INVOICE */}
        <TabsContent value="invoice" className="flex-1 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Draft Invoice Sementara</CardTitle>
              <CardDescription>Tampilan tagihan akan dibuat secara permanen ketika status SPK diubah menjadi SELESAI.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-6 rounded-lg max-w-2xl mx-auto space-y-4">
                <div className="text-center border-b pb-4">
                  <h3 className="text-xl font-bold">BENGKEL PRO</h3>
                  <p className="text-sm text-muted-foreground">Estimasi Tagihan SPK</p>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Total Jasa & Sparepart</span>
                  <span className="font-medium">Rp {(wo.totalBiaya || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-4 font-bold text-lg">
                  <span>TOTAL ESTIMASI</span>
                  <span className="text-primary">Rp {(wo.totalBiaya || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
