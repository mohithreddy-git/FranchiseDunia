'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HoverLiftProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  yOffset?: number;
}

export default function HoverLift({
  children,
  className,
  yOffset = -4,
  ...props
}: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{ y: yOffset }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn('h-full', className)}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
