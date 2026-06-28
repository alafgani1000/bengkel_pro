import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCog, Plus, Search, Edit, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserForm } from './components/UserForm';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      if (window.api && window.api.invoke) {
        return await window.api.invoke('users:list', {});
      }
      return [];
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (window.api && window.api.invoke) {
        return await window.api.invoke('users:deactivate', { id: userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleToggleActive = (user: any) => {
    if (user.isActive) {
      if (confirm(`Apakah Anda yakin ingin menonaktifkan pengguna ${user.name}? Pengguna tidak akan bisa login lagi.`)) {
        deactivateMutation.mutate(user.id);
      }
    } else {
      // If we want to reactivate them, we just call update with isActive: true
      // I'll reuse the update API through a separate call if needed, 
      // but for now, we'll prompt them to edit the user to reactivate.
      handleEdit(user);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER': return <Badge variant="default" className="bg-purple-500">Owner</Badge>;
      case 'ADMIN': return <Badge variant="default" className="bg-blue-500">Admin</Badge>;
      case 'KASIR': return <Badge variant="secondary" className="bg-emerald-500 text-white">Kasir</Badge>;
      case 'MEKANIK': return <Badge variant="outline" className="border-orange-500 text-orange-600">Mekanik</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="w-8 h-8 text-primary" />
            Manajemen Pengguna
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola akses, role, dan akun staf bengkel Anda
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Tambah Pengguna
        </Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              Daftar Staf & Karyawan
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, username..."
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Login Terakhir</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Memuat data pengguna...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada pengguna yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: any) => (
                    <TableRow key={user.id} className={!user.isActive ? "bg-muted/30 opacity-70" : ""}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aktif</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Nonaktif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.lastLoginAt 
                          ? format(new Date(user.lastLoginAt), 'dd MMM yyyy HH:mm', { locale: id }) 
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(user)}
                            title="Edit Pengguna"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleToggleActive(user)}
                            title={user.isActive ? "Nonaktifkan" : "Aktifkan"}
                          >
                            {user.isActive ? (
                              <PowerOff className="w-4 h-4 text-red-500" />
                            ) : (
                              <Power className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={selectedUser}
      />
    </div>
  );
}
