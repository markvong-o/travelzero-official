import React, { createContext } from 'react';
import { toast } from 'sonner';

export const ToastContext = createContext();

const TOAST_FNS = {
  success: toast.success,
  error: toast.error,
  warning: toast.warning,
  info: toast.info,
};

export function ToastProvider({ children }) {
  const showToast = (message, type = 'info', duration = 3000) => {
    const fn = TOAST_FNS[type] || toast.message;
    return fn(message, { duration });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
