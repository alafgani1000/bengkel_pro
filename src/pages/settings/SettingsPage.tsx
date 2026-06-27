import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Database, Download, Upload, Save, Moon, Sun, Monitor, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState('system');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; msg: string } | null>(null);
  
  // Profil form state (termasuk rekening bank)
  const [bengkelData, setBengkelData] = useState({
    nama: '',
    alamat: '',
    kota: '',
    telepon: '',
    email: '',
    jamBuka: '',
    jamTutup: '',
    namaBankRekening: '',
    nomorRekening: ''
  });

  const { data: bengkel } = useQuery({
    queryKey: ['settings-bengkel'],
    queryFn: async () => {
      if (window.api && window.api.invoke) {
        return await window.api.invoke('settings:get-bengkel');
      }
      return null;
    }
  });

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (bengkel) {
      setBengkelData({
        nama: bengkel.nama || '',
        alamat: bengkel.alamat || '',
        kota: bengkel.kota || '',
        telepon: bengkel.telepon || '',
        email: bengkel.email || '',
        jamBuka: bengkel.jamBuka || '',
        jamTutup: bengkel.jamTutup || '',
        namaBankRekening: bengkel.namaBankRekening || '',
        nomorRekening: bengkel.nomorRekening || ''
      });
    }
  }, [bengkel]);

  const updateBengkelMutation = useMutation({
    mutationFn: async (data: any) => {
      return await window.api.invoke('settings:update-bengkel', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-bengkel'] });
      setSaveStatus('Profil bengkel berhasil disimpan!');
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: (err: any) => {
      setSaveStatus('Gagal menyimpan profil: ' + err.message);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  });

  const backupMutation = useMutation({
    mutationFn: async () => {
      if (window.api && window.api.invoke) {
        return await window.api.invoke('settings:backup-db');
      }
      return { success: false, error: 'API not available' };
    },
    onSuccess: (res: any) => {
      if (res.canceled) {
        setBackupStatus(null);
        return;
      }
      if (res.success) {
        setBackupStatus({ success: true, msg: 'Backup berhasil disimpan di: ' + res.path });
      } else {
        setBackupStatus({ success: false, msg: `Gagal backup: ${res.error}` });
      }
    },
    onError: (err: any) => {
      setBackupStatus({ success: false, msg: `Terjadi kesalahan: ${err.message}` });
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (window.api && window.api.invoke) {
        return await window.api.invoke('settings:restore-db');
      }
      throw new Error('IPC not available');
    },
    onSuccess: (res: any) => {
      if (res.canceled) {
        setRestoreStatus(null);
        return;
      }
      if (res.success) {
        setRestoreStatus({ success: true, msg: 'Restore berhasil! Aplikasi akan direstart otomatis dalam 2 detik...' });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setRestoreStatus({ success: false, msg: `Gagal restore: ${res.error}` });
      }
    },
    onError: (err: any) => {
      setRestoreStatus({ success: false, msg: `Terjadi kesalahan: ${err.message}` });
    }
  });

  const handleThemeChange = (t: string) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (t === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(t);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-4xl pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pengaturan</h2>
        <p className="text-muted-foreground">Kelola preferensi sistem, data bengkel, dan backup database.</p>
      </div>

      <div className="grid gap-6">
        {/* PROFIL BENGKEL */}
        <Card>
          <CardHeader>
            <CardTitle>Profil Bengkel</CardTitle>
            <CardDescription>Informasi ini akan ditampilkan pada nota dan laporan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nama">Nama Bengkel</Label>
                <Input id="nama" value={bengkelData.nama} onChange={(e) => setBengkelData({...bengkelData, nama: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telepon">Nomor Telepon</Label>
                <Input id="telepon" value={bengkelData.telepon} onChange={(e) => setBengkelData({...bengkelData, telepon: e.target.value})} />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="alamat">Alamat Lengkap</Label>
              <Input id="alamat" value={bengkelData.alamat} onChange={(e) => setBengkelData({...bengkelData, alamat: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kota">Kota</Label>
                <Input id="kota" value={bengkelData.kota} onChange={(e) => setBengkelData({...bengkelData, kota: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={bengkelData.email} onChange={(e) => setBengkelData({...bengkelData, email: e.target.value})} />
              </div>
            </div>

            {/* BANK ACCOUNT INFO */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4 border-dashed border-border/80">
              <div className="grid gap-2">
                <Label htmlFor="namaBankRekening">Nama Bank Rekening (Transfer)</Label>
                <Input id="namaBankRekening" placeholder="Contoh: BCA, Mandiri, BRI" value={bengkelData.namaBankRekening} onChange={(e) => setBengkelData({...bengkelData, namaBankRekening: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nomorRekening">Nomor Rekening</Label>
                <Input id="nomorRekening" placeholder="Contoh: 1234567890" value={bengkelData.nomorRekening} onChange={(e) => setBengkelData({...bengkelData, nomorRekening: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 border-dashed border-border/80">
              <div className="grid gap-2">
                <Label htmlFor="jamBuka">Jam Buka (HH:MM)</Label>
                <Input id="jamBuka" placeholder="08:00" value={bengkelData.jamBuka} onChange={(e) => setBengkelData({...bengkelData, jamBuka: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jamTutup">Jam Tutup (HH:MM)</Label>
                <Input id="jamTutup" placeholder="17:00" value={bengkelData.jamTutup} onChange={(e) => setBengkelData({...bengkelData, jamTutup: e.target.value})} />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-2">
              <Button 
                className="gap-2" 
                onClick={() => updateBengkelMutation.mutate(bengkelData)}
                disabled={updateBengkelMutation.isPending}
              >
                <Save className="w-4 h-4" /> 
                {updateBengkelMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
              {saveStatus && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 animate-in fade-in duration-200">
                  <CheckCircle className="w-4 h-4" />
                  {saveStatus}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TAMPILAN (TEMA) */}
        <Card>
          <CardHeader>
            <CardTitle>Tampilan</CardTitle>
            <CardDescription>Sesuaikan tema aplikasi sesuai kenyamanan Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                variant={theme === 'light' ? 'default' : 'outline'} 
                className="gap-2" 
                onClick={() => handleThemeChange('light')}
              >
                <Sun className="w-4 h-4" /> Terang
              </Button>
              <Button 
                variant={theme === 'dark' ? 'default' : 'outline'} 
                className="gap-2" 
                onClick={() => handleThemeChange('dark')}
              >
                <Moon className="w-4 h-4" /> Gelap
              </Button>
              <Button 
                variant={theme === 'system' ? 'default' : 'outline'} 
                className="gap-2" 
                onClick={() => handleThemeChange('system')}
              >
                <Monitor className="w-4 h-4" /> Sistem
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DATABASE & BACKUP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" /> Database & Backup
            </CardTitle>
            <CardDescription>Amankan data bengkel Anda secara berkala.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sangat disarankan untuk melakukan backup database (Data pelanggan, SPK, Inventori) setiap minggu.
              Data akan disimpan di folder lokal Anda.
            </p>
            <div className="flex flex-col gap-2 items-start">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => backupMutation.mutate()}
                  disabled={backupMutation.isPending || restoreMutation.isPending}
                >
                  <Download className="w-4 h-4" /> 
                  {backupMutation.isPending ? 'Mencadangkan...' : 'Backup Database'}
                </Button>
                
                <Button 
                  variant="destructive" 
                  className="gap-2"
                  onClick={() => {
                    if (confirm('PERINGATAN: Database saat ini akan tertimpa sepenuhnya oleh file backup. Aplikasi akan ditutup dan direstart secara otomatis.\n\nApakah Anda yakin ingin melanjutkan?')) {
                      restoreMutation.mutate();
                    }
                  }}
                  disabled={backupMutation.isPending || restoreMutation.isPending}
                >
                  <Upload className="w-4 h-4" /> 
                  {restoreMutation.isPending ? 'Memulihkan...' : 'Restore Database'}
                </Button>
              </div>

              {backupStatus && (
                <div className={`flex items-start gap-1.5 text-sm font-medium mt-2 p-2 rounded border animate-in fade-in duration-200 ${
                  backupStatus.success 
                    ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" 
                    : "text-destructive bg-destructive/10 border-destructive/20"
                }`}>
                  {backupStatus.success ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <span>{backupStatus.msg}</span>
                </div>
              )}

              {restoreStatus && (
                <div className={`flex items-start gap-1.5 text-sm font-medium mt-2 p-2 rounded border animate-in fade-in duration-200 ${
                  restoreStatus.success 
                    ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" 
                    : "text-destructive bg-destructive/10 border-destructive/20"
                }`}>
                  {restoreStatus.success ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <span>{restoreStatus.msg}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
