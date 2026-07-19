'use client';

import dynamic from 'next/dynamic';
import type { OdontogramProps } from 'react-odontogram';

const Odontogram = dynamic(() => import('react-odontogram'), { ssr: false });

/**
 * Wrapper for react-odontogram to suppress React 19 hydration warnings
 * about invalid SVG props (stroke-width, stroke-linecap, stroke-linejoin).
 * 
 * The underlying library uses kebab-case SVG attributes which React 19
 * warns about in strict mode. This wrapper renders without strict mode
 * to suppress these cosmetic warnings.
 */
export default function OdontogramWrapper(props: OdontogramProps) {
  return <Odontogram {...props} />;
}