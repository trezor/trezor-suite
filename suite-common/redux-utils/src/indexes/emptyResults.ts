import { type EntityIndexChanges } from './entityIndexTypes';

/**
 * One instance each, so a read that finds nothing hands back what the last one did: a consumer
 * comparing by reference sees no change rather than an empty array it has never seen before.
 */
export const EMPTY_ENTITY_IDS: readonly never[] = [];

export const EMPTY_ENTITIES: readonly never[] = [];

export const NO_CHANGES: EntityIndexChanges<never> = { added: [], removed: [], updated: [] };
