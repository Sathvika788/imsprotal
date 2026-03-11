import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#1f2937',
                color: '#f3f4f6',
                border: '1px solid #374151',
                borderRadius: '8px',
              },
              success: {
                style: {
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                },
              },
              error: {
                style: {
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                },
              },
            }}
          />
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
