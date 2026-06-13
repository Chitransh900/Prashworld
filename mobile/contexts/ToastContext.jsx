import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSize } from '../utils/theme';

const ToastContext = createContext({});

const TOAST_DURATION = 3000;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const insets = useSafeAreaInsets();

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  };

  const getToastColor = (type) => {
    switch (type) {
      case 'success': return colors.primary[500];
      case 'error': return colors.semantic.error;
      case 'warning': return colors.accent[500];
      default: return colors.semantic.info;
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toasts.map((t) => (
        <Animated.View
          key={t.id}
          style={[
            styles.toast,
            { backgroundColor: getToastColor(t.type), top: insets.top + spacing[2] },
          ]}
        >
          <Text style={styles.toastText}>{t.message}</Text>
        </Animated.View>
      ))}
    </ToastContext.Provider>
  );
};

/** @returns {any} */
export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
