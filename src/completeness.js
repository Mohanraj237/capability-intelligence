// Completeness levels (POC proposal from the Spikes 1-3 research). The schema mandates only the
// facts every sampled source supplies; above that, it defines cumulative levels in its
// x-completenessLevels annotation (discoverable, assessable, adoptable, governed). The validator
// reports the highest level a structurally valid manifest reaches and the facts each higher level
// still needs. Levels are not enforced unless a caller requires one (validate --require-level).

export const NO_LEVEL = 'none';

export function levelsOf(schema) {
  return schema?.['x-completenessLevels'] ?? null;
}

/**
 * @returns {{ level: string, unmet: Record<string, string[]> } | null}
 *   level: the highest level whose requirements, and those of every lower level, are met ('none'
 *   when not even the first level is met); unmet: per level, the facts of that level not yet
 *   stated. null when the schema defines no levels.
 */
export function assessCompleteness(manifest, schema) {
  const levels = levelsOf(schema);
  if (!levels) return null;
  const unmet = Object.fromEntries(
    levels.map(({ level, requires }) => [level, requires.filter((requirement) => !isStated(manifest, requirement)).map((requirement) => requirement.fact)]),
  );
  let level = NO_LEVEL;
  for (const entry of levels) {
    if (unmet[entry.level].length > 0) break;
    level = entry.level;
  }
  return { level, unmet };
}

// 0 for 'none', then 1, 2, ... in the order the schema lists the levels; -1 for an unknown level.
export function levelRank(levels, level) {
  if (level === NO_LEVEL) return 0;
  const index = levels.findIndex((entry) => entry.level === level);
  return index < 0 ? -1 : index + 1;
}

// The levels above `level`, up to and including `target` (or the highest level).
export function levelsAbove(levels, level, target) {
  const from = levelRank(levels, level);
  const to = target ? levelRank(levels, target) : levels.length;
  return levels.slice(from, to).map((entry) => entry.level);
}

// A requirement is stated when any of its fields has a value. An explicit empty list counts:
// it declares "none" (no setup needed, no known limitations). Values listed in `excluding`
// assert nothing (riskTier 'unassessed') and do not count.
function isStated(manifest, { anyOf, excluding = [] }) {
  return anyOf.some((path) => valuesAt(manifest, path).some((value) => !excluding.includes(value)));
}

// Values at a field path such as "owner.contact" or "publications[].nativeVersion" ([] marks list
// items); missing values are skipped.
export function valuesAt(manifest, path) {
  return path.split('.').reduce((values, part) => {
    const key = part.replace(/\[\]$/, '');
    const next = values.map((value) => value?.[key]).filter((value) => value !== undefined);
    return part.endsWith('[]') ? next.flat() : next;
  }, [manifest]);
}
