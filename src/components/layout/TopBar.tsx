import { Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';

export function TopBar() {
  const location = useLocation();
  
  // Basic breadcrumb generation
  const pathnames = location.pathname.split('/').filter((x) => x);
  const title = pathnames.length > 0 
    ? pathnames[0].charAt(0).toUpperCase() + pathnames[0].slice(1).replace('-', ' ') 
    : 'Dashboard';

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 shadow-sm z-10 relative">
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end">
        <div className="relative w-64 max-w-sm hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Cari (Ctrl+K)..." 
            className="pl-9 bg-muted/50 focus-visible:bg-background transition-colors" 
          />
        </div>
        
        <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
        </button>
      </div>
    </header>
  );
}
