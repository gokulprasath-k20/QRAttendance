import 'react';

declare global {
  namespace React {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      className?: string;
      onClick?: (event: React.MouseEvent<T>) => void;
    }
    
    interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
      onClick?: (event: React.MouseEvent<T>) => void;
      disabled?: boolean;
      type?: "button" | "submit" | "reset";
    }
    
    interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
      value?: string | number;
      onChange?: (event: React.ChangeEvent<T>) => void;
      disabled?: boolean;
    }
  }
}

// Fix for component props
declare module '@/components/ui/Button' {
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
    className?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  }
}

declare module '@/components/ui/Card' {
  interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
  }
}

declare module '@/components/ui/Select' {
  interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    options: { value: string | number; label: string }[];
    value?: string | number;
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  }
}

export {};
