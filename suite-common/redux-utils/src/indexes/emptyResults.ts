import {
    type AnySecondaryKey,
    type EntityId,
    type EntityIndexChanges,
    type EntityIndexSnapshot,
    type SecondaryIndexEntry,
} from './entityIndexTypes';

/**
 * One instance each, so a read that finds nothing hands back what the last one did: a consumer
 * comparing by reference sees no change rather than an empty array it has never seen before.
 */
export const EMPTY_ENTITY_IDS: readonly never[] = [];

export const EMPTY_ENTITIES: readonly never[] = [];

export const NO_CHANGES: EntityIndexChanges<never> = { added: [], removed: [], updated: [] };

const EMPTY_ENTITIES_BY_ID: ReadonlyMap<EntityId, never> = new Map<EntityId, never>();

const EMPTY_SECONDARY_INDEX: ReadonlyMap<
    AnySecondaryKey,
    SecondaryIndexEntry<never, EntityId>
> = new Map<AnySecondaryKey, SecondaryIndexEntry<never, EntityId>>();

/**
 * What an index that has never held anything answers — and one of these will do for every such
 * index, since what it is over is what it does not have.
 */
export const EMPTY_SNAPSHOT = {
    getIds: () => EMPTY_ENTITY_IDS,
    getEntitiesById: () => EMPTY_ENTITIES_BY_ID,
    getSecondaryIndex: () => EMPTY_SECONDARY_INDEX,
    getChanges: () => NO_CHANGES,
} as unknown as EntityIndexSnapshot<never, EntityId, Record<string, never>>;
