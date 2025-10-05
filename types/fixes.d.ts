// Comprehensive TypeScript fixes for the QR Attendance Management System

declare module 'react' {
  // Fix React hooks
  export function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prevState: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useRef<T>(initialValue: T): { current: T };
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function createContext<T>(defaultValue: T): any;
  export function useContext<T>(context: any): T;
  
  // Fix React types
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
  
  // Fix HTML attributes
  export interface HTMLAttributes<T> {
    className?: string;
    onClick?: (event: MouseEvent<T>) => void;
    children?: ReactNode;
  }
  
  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }
  
  export interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: string | number;
    onChange?: (event: ChangeEvent<T>) => void;
    disabled?: boolean;
  }
  
  // Fix component type
  export type ComponentType<P = {}> = (props: P) => ReactNode;
}

// Fix JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    
    interface Element {
      type: any;
      props: any;
      key: any;
    }
  }
}

// Fix auth context types
declare module '@/lib/auth' {
  export interface AuthContextType {
    user: any;
    loading: boolean;
    login: (email: string, password: string, role: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (data: any, role: string) => Promise<void>;
  }
  
  export function useAuth(): AuthContextType;
}

export {};
