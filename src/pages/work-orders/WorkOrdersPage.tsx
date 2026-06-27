import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, ChevronRight, Car, User, Wrench, Clock, ArrowRightLeft } from 'lucide-react';
import { CreateSPKDialog } from './components/CreateSPKDialog';

const COLUMNS = ['ANTRI', 'DIKERJAKAN', 'MENUNGGU_PART', 'SELESAI', 'DIAMBIL'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  ANTRI:         { label: 'Antri',          color: 'text-slate-600',   bg: 'bg-slate-100 dark:bg-slate-800',    dot: 'bg-slate-400' },
  DIKERJAKAN:    { label: 'Dikerjakan',     color: 'text-blue-600',    bg: 'bg-blue-100 dark:bg-blue-900/40',   dot: 'bg-blue-500' },
  MENUNGGU_PART: { label: 'Tunggu Part',   color: 'text-orange-600',  bg: 'bg-orange-100 dark:bg-orange-900/40', dot: 'bg-orange-500' },
  SELESAI:       { label: 'Selesai',        color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40', dot: 'bg-emerald-500' },
  DIAMBIL:       { label: 'Diambil',        color: 'text-gray-500',    bg: 'bg-gray-100 dark:bg-gray-800',      dot: 'bg-gray-400' },
};

const NEXT_STATUS: Record<string, string | null> = {
  ANTRI:         'DIKERJAKAN',
  DIKERJAKAN:    'SELESAI',
  MENUNGGU_PART: 'DIKERJAKAN',
  SELESAI:       'DIAMBIL',
  DIAMBIL:       null,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}h lalu`;
  if (h > 0) return `${h}j ${m}m lalu`;
  return `${m}m lalu`;
}

export function WorkOrdersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem('work_orders_active_tab') || 'ANTRI';
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('work_orders_active_tab', tab);
  };
  const [search, setSearch] = useState('');

  const { data: workOrders = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: async () => {
      if (window.api && window.api.invoke) {
        return await window.api.invoke('work-order:list', {});
      }
      return [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await window.api.invoke('work-order:update-status', { id, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });

  // Filter by tab & search
  const filtered = workOrders.filter((w: any) => {
    const matchStatus = activeTab === 'SEMUA' || w.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch = !q
      || w.nomorSPK?.toLowerCase().includes(q)
      || w.customer?.name?.toLowerCase().includes(q)
      || w.kendaraan?.platNomor?.toLowerCase().includes(q)
      || w.keluhan?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const countByStatus = (s: string) =>
    workOrders.filter((w: any) => w.status === s).length;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Work Order (SPK)</h2>
          <p className="text-muted-foreground text-sm">Kelola antrian servis dan perbaikan kendaraan.</p>
        </div>
        <CreateSPKDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['workOrders'] })} />
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari SPK, pelanggan, plat nomor..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABS */}
      <div className="flex gap-1 flex-wrap border-b border-border pb-0">
        {COLUMNS.map((col) => {
          const cfg = STATUS_CONFIG[col];
          const count = countByStatus(col);
          return (
            <button
              key={col}
              onClick={() => setActiveTab(col)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === col
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
              {count > 0 && (
                <span className="text-xs bg-muted rounded-full px-1.5 py-0.5">{count}</span>
              )}
            </button>
          );
        })}

        {/* SEMUA tab at the end */}
        <button
          onClick={() => setActiveTab('SEMUA')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-all border-b-2 -mb-px ${
            activeTab === 'SEMUA'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          Semua
          <span className="ml-2 text-xs bg-muted rounded-full px-1.5 py-0.5">{workOrders.length}</span>
        </button>
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Wrench className="w-10 h-10 mb-2 opacity-30" />
            <p className="font-medium">Tidak ada SPK ditemukan</p>
            <p className="text-sm mt-1">
              {search ? 'Coba kata kunci lain' : 'Buat SPK baru untuk memulai'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-4">
            {filtered.map((item: any) => {
              const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.ANTRI;
              const nextStatus = NEXT_STATUS[item.status];
              const nextCfg = nextStatus ? STATUS_CONFIG[nextStatus] : null;

              return (
                <Card
                  key={item.id}
                  className="group border border-border hover:border-primary/60 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/work-orders/${item.id}`)}
                >
                  {/* Status stripe */}
                  <div className={`h-1 w-full ${cfg.dot}`} />

                  <CardContent className="p-4 space-y-3">
                    {/* TOP ROW */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{item.nomorSPK}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* CUSTOMER */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold text-sm truncate">
                          {item.customer?.name || item.customer?.nama || 'Pelanggan Tidak Dikenal'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">
                          {item.kendaraan?.platNomor}
                          {item.kendaraan?.merek ? ` · ${item.kendaraan.merek} ${item.kendaraan.model ?? ''}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* KELUHAN */}
                    {item.keluhan && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 leading-relaxed line-clamp-2">
                        {item.keluhan}
                      </p>
                    )}

                    {/* BOTTOM ROW */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(item.createdAt)}</span>
                      </div>

                      {/* Quick action buttons */}
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {nextStatus && nextCfg && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-7 text-xs gap-1 bg-background border-current ${nextCfg.color} hover:!${nextCfg.bg} hover:!${nextCfg.color}`}
                            disabled={updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: item.id, status: nextStatus })}
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            → {nextCfg.label}
                          </Button>
                        )}

                        {/* All status change via dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {COLUMNS.filter((c) => c !== item.status).map((c) => (
                              <DropdownMenuItem
                                key={c}
                                onClick={() => updateStatusMutation.mutate({ id: item.id, status: c })}
                              >
                                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[c].dot} mr-2`} />
                                Pindah ke {STATUS_CONFIG[c].label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
