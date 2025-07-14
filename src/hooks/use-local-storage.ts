
"use client";

import { useState, useEffect, useMemo } from 'react';

// This function safely parses JSON from a string.
// It returns the initial value if parsing fails.
function safeJSONParse<T>(jsonString: string, initialValue: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // useMemo ensures that the initialValue from localStorage is read only once.
  const storedValue = useMemo(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    const item = localStorage.getItem(key);
    return item ? safeJSONParse(item, initialValue) : initialValue;
  }, [key, initialValue]);

  const [value, setValue] = useState<T>(storedValue);

  // This effect runs only when the value changes, updating localStorage.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}
