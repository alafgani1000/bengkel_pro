import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { Activity, CreditCard, Users, Wrench } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: stats = { pendapatanHariIni: 0, spkAktif: 0, pelangganBaruBulanIni: 0 }, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      if (window.api && window.api.invoke) {
        return await window.api.invoke('reports:dashboard-stats', {});
      }
      return { pendapatanHariIni: 0, spkAktif: 0, pelangganBaruBulanIni: 0 };
    },
  });

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Selamat Datang, {user?.name || 'Admin'}!</h2>
        <p className="text-muted-foreground">Ini adalah ringkasan aktivitas bengkel hari ini.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : formatRupiah(stats.pendapatanHariIni)}</div>
            <p className="text-xs text-muted-foreground">Dari transaksi lunas hari ini</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SPK Aktif</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats.spkAktif}</div>
            <p className="text-xs text-muted-foreground">Antri / Dikerjakan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggan Baru</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : `+${stats.pelangganBaruBulanIni}`}</div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Waktu Servis</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2j 45m</div>
            <p className="text-xs text-muted-foreground">-15m dari minggu lalu</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview Pendapatan</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] w-full flex items-center justify-center border-2 border-dashed border-border rounded-md text-muted-foreground">
              [Recharts BarChart Placeholder]
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Aktivitas SPK Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {isLoading ? (
                <div className="text-center text-muted-foreground">Memuat aktivitas...</div>
              ) : stats.recentSPKs?.length > 0 ? (
                stats.recentSPKs.map((spk: any) => (
                  <div key={spk.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{spk.nomorSPK}</p>
                      <p className="text-sm text-muted-foreground">{spk.keluhan || '-'} | {spk.kendaraan?.platNomor}</p>
                    </div>
                    <div className="ml-auto font-medium text-blue-500">{spk.status}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">Belum ada aktivitas hari ini.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
