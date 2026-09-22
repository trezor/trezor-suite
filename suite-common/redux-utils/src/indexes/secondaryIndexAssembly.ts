import { type AnySecondaryKey, type EntityId } from './entityIndexTypes';
import { type SourceSecondaryKeys, forEachKey } from './sourceWalk';

export type AssembledEntries<TEntity, TId extends EntityId> = Map<
    AnySecondaryKey,
    { ids: TId[]; entities: TEntity[] }
>;

const fileUnder = <TEntity, TId extends EntityId>(
    entries: AssembledEntries<TEntity, TId>,
    key: AnySecondaryKey,
    id: TId,
    entity: TEntity,
) => {
    const held = entries.get(key);

    if (held === undefined) {
        entries.set(key, { ids: [id], entities: [entity] });

        return;
    }

    // An entity naming the same key twice is under it once. Nothing else can be, since an id
    // belongs to one entity and the source holds it once.
    if (held.ids[held.ids.length - 1] === id) {
        return;
    }

    held.ids.push(id);
    held.entities.push(entity);
};

/**
 * Which entities sit under which key, for every named index at once.
 *
 * One pass over the entities however many indexes are asked for, because asking an entity for its
 * key is the cheap half of this.
 */
export const assembleSecondaryIndexes = <TEntity, TId extends EntityId>({
    indexNames,
    ids,
    entities,
    keysOf,
}: {
    indexNames: readonly string[];
    ids: readonly TId[];
    entities: readonly TEntity[];
    keysOf: (indexName: string) => SourceSecondaryKeys;
}): AssembledEntries<TEntity, TId>[] => {
    const assembled = indexNames.map((): AssembledEntries<TEntity, TId> => new Map());

    for (let indexPosition = 0; indexPosition < indexNames.length; indexPosition++) {
        const keys = keysOf(indexNames[indexPosition] as string);
        const entries = assembled[indexPosition] as AssembledEntries<TEntity, TId>;

        for (let position = 0; position < ids.length; position++) {
            const id = ids[position] as TId;
            const entity = entities[position] as TEntity;

            forEachKey(keys[position], key => fileUnder(entries, key, id, entity));
        }
    }

    return assembled;
};
