import { useCallback, useEffect, useState } from "react";

interface ToastItemData {
  id: number;
  message: string;
}

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

function ToastBubble({ message, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`px-5 py-3 rounded-[var(--radius-ctrl)] bg-[var(--color-ink)] text-[var(--color-paper)] text-sm font-body shadow-lg transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {message}
    </div>
  );
}

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItemData[]>([]);

  const showToast = useCallback((message: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Return just the data; render container in the component
  return { showToast, toasts, dismiss };
}

interface ToastContainerProps {
  toasts: ToastItemData[];
  dismiss: (id: number) => void;
}

export function ToastContainer({ toasts = [], dismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      {(toasts ?? []).slice(-2).map((t) => (
        <ToastBubble key={t.id} message={t.message} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
