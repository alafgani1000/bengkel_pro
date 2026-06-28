import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CreditCard, 
  Package, 
  Users, 
  BarChart2, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import logoUrl from '@/assets/logo.png';

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const { data: counts } = useQuery({
    queryKey: ['sidebar-counts'],
    queryFn: async () => {
      if (window.api && window.api.invoke) {
        return await window.api.invoke('sidebar:counts', {});
      }
      return { workOrders: 0, kasir: 0 };
    },
    refetchInterval: 5000, // Refetch every 5 seconds to keep sidebar badges fresh
  });

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/work-orders', icon: ClipboardList, label: 'Work Order / SPK', badge: counts?.workOrders > 0 ? String(counts.workOrders) : undefined },
    { to: '/kasir', icon: CreditCard, label: 'Kasir', badge: counts?.kasir > 0 ? String(counts.kasir) : undefined },
    { to: '/inventory', icon: Package, label: 'Inventori' },
    { to: '/customers', icon: Users, label: 'Pelanggan' },
    { to: '/reports', icon: BarChart2, label: 'Laporan' },
  ];

  return (
    <aside className={cn(
      "bg-background border-r border-border flex flex-col h-full shadow-sm relative z-10 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-60"
    )}>
      <div className={cn(
        "h-16 flex items-center border-b border-border transition-all",
        isCollapsed ? "justify-center px-2" : "justify-between px-6"
      )}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <img src={logoUrl} className="w-8 h-8 rounded-md object-cover border border-border shadow-sm" alt="Logo" />
            <span className="text-primary font-bold text-lg tracking-tight">Bengkel Pro</span>
          </div>
        ) : (
          <img src={logoUrl} className="w-8 h-8 rounded-md object-cover border border-border shadow-sm" alt="Logo" />
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleToggleCollapse} 
          className="h-8 w-8 hover:bg-muted"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <nav className={cn("flex-1 p-3 space-y-1 overflow-y-auto", isCollapsed ? "px-2" : "p-4")}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md text-sm font-medium transition-colors relative group',
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5',
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </div>
            {!isCollapsed && item.badge && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            {isCollapsed && item.badge && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background" />
            )}
            {/* Premium Tooltip for Collapsed State */}
            {isCollapsed && (
              <div className="absolute left-16 bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap border border-border">
                {item.label} {item.badge ? `(${item.badge})` : ''}
              </div>
            )}
          </NavLink>
        ))}

        <div className="my-4 border-t border-border" />

        <NavLink
          to="/help"
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-md text-sm font-medium transition-colors relative group mb-1',
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <BookOpen className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Panduan</span>}
          {isCollapsed && (
            <div className="absolute left-16 bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap border border-border">
              Panduan
            </div>
          )}
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-md text-sm font-medium transition-colors relative group',
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Pengaturan</span>}
          {isCollapsed && (
            <div className="absolute left-16 bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap border border-border">
              Pengaturan
            </div>
          )}
        </NavLink>
      </nav>

      <div className={cn("p-4 border-t border-border space-y-3 flex flex-col", isCollapsed ? "items-center px-2" : "")}>
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
            {user?.name.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          className={cn("w-full gap-2 text-muted-foreground relative group", isCollapsed ? "justify-center p-0 h-10 w-10" : "justify-start")} 
          onClick={logout}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Ganti User</span>}
          {isCollapsed && (
            <div className="absolute left-16 bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap border border-border">
              Ganti User
            </div>
          )}
        </Button>
      </div>
    </aside>
  );
}
