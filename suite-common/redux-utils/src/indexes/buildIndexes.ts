import { EMPTY_ENTITY_IDS } from './emptyResults';
import {
    type AnySecondaryKey,
    type EntityId,
    type SecondaryIndexEntry,
    type SecondaryKeyExtractor,
    type SecondaryKeyExtractors,
} from './entityIndexTypes';
import { settleSecondaryIndex } from './secondaryIndexSettling';

/**
 * What is under one key as the walk fills it, next to what was under it in the build before —
 * compared member by member as they arrive, so that when the walk ends the only question left is
 * whether the key has as many members as it had.
 */
type Filed<TEntity, TId extends EntityId> = {
    ids: TId[];
    entities: TEntity[];
    previous: SecondaryIndexEntry<TEntity, TId> | undefined;
    isSameAsPrevious: boolean;
};

export type AssembledEntries<TEntity, TId extends EntityId> = Map<
    AnySecondaryKey,
    Filed<TEntity, TId>
>;

export type SecondaryIndex<TEntity, TId extends EntityId> = ReadonlyMap<
    AnySecondaryKey,
    SecondaryIndexEntry<TEntity, TId>
>;

export type PrimaryIndex<TEntity, TId extends EntityId> = {
    ids: readonly TId[];
    byId: ReadonlyMap<TId, TEntity>;
};

const fileUnder = <TEntity, TId extends EntityId>(
    entries: AssembledEntries<TEntity, TId>,
    previousEntries: SecondaryIndex<TEntity, TId> | undefined,
    key: AnySecondaryKey,
    id: TId,
    entity: TEntity,
) => {
    const held = entries.get(key);

    if (held === undefined) {
        const previous = previousEntries?.get(key);

        entries.set(key, {
            ids: [id],
            entities: [entity],
            previous,
            isSameAsPrevious: previous?.entities[0] === entity,
        });

        return;
    }

    // An entity naming the same key twice is under it once. Nothing else can be, since an id
    // belongs to one entity and the source holds it once.
    if (held.ids[held.ids.length - 1] === id) {
        return;
    }

    if (held.isSameAsPrevious && held.previous?.entities[held.ids.length] !== entity) {
        held.isSameAsPrevious = false;
    }

    held.ids.push(id);
    held.entities.push(entity);
};

export type BuiltIndexes<TEntity, TId extends EntityId> = {
    primary: PrimaryIndex<TEntity, TId>;
    /** Only the ones asked to be built: the rest are assembled if and when a read wants them. */
    secondaryIndexes: Map<string, SecondaryIndex<TEntity, TId>>;
};

/**
 * Every entity of the source by the id it gives, and the secondary indexes named — in one pass.
 *
 * Which ones those are is what the build before was asked for, so an index that keeps being read
 * is filled as the source is walked rather than walking it again. One that is asked for out of
 * nowhere is assembled off `byId` instead, and will be in this pass next time.
 *
 * A source that was replaced without anything in it changing — a reducer that rebuilds its array
 * on every write — gives back the primary index built from the one before, so nothing downstream
 * is told about a change that did not happen.
 *
 * An id belongs to one entity: two of them would make what the index answers depend on which
 * question was asked, so the map that would have resolved them says so instead.
 */
export const buildIndexes = <TSource, TEntity, TId extends EntityId>({
    source,
    toEntities,
    getId,
    secondaryIndexes,
    indexNames,
    previous,
    name,
}: {
    source: TSource;
    toEntities: (source: TSource) => Iterable<TEntity>;
    getId: (entity: TEntity) => TId;
    secondaryIndexes: SecondaryKeyExtractors<TEntity> | undefined;
    indexNames: readonly string[];
    previous: BuiltIndexes<TEntity, TId> | undefined;
    name: string;
}): BuiltIndexes<TEntity, TId> => {
    const previousPrimary = previous?.primary;
    const building = indexNames.map(indexName => ({
        indexName,
        extractKey: secondaryIndexes?.[indexName],
        entries: new Map() as AssembledEntries<TEntity, TId>,
        previousEntries: previous?.secondaryIndexes.get(indexName),
    }));

    const byId = new Map<TId, TEntity>();
    const ids: TId[] = [];
    let isSameAsPrevious = previousPrimary !== undefined;

    for (const entity of toEntities(source)) {
        const id = getId(entity);

        if (byId.has(id)) {
            throw new Error(`entity index "${name}" was given two entities with the id ${id}`);
        }

        if (
            isSameAsPrevious &&
            (previousPrimary?.ids[ids.length] !== id || previousPrimary.byId.get(id) !== entity)
        ) {
            isSameAsPrevious = false;
        }

        ids.push(id);
        byId.set(id, entity);

        // Nothing is allocated per entity here: the same object would be built as many times as
        // there are entities times indexes, which is what makes one pass worth having.
        for (const { extractKey, entries, previousEntries } of building) {
            const keys = extractKey?.(entity);

            if (keys === undefined) {
                continue;
            }

            if (typeof keys === 'string') {
                fileUnder(entries, previousEntries, keys, id, entity);

                continue;
            }

            for (const key of keys) {
                fileUnder(entries, previousEntries, key, id, entity);
            }
        }
    }

    const isPrimarySurelyUnchanged = isSameAsPrevious && previousPrimary?.ids.length === ids.length;

    return {
        primary:
            isPrimarySurelyUnchanged && previousPrimary !== undefined
                ? previousPrimary
                : { ids: ids.length === 0 ? EMPTY_ENTITY_IDS : ids, byId },
        secondaryIndexes: new Map(
            building.map(({ indexName, entries, previousEntries }) => [
                indexName,
                settleSecondaryIndex({ entries, previousEntries }),
            ]),
        ),
    };
};

/**
 * One secondary index, off the primary one and only when it is asked for.
 *
 * Settled against the build before, so a key whose members did not change keeps the array it had
 * and an index none of whose keys changed keeps the map it had. Nothing is allocated per entity:
 * the same object would otherwise be built once for every entity the source holds.
 */
export const assembleSecondaryIndex = <TEntity, TId extends EntityId>({
    extractKey,
    byId,
    previousEntries,
}: {
    extractKey: SecondaryKeyExtractor<TEntity> | undefined;
    byId: ReadonlyMap<TId, TEntity>;
    previousEntries: SecondaryIndex<TEntity, TId> | undefined;
}): SecondaryIndex<TEntity, TId> => {
    const entries: AssembledEntries<TEntity, TId> = new Map();

    byId.forEach((entity, id) => {
        const keys = extractKey?.(entity);

        if (keys === undefined) {
            return;
        }

        if (typeof keys === 'string') {
            fileUnder(entries, previousEntries, keys, id, entity);

            return;
        }

        for (const key of keys) {
            fileUnder(entries, previousEntries, key, id, entity);
        }
    });

    return settleSecondaryIndex({ entries, previousEntries });
};
