import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form states
  const [newItem, setNewItem] = useState({
    kode: '',
    nama: '',
    merek: '',
    kategori: '',
    stokSaatIni: 0,
    stokMinimum: 0,
    hargaBeli: 0,
    hargaJual: 0,
    satuan: 'PCS',
    lokasiRak: ''
  });

  const [editingItem, setEditingItem] = useState<any>(null);

  // Queries
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      if (window.api && window.api.invoke) {
        return await window.api.invoke('inventory:list', {});
      }
      return [];
    },
  });

  // Filter search queries
  const filteredInventory = inventory.filter((item: any) => 
    (item.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.kode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.merek || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.kategori || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutations
  const addItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await window.api.invoke('inventory:add', {
        ...data,
        hargaBeli: parseFloat(data.hargaBeli) || 0,
        hargaJual: parseFloat(data.hargaJual) || 0,
        stokSaatIni: parseInt(data.stokSaatIni) || 0,
        stokMinimum: parseInt(data.stokMinimum) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAddOpen(false);
      setNewItem({
        kode: '',
        nama: '',
        merek: '',
        kategori: '',
        stokSaatIni: 0,
        stokMinimum: 0,
        hargaBeli: 0,
        hargaJual: 0,
        satuan: 'PCS',
        lokasiRak: ''
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await window.api.invoke('inventory:update', {
        id: data.id,
        data: {
          kode: data.kode,
          nama: data.nama,
          merek: data.merek,
          kategori: data.kategori,
          stokSaatIni: parseInt(data.stokSaatIni) || 0,
          stokMinimum: parseInt(data.stokMinimum) || 0,
          hargaBeli: parseFloat(data.hargaBeli) || 0,
          hargaJual: parseFloat(data.hargaJual) || 0,
          satuan: data.satuan,
          lokasiRak: data.lokasiRak
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsEditOpen(false);
      setEditingItem(null);
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.kode || !newItem.nama) return;
    addItemMutation.mutate(newItem);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.kode || !editingItem.nama) return;
    updateItemMutation.mutate(editingItem);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka || 0);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventori Sparepart</h2>
          <p className="text-muted-foreground text-sm">Kelola stok, harga beli/jual, lokasi rak, dan alarm minimum sparepart.</p>
        </div>
        
        {/* ADD DIALOG */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Tambah Barang
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Suku Cadang</DialogTitle>
              <DialogDescription>Masukkan detail sparepart baru ke dalam database inventori.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Kode Barang *</label>
                  <Input required value={newItem.kode} onChange={(e) => setNewItem({ ...newItem, kode: e.target.value })} placeholder="Contoh: BUSI-001" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Nama Barang *</label>
                  <Input required value={newItem.nama} onChange={(e) => setNewItem({ ...newItem, nama: e.target.value })} placeholder="Contoh: Busi Iridium Spark" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Merek</label>
                  <Input value={newItem.merek} onChange={(e) => setNewItem({ ...newItem, merek: e.target.value })} placeholder="Contoh: Denso, NGK" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Kategori</label>
                  <Input value={newItem.kategori} onChange={(e) => setNewItem({ ...newItem, kategori: e.target.value })} placeholder="Contoh: Pengapian, Mesin, Oli" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Stok Awal</label>
                  <Input type="number" min="0" value={newItem.stokSaatIni} onChange={(e) => setNewItem({ ...newItem, stokSaatIni: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Stok Minimum Warning</label>
                  <Input type="number" min="0" value={newItem.stokMinimum} onChange={(e) => setNewItem({ ...newItem, stokMinimum: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Harga Beli (Rp)</label>
                  <Input type="number" min="0" value={newItem.hargaBeli} onChange={(e) => setNewItem({ ...newItem, hargaBeli: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Harga Jual (Rp)</label>
                  <Input type="number" min="0" value={newItem.hargaJual} onChange={(e) => setNewItem({ ...newItem, hargaJual: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Satuan</label>
                  <Input value={newItem.satuan} onChange={(e) => setNewItem({ ...newItem, satuan: e.target.value })} placeholder="Contoh: PCS, LITER, SET" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Lokasi Rak</label>
                  <Input value={newItem.lokasiRak} onChange={(e) => setNewItem({ ...newItem, lokasiRak: e.target.value })} placeholder="Contoh: Rak A-3" />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                <Button type="submit" disabled={addItemMutation.isPending}>Simpan Barang</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* INVENTORY TABLE CARD */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="py-4 flex flex-row items-center justify-between border-b border-border bg-muted/20">
          <CardTitle className="text-lg">Daftar Suku Cadang</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama, kode, merek, kategori..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Merek</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga Beli</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead className="text-center">Rak</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-32 text-muted-foreground">
                    Memuat data inventori...
                  </TableCell>
                </TableRow>
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-32 text-muted-foreground">
                    Tidak ada barang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item: any) => {
                  const isLow = item.stokSaatIni <= item.stokMinimum;
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.kode}</TableCell>
                      <TableCell className="font-semibold">{item.nama}</TableCell>
                      <TableCell>{item.merek || '-'}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{item.kategori || '-'}</Badge></TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{formatRupiah(item.hargaBeli)}</TableCell>
                      <TableCell className="text-right font-medium text-primary">{formatRupiah(item.hargaJual)}</TableCell>
                      <TableCell className="text-center">
                        {isLow ? (
                          <Badge variant="destructive" className="gap-1 font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            {item.stokSaatIni} {item.satuan || 'PCS'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-medium">
                            {item.stokSaatIni} {item.satuan || 'PCS'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">{item.lokasiRak || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingItem({
                              id: item.id,
                              kode: item.kode,
                              nama: item.nama,
                              merek: item.merek || '',
                              kategori: item.kategori || '',
                              stokSaatIni: item.stokSaatIni || 0,
                              stokMinimum: item.stokMinimum || 0,
                              hargaBeli: item.hargaBeli || 0,
                              hargaJual: item.hargaJual || 0,
                              satuan: item.satuan || 'PCS',
                              lokasiRak: item.lokasiRak || ''
                            });
                            setIsEditOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Suku Cadang</DialogTitle>
            <DialogDescription>Perbarui data stok, harga, dan lokasi suku cadang terpilih.</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Kode Barang *</label>
                  <Input required value={editingItem.kode} onChange={(e) => setEditingItem({ ...editingItem, kode: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Nama Barang *</label>
                  <Input required value={editingItem.nama} onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Merek</label>
                  <Input value={editingItem.merek} onChange={(e) => setEditingItem({ ...editingItem, merek: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Kategori</label>
                  <Input value={editingItem.kategori} onChange={(e) => setEditingItem({ ...editingItem, kategori: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Stok Saat Ini</label>
                  <Input type="number" min="0" value={editingItem.stokSaatIni} onChange={(e) => setEditingItem({ ...editingItem, stokSaatIni: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Stok Minimum Warning</label>
                  <Input type="number" min="0" value={editingItem.stokMinimum} onChange={(e) => setEditingItem({ ...editingItem, stokMinimum: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Harga Beli (Rp)</label>
                  <Input type="number" min="0" value={editingItem.hargaBeli} onChange={(e) => setEditingItem({ ...editingItem, hargaBeli: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Harga Jual (Rp)</label>
                  <Input type="number" min="0" value={editingItem.hargaJual} onChange={(e) => setEditingItem({ ...editingItem, hargaJual: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Satuan</label>
                  <Input value={editingItem.satuan} onChange={(e) => setEditingItem({ ...editingItem, satuan: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Lokasi Rak</label>
                  <Input value={editingItem.lokasiRak} onChange={(e) => setEditingItem({ ...editingItem, lokasiRak: e.target.value })} />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
                <Button type="submit" disabled={updateItemMutation.isPending}>Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
