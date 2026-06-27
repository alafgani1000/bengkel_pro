import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [editCustomer, setEditCustomer] = useState<any>({ id: '', name: '', phone: '', address: '' });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      if (window.api && window.api.invoke) {
        return await window.api.invoke('customers:list', {});
      }
      return [];
    },
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string; address: string }) => {
      return await window.api.invoke('customers:add', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddOpen(false);
      setNewCustomer({ name: '', phone: '', address: '' });
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    addCustomerMutation.mutate(newCustomer);
  };

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; phone: string; address: string }) => {
      return await window.api.invoke('customers:update', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditOpen(false);
      setEditCustomer({ id: '', name: '', phone: '', address: '' });
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer.name) return;
    updateCustomerMutation.mutate(editCustomer);
  };

  const handleEditClick = (customer: any) => {
    setEditCustomer({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setIsEditOpen(true);
  };

  const filteredCustomers = customers.filter((customer: any) => 
    (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone || '').includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Pelanggan</h2>
          <p className="text-muted-foreground">Kelola informasi pelanggan dan riwayat kendaraan mereka.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Tambah Pelanggan
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Lengkap *</label>
                <Input 
                  required 
                  value={newCustomer.name} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                  placeholder="Masukkan nama pelanggan" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">No. Telepon / WA</label>
                <Input 
                  value={newCustomer.phone} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} 
                  placeholder="081234567890" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat</label>
                <Input 
                  value={newCustomer.address} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} 
                  placeholder="Alamat lengkap (opsional)" 
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                <Button type="submit" disabled={addCustomerMutation.isPending}>
                  {addCustomerMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Edit Data Pelanggan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Lengkap *</label>
                <Input 
                  required 
                  value={editCustomer.name} 
                  onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">No. Telepon / WA</label>
                <Input 
                  value={editCustomer.phone} 
                  onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat</label>
                <Input 
                  value={editCustomer.address} 
                  onChange={(e) => setEditCustomer({ ...editCustomer, address: e.target.value })} 
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
                <Button type="submit" disabled={updateCustomerMutation.isPending}>
                  {updateCustomerMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="py-4 flex flex-row items-center justify-between border-b border-border bg-muted/20">
          <CardTitle className="text-lg">Daftar Pelanggan</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama atau telepon..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>No. Telepon / WA</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Total Kendaraan</TableHead>
                <TableHead>Bergabung Sejak</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Pelanggan tidak ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-semibold">{customer.name}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={customer.address}>{customer.address || '-'}</TableCell>
                    <TableCell>{customer.kendaraans?.length || 0} Kendaraan</TableCell>
                    <TableCell>{new Date(customer.createdAt).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(customer)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
