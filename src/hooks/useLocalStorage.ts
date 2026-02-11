import { useState, useCallback } from 'react';

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Estado para almacenar nuestro valor
  // Pasa la función de inicialización a useState para que la lógica solo se ejecute una vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return una versión envuelta de la función setter de useState que ...
  // ... persiste el nuevo valor en localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((currentValue) => {
          // Permitir que el valor sea una función para tener la misma API que useState
          const valueToStore =
            value instanceof Function ? (value as (val: T) => T)(currentValue) : value;

          if (typeof window !== 'undefined') {
            const newValueJson = JSON.stringify(valueToStore);
            // Solo guardamos en localStorage si el JSON cambió, pero permitimos que el estado de React se actualice
            // para mantener la consistencia de referencias en la aplicación y romper ciclos de "Dirty state".
            if (JSON.stringify(currentValue) !== newValueJson) {
              window.localStorage.setItem(key, newValueJson);
            }
          }
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

export default useLocalStorage;
