import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './index.css';
import { AppLayout } from './components/AppLayout';
import { Constitution } from './pages/Constitution';
import { ProposeLaw } from './pages/ProposeLaw';
import { ConflictChecker } from './pages/ConflictChecker';
import { AuditLog } from './pages/AuditLog';
import { HealthReport } from './pages/HealthReport';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Constitution />} />
            <Route path="/propose" element={<ProposeLaw />} />
            <Route path="/check" element={<ConflictChecker />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/health" element={<HealthReport />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" position="bottom-right" richColors />
    </QueryClientProvider>
  </StrictMode>,
);
