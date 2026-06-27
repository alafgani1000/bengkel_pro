import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Database, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function MigrationDialog() {
  const [open, setOpen] = useState(false);
  const [pendingMigrations, setPendingMigrations] = useState<string[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cek migrasi ketika komponen dimuat
    const checkMigrations = async () => {
      try {
        const res = await window.api.invoke('migration:check');
        if (res.success && res.pendingMigrations && res.pendingMigrations.length > 0) {
          setPendingMigrations(res.pendingMigrations);
          setOpen(true);
        }
      } catch (err) {
        console.error('Failed to check migrations:', err);
      }
    };

    checkMigrations();
  }, []);

  const handleRunMigration = async () => {
    setIsMigrating(true);
    setError(null);
    try {
      const res = await window.api.invoke('migration:run', pendingMigrations);
      if (res.success) {
        setSuccess(true);
        // Tunggu sebentar lalu reload aplikasi untuk memuat database baru
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(res.error || 'Terjadi kesalahan saat memigrasi database.');
        setIsMigrating(false);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
      setIsMigrating(false);
    }
  };

  return (
    // onOpenChange={() => {}} ensures it can't be closed by clicking outside or pressing escape when it's forced open
    <Dialog open={open} onOpenChange={(val) => { if (!val) return; setOpen(val); }}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-full ${success ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
              {success ? <CheckCircle2 className="h-6 w-6" /> : <Database className="h-6 w-6" />}
            </div>
            <DialogTitle className="text-xl">
              {success ? 'Pembaruan Berhasil!' : 'Pembaruan Database Diperlukan'}
            </DialogTitle>
          </div>
          
          <DialogDescription className="text-base space-y-3">
            {success ? (
              <span className="block text-green-600 font-medium">
                Migrasi berhasil dijalankan. Aplikasi akan dimuat ulang dalam beberapa saat...
              </span>
            ) : (
              <>
                <span className="block">
                  Sistem mendeteksi adanya fitur baru yang membutuhkan penyesuaian struktur database lokal Anda.
                </span>
                <span className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md flex gap-2 text-sm">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                  <span>
                    Proses ini aman dan tidak akan menghapus data Anda yang sudah ada. Mohon jangan menutup aplikasi selama proses berlangsung.
                  </span>
                </span>
              </>
            )}
            
            {error && (
              <span className="block bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium border border-red-200">
                Gagal: {error}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {!success && (
          <DialogFooter className="mt-6 sm:justify-center">
            <Button 
              onClick={handleRunMigration} 
              disabled={isMigrating}
              className="w-full"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses Migrasi...
                </>
              ) : (
                'Mulai Pembaruan Sekarang'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
