'use client';

import dynamic from 'next/dynamic';
import type { OdontogramProps } from 'react-odontogram';

const Odontogram = dynamic(() => import('react-odontogram'), { ssr: false });

/**
 * Wrapper for react-odontogram to suppress React 19 hydration warnings.
 * 
 * The underlying library triggers hydration mismatches or strict mode warnings
 * with React 19. This dynamic wrapper renders without SSR to bypass these issues.
 */
export default function OdontogramWrapper(props: OdontogramProps) {
  return <Odontogram {...props} />;
}