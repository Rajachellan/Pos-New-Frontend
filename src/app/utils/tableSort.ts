/**
 * Natural sort helper for dining tables by table number / name.
 * Correctly orders tables numerically:
 * T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13...
 * rather than alphabetical/lexicographical (T1, T10, T11, T12, T13, T2, T3...).
 */
export function sortTablesNaturally<T extends Record<string, any>>(tables: T[]): T[] {
  if (!Array.isArray(tables)) return [];
  return [...tables].sort((a, b) => {
    const strA = (a?.tableNumber || a?.tableName || '').toString().trim();
    const strB = (b?.tableNumber || b?.tableName || '').toString().trim();

    const matchA = strA.match(/\d+/);
    const matchB = strB.match(/\d+/);

    if (matchA && matchB) {
      // Compare prefix (letters before the number, ignoring non-alphanumerics like '-')
      const prefixA = strA.slice(0, matchA.index).replace(/[^a-zA-Z]/g, '').toLowerCase();
      const prefixB = strB.slice(0, matchB.index).replace(/[^a-zA-Z]/g, '').toLowerCase();

      if (prefixA !== prefixB) {
        return prefixA.localeCompare(prefixB);
      }

      const numA = parseInt(matchA[0], 10);
      const numB = parseInt(matchB[0], 10);

      if (numA !== numB) {
        return numA - numB;
      }
    }

    return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
  });
}
