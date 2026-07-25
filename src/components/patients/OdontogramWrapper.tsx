'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { OdontogramProps } from 'react-odontogram';
import type { TypeDenture } from '@/components/seance-form/types';
import {
  fdiPermanentToDeciduous,
  mapToothIdToChild,
  mapToothIdToPermanent,
  mapTeethConditionsForChild,
  MAX_TEETH_CHILD,
} from '@/lib/odontogram';

const Odontogram = dynamic(() => import('react-odontogram'), { ssr: false });

export interface OdontogramWrapperProps extends OdontogramProps {
  typeDenture?: TypeDenture;
}

export default function OdontogramWrapper({ typeDenture, onChange, maxTeeth: maxTeethProp, defaultSelected: defaultSelectedProp, teethConditions: teethConditionsProp, ...props }: OdontogramWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isChild = typeDenture === 'ENFANT';

  useEffect(() => {
    if (!isChild) return;

    const SVG_WIDTH = 409;
    const SVG_HEIGHT = 694;
    const GAP_REDUCTION = 250;
    const NEW_HEIGHT = SVG_HEIGHT - GAP_REDUCTION;
    const TARGET_VIEWBOX = `0 0 ${SVG_WIDTH} ${NEW_HEIGHT}`;

    const patchChildOdontogram = () => {
      if (!containerRef.current) return;

      // 1. Patch text labels to child FDI notation
      containerRef.current.querySelectorAll('svg text').forEach((el) => {
        const text = el.textContent;
        if (text && /^\d{2}$/.test(text)) {
          const childLabel = fdiPermanentToDeciduous(text);
          if (childLabel !== text) {
            el.textContent = childLabel;
          }
        }
      });

      // 2. Reduce gap between upper and lower arches
      const svg = containerRef.current.querySelector('svg.Odontogram');
      if (!svg) return;

      if (svg.getAttribute('viewBox') !== TARGET_VIEWBOX) {
        svg.setAttribute('viewBox', TARGET_VIEWBOX);
      }

      const groups = svg.querySelectorAll(':scope > g');
      // groups[0] = upper right  — no change needed
      // groups[1] = upper left   — no change needed
      // groups[2] = lower right  — update translate to use NEW_HEIGHT
      // groups[3] = lower left   — update translate to use NEW_HEIGHT
      const lowerRightTransform = `scale(1, -1) translate(0, -${NEW_HEIGHT})`;
      const lowerLeftTransform = `scale(-1, -1) translate(-${SVG_WIDTH}, -${NEW_HEIGHT})`;

      if (groups[2] && groups[2].getAttribute('transform') !== lowerRightTransform) {
        groups[2].setAttribute('transform', lowerRightTransform);
      }
      if (groups[3] && groups[3].getAttribute('transform') !== lowerLeftTransform) {
        groups[3].setAttribute('transform', lowerLeftTransform);
      }
    };

    patchChildOdontogram();
    const node = containerRef.current;
    if (!node) return;
    const observer = new MutationObserver(patchChildOdontogram);
    observer.observe(node, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [isChild, teethConditionsProp, defaultSelectedProp]);

  const handleChange = useCallback(
    (selected: Array<{ id: string; notations: { fdi: string; universal: string; palmer: string }; type: string }>) => {
      setTimeout(() => {
        if (!isChild) {
          onChange?.(selected);
          return;
        }
        const mapped = selected.map((tooth) => ({
          ...tooth,
          id: mapToothIdToChild(tooth.id),
          notations: {
            ...tooth.notations,
            fdi: fdiPermanentToDeciduous(tooth.notations.fdi),
            universal: fdiPermanentToDeciduous(tooth.notations.universal),
            palmer: fdiPermanentToDeciduous(tooth.notations.palmer),
          },
        }));
        onChange?.(mapped);
      }, 0);
    },
    [isChild, onChange]
  );

  const patchedTooltip = React.useMemo(() => {
    if (!isChild) return props.tooltip;

    const originalContent = props.tooltip?.content;
    return {
      ...props.tooltip,
      content: (payload?: { id: string; notations: { fdi: string; universal: string; palmer: string }; type: string }) => {
        if (!payload) return null;
        const mappedPayload = {
          ...payload,
          id: mapToothIdToChild(payload.id),
          notations: {
            ...payload.notations,
            fdi: fdiPermanentToDeciduous(payload.notations?.fdi || ''),
            universal: fdiPermanentToDeciduous(payload.notations?.universal || ''),
            palmer: fdiPermanentToDeciduous(payload.notations?.palmer || ''),
          }
        };
        
        if (typeof originalContent === 'function') {
          return originalContent(mappedPayload);
        } else if (originalContent) {
          return originalContent;
        }

        return (
          <div style={{
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
             <div style={{ fontWeight: 'bold' }}>Dent {mappedPayload.notations.fdi}</div>
          </div>
        );
      }
    };
  }, [isChild, props.tooltip]);

  const defaultSelected = isChild && defaultSelectedProp
    ? defaultSelectedProp.map(mapToothIdToPermanent)
    : defaultSelectedProp;

  const teethConditions = isChild && teethConditionsProp
    ? mapTeethConditionsForChild(teethConditionsProp)
    : teethConditionsProp;

  const maxTeeth = isChild ? MAX_TEETH_CHILD : maxTeethProp;

  return (
    <div ref={containerRef}>
      <Odontogram
        {...props}
        defaultSelected={defaultSelected}
        teethConditions={teethConditions}
        maxTeeth={maxTeeth}
        onChange={handleChange}
        tooltip={patchedTooltip}
      />
    </div>
  );
}

