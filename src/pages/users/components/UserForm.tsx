import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null;
}

export function UserForm({ isOpen, onClose, user }: UserFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'KASIR',
    pin: '',
    isActive: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        username: user.username,
        password: '', // Don't show password
        role: user.role,
        pin: user.pin || '',
        isActive: user.isActive,
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'KASIR',
        pin: '',
        isActive: true,
      });
    }
    setError('');
  }, [user, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!window.api || !window.api.invoke) throw new Error('API not available');
      
      if (user) {
        // Only send password if it was changed
        const updateData = { ...data };
        if (!updateData.password) {
          delete updateData.password;
        }
        return await window.api.invoke('users:update', { id: user.id, data: updateData });
      } else {
        return await window.api.invoke('users:create', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'Terjadi kesalahan saat menyimpan pengguna.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user && !formData.password) {
      setError('Password wajib diisi untuk pengguna baru.');
      return;
    }
    
    if (formData.password && formData.password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    if (['KASIR', 'MEKANIK'].includes(formData.role) && (!formData.pin || formData.pin.length !== 4)) {
      setError('PIN Kasir/Mekanik wajib 4 digit.');
      return;
    }

    setIsSubmitting(true);
    mutation.mutate(formData, {
      onSettled: () => setIsSubmitting(false)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
          <DialogDescription>
            {user ? 'Ubah profil staf atau reset kata sandi mereka.' : 'Tambahkan staf baru ke sistem bengkel.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input 
              id="name" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Misal: Budi Santoso"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              required
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="Untuk login"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {user && <span className="text-muted-foreground font-normal">(Isi jika ingin mereset)</span>}
            </Label>
            <Input 
              id="password" 
              type="password"
              required={!user}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role Akses</Label>
            <Select 
              value={formData.role} 
              onValueChange={(val) => setFormData({...formData, role: val})}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KASIR">Kasir</SelectItem>
                <SelectItem value="MEKANIK">Mekanik</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {['KASIR', 'MEKANIK'].includes(formData.role) && (
            <div className="space-y-2">
              <Label htmlFor="pin">PIN Akses Cepat (4 digit)</Label>
              <Input 
                id="pin" 
                type="text"
                required
                maxLength={4}
                pattern="\d{4}"
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})}
                placeholder="Misal: 1234"
              />
            </div>
          )}

          {user && (
            <div className="flex items-center justify-between mt-6 p-4 border rounded-lg bg-muted/20">
              <div className="space-y-0.5">
                <Label>Status Akun</Label>
                <p className="text-xs text-muted-foreground">
                  Akun nonaktif tidak bisa digunakan untuk login.
                </p>
              </div>
              <Switch 
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) => setFormData({...formData, isActive: checked})}
              />
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Pengguna'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
