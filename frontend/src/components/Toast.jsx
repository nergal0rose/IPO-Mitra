import { useState, useCallback, useMemo, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast Notification System — Design spec:
 * Position: top-right, 16px from edges. Max width: 360px. Stack max 3.
 * Variants: success/error/warning/info with left border 3px solid.
 * Auto-dismiss: 5s (errors stay). Entry: slide from right 200ms. Exit: slide out 150ms.
 */

const ToastContext = createContext(null);

const variantConfig = {
  success: { border: 'border-l-[var(--status-success)]', icon: CheckCircle, iconColor: 'text-[var(--status-success)]' },
  error:   { border: 'border-l-[var(--status-error)]', icon: XCircle,    iconColor: 'text-[var(--status-error)]' },
  warning: { border: 'border-l-[var(--status-warning)]', icon: AlertTriangle, iconColor: 'text-[var(--status-warning)]' },
  info:    { border: 'border-l-[#3B82F6]', icon: Info,        iconColor: 'text-[#3B82F6]' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 150);
  }, []);

  const addToast = useCallback((message, variant = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, message, variant, exiting: false }]);
    // Auto-dismiss (errors stay until manually dismissed)
    if (variant !== 'error') {
      setTimeout(() => dismissToast(id), 5000);
    }
  }, [dismissToast]);

  const toast = useMemo(() => ({
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info:    (msg) => addToast(msg, 'info'),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container — top-right, 16px from edges */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-[360px] w-full pointer-events-none">
        {toasts.map(t => {
          const cfg = variantConfig[t.variant] || variantConfig.info;
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border-l-[3px] ${cfg.border} bg-white shadow-lg shadow-black/30 transition-all duration-200 ${
                t.exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0 animate-[slideInRight_200ms_ease-out]'
              }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
              <p className="text-sm text-[var(--text-primary)] flex-1">{t.message}</p>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if used outside provider
    return {
      success: (msg) => console.log('[Toast Success]', msg),
      error: (msg) => console.error('[Toast Error]', msg),
      warning: (msg) => console.warn('[Toast Warning]', msg),
      info: (msg) => console.log('[Toast Info]', msg),
    };
  }
  return ctx;
}
