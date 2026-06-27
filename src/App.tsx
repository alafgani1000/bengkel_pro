import { useEffect } from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { AppShell } from './components/layout/AppShell';

// Lazy load pages later or import directly
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { WorkOrdersPage } from './pages/work-orders/WorkOrdersPage';
import { WorkOrderDetailPage } from './pages/work-orders/WorkOrderDetailPage';
import { KasirPage } from './pages/kasir/KasirPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { HelpPage } from './pages/help/HelpPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (savedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(savedTheme);
    }
  }, []);

  return (
    <MemoryRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Work Orders */}
          <Route path="work-orders" element={<WorkOrdersPage />} />
          <Route path="work-orders/:id" element={<WorkOrderDetailPage />} />
          
          {/* Kasir */}
          <Route path="kasir" element={<KasirPage />} />
          
          {/* Inventory */}
          <Route path="inventory" element={<InventoryPage />} />
          
          {/* Customers */}
          <Route path="customers" element={<CustomersPage />} />
          
          {/* Reports */}
          <Route path="reports" element={<ReportsPage />} />
          
          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />
          
          {/* Help */}
          <Route path="help" element={<HelpPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}
