import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

export function CreateSPKDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    platNomor: '',
    merk: '',
    tipe: '',
    keluhan: '',
  });

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await window.api.invoke('work-order:create', formData);
      onSuccess?.();
      setOpen(false);
      setStep(1);
      setFormData({
        customerName: '',
        customerPhone: '',
        platNomor: '',
        merk: '',
        tipe: '',
        keluhan: '',
      });
    } catch (error: any) {
      console.error(error);
      alert('Gagal membuat SPK: ' + (error.message || 'Error tidak diketahui'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Buat SPK Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buat Work Order (SPK) Baru</DialogTitle>
          <DialogDescription>
            Langkah {step} dari 3
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          <div className="grid gap-4 py-4">
            {step === 1 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium border-b pb-2">Data Pelanggan</h4>
                <div className="grid gap-2">
                  <Label htmlFor="customerName">Nama Pelanggan</Label>
                  <Input 
                    id="customerName" 
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customerPhone">No. WhatsApp</Label>
                  <Input 
                    id="customerPhone" 
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium border-b pb-2">Data Kendaraan</h4>
                <div className="grid gap-2">
                  <Label htmlFor="platNomor">Plat Nomor</Label>
                  <Input 
                    id="platNomor" 
                    value={formData.platNomor}
                    onChange={(e) => setFormData({ ...formData, platNomor: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="merk">Merk</Label>
                    <Input 
                      id="merk" 
                      value={formData.merk}
                      onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tipe">Tipe</Label>
                    <Input 
                      id="tipe" 
                      value={formData.tipe}
                      onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium border-b pb-2">Keluhan & Catatan</h4>
                <div className="grid gap-2">
                  <Label htmlFor="keluhan">Keluhan Pelanggan</Label>
                  <Textarea 
                    id="keluhan" 
                    rows={4}
                    value={formData.keluhan}
                    onChange={(e) => setFormData({ ...formData, keluhan: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-4">
            <Button type="button" variant="outline" onClick={handlePrev} disabled={step === 1}>
              Kembali
            </Button>
            <Button type="submit">
              {step === 3 ? 'Simpan SPK' : 'Selanjutnya'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
