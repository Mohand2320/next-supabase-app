const PERMANENT_TO_DECIDUOUS_QUADRANT: Record<string, string> = {
  '1': '5',
  '2': '6',
  '3': '8',
  '4': '7',
};

const DECIDUOUS_TO_PERMANENT_QUADRANT: Record<string, string> = {
  '5': '1',
  '6': '2',
  '7': '4',
  '8': '3',
};

export const MAX_TEETH_CHILD = 5;
export const MAX_TEETH_ADULT = 8;

export function fdiPermanentToDeciduous(fdi: string): string {
  if (fdi.length < 2) return fdi;
  const quad = fdi[0];
  const tooth = fdi[1];
  const childQuad = PERMANENT_TO_DECIDUOUS_QUADRANT[quad];
  if (!childQuad) return fdi;
  return `${childQuad}${tooth}`;
}

export function fdiDeciduousToPermanent(fdi: string): string {
  if (fdi.length < 2) return fdi;
  const quad = fdi[0];
  const tooth = fdi[1];
  const permQuad = DECIDUOUS_TO_PERMANENT_QUADRANT[quad];
  if (!permQuad) return fdi;
  return `${permQuad}${tooth}`;
}

export function mapToothIdToChild(id: string): string {
  const match = id.match(/^teeth-(\d{2})$/);
  if (!match) return id;
  const fdi = match[1];
  const childFdi = fdiPermanentToDeciduous(fdi);
  if (childFdi === fdi) return id;
  return `teeth-${childFdi}`;
}

export function mapToothIdToPermanent(id: string): string {
  const match = id.match(/^teeth-(\d{2})$/);
  if (!match) return id;
  const fdi = match[1];
  const permFdi = fdiDeciduousToPermanent(fdi);
  if (permFdi === fdi) return id;
  return `teeth-${permFdi}`;
}

export function mapTeethConditionsForChild(
  conditions: { label: string; teeth: string[]; outlineColor: string; fillColor: string }[]
): { label: string; teeth: string[]; outlineColor: string; fillColor: string }[] {
  return conditions.map((c) => ({
    ...c,
    teeth: c.teeth.map(mapToothIdToPermanent),
  }));
}

export function mapTeethConditionsForPermanent(
  conditions: { label: string; teeth: string[]; outlineColor: string; fillColor: string }[]
): { label: string; teeth: string[]; outlineColor: string; fillColor: string }[] {
  return conditions.map((c) => ({
    ...c,
    teeth: c.teeth.map(mapToothIdToChild),
  }));
}

export function isChildFDI(fdi: string): boolean {
  if (fdi.length < 2) return false;
  const q = parseInt(fdi[0], 10);
  return q >= 5 && q <= 8;
}

export function isChildToothId(id: string): boolean {
  const match = id.match(/^teeth-(\d{2})$/);
  if (!match) return false;
  return isChildFDI(match[1]);
}
