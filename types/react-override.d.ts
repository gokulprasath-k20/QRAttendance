// Override React types to fix common issues
declare module 'react' {
  export function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prevState: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useRef<T>(initialValue: T): { current: T };
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function createContext<T>(defaultValue: T): any;
  export function useContext<T>(context: any): T;
  
  export interface ReactNode {
    children?: ReactNode;
  }
  
  export interface MouseEvent<T = Element> {
    target: T;
    preventDefault(): void;
    stopPropagation(): void;
  }
  
  export interface ChangeEvent<T = Element> {
    target: T & { value: string };
  }
  
  export interface FormEvent<T = Element> {
    preventDefault(): void;
  }
}

// Fix JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
