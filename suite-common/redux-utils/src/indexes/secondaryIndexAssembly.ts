import {
    type AnySecondaryKey,
    type EntityId,
    type SecondaryKeyExtractor,
} from './entityIndexTypes';

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

const fileUnderEach = <TEntity, TId extends EntityId>({
    entries,
    keys,
    id,
    entity,
}: {
    entries: AssembledEntries<TEntity, TId>;
    keys: AnySecondaryKey | readonly AnySecondaryKey[] | undefined;
    id: TId;
    entity: TEntity;
}) => {
    if (keys === undefined) {
        return;
    }

    if (Array.isArray(keys)) {
        for (const key of keys) {
            fileUnder(entries, key, id, entity);
        }

        return;
    }

    fileUnder(entries, keys as AnySecondaryKey, id, entity);
};

/**
 * Which entities sit under which key, for every named index at once.
 *
 * One pass over the primary index however many indexes are asked for, because asking an entity for
 * its key is the cheap half of this.
 */
export const assembleSecondaryIndexes = <TEntity, TId extends EntityId>({
    extractors,
    byId,
}: {
    extractors: readonly SecondaryKeyExtractor<TEntity>[];
    byId: ReadonlyMap<TId, TEntity>;
}): AssembledEntries<TEntity, TId>[] => {
    const assembled = extractors.map((): AssembledEntries<TEntity, TId> => new Map());

    byId.forEach((entity, id) => {
        for (let position = 0; position < extractors.length; position++) {
            fileUnderEach({
                entries: assembled[position] as AssembledEntries<TEntity, TId>,
                keys: (extractors[position] as SecondaryKeyExtractor<TEntity>)(entity),
                id,
                entity,
            });
        }
    });

    return assembled;
};
