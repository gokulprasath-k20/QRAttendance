'use client';

// @ts-nocheck
/* eslint-disable */
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  const Component = hover ? motion.div : 'div';
  
  const hoverProps = hover
    ? {
        whileHover: { y: -2, scale: 1.02 },
        transition: { duration: 0.2 },
      }
    : {};

  return (
    <Component
      className={cn(
        'bg-white rounded-xl shadow-md border border-gray-100 p-6',
        hover && 'cursor-pointer',
        className
      )}
      {...hoverProps}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  );
}
