import type { LocalizedString } from "./types";

export function localized(value: LocalizedString | undefined): string | null {
  return value?.pl || value?.en || null;
}

export function groupKey(unitId: string, groupNumber: number): string {
  return JSON.stringify([unitId, groupNumber]);
}
