import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';

import Dashboard from '@/pages/Dashboard';
import Partners from '@/pages/Partners';
import RiskEngine from '@/pages/RiskEngine';
import PolicyCatalogPage from '@/pages/PolicyCatalog';
import Policies from '@/pages/Policies';
import Claims from '@/pages/Claims';
import Insurers from '@/pages/Insurers';
import BrokerAssistant from '@/pages/BrokerAssistant';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin"></div>
          <span className="text-xs text-muted-foreground font-mono">Loading CoverLayer…</span>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    else if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/risk-engine" element={<RiskEngine />} />
        <Route path="/policy-catalog" element={<PolicyCatalogPage />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/claims" element={<Claims />} />
        <Route path="/insurers" element={<Insurers />} />
        <Route path="/assistant" element={<BrokerAssistant />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
