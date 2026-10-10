import { createTransport } from './usosFetch';
import { localized } from './utils';
import type { LocalizedString } from './types';

export interface Programme { id: string; name: string }
export const defaultProgramme: Programme = {
  id: 'SIAu-SI7', name: 'Sztuczna inteligencja, stacjonarne I stopnia inżynierskie 7 sem.',
};
const transport = createTransport();
export async function searchProgrammes(query: string) {
  const result = await transport.get<{
    items: { programme: { id: string; name: LocalizedString } }[]; next_page: boolean;
  }>('progs/search', { lang: 'pl', query: query.trim(), num: '20',
    fields: 'items[programme[id|name]]|next_page',
  }, 24 * 60 * 60 * 1000);
  return {
    programmes: result.data.items.map(({ programme }) => ({
      id: programme.id, name: localized(programme.name) ?? programme.id,
    })), more: result.data.next_page,
  };
}
/** Common POLSL convention; editable because not all programmes use it. */
export function suggestPrefix(programmeId: string, semester: number) {
  const match = /^(.+)-([A-Z]+)\d+$/.exec(programmeId);
  return match ? `${match[1]}>${match[2]}${semester}` : '';
}
