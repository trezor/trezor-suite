import { type EntityId } from './entityIndexTypes';
import {
    type BuiltPartition,
    type PartitionSecondaryKeys,
    type WalkedPartition,
    forEachKey,
} from './partitionWalk';

export type AssembledEntries<TEntity, TId extends EntityId> = Map<
    EntityId,
    { ids: TId[]; entities: TEntity[] }
>;

export type AssembledIndex<TEntity, TId extends EntityId> = {
    entries: AssembledEntries<TEntity, TId>;
    /** Keys a dirty or vanished partition had a hand in, so settling knows what it cannot keep. */
    dirtyKeys: Set<EntityId>;
};

const fileUnder = <TEntity, TId extends EntityId>({
    entries,
    filedIds,
    key,
    id,
    entity,
}: {
    entries: AssembledEntries<TEntity, TId>;
    filedIds: Map<EntityId, Set<TId>>;
    key: EntityId;
    id: TId;
    entity: TEntity;
}) => {
    const held = entries.get(key);

    if (held === undefined) {
        entries.set(key, { ids: [id], entities: [entity] });
        filedIds.set(key, new Set([id]));

        return;
    }

    // Under a key an entity is once, however many times it names the key and however many
    // partitions it turns up in — the primary index resolves it to one entity and so does this.
    const filed = filedIds.get(key) as Set<TId>;

    if (filed.has(id)) {
        return;
    }

    filed.add(id);
    held.ids.push(id);
    held.entities.push(entity);
};

/**
 * Which entities sit under which key, for every named index at once.
 *
 * One walk over the partitions however many indexes are asked for, because walking them is the
 * expensive half and asking an entity for its key is not.
 */
export const assembleSecondaryIndexes = <TEntity, TId extends EntityId>({
    indexNames,
    walked,
    gonePartitions,
    previousPartitions,
    keysOf,
}: {
    indexNames: readonly string[];
    walked: readonly WalkedPartition<TEntity, TId>[];
    gonePartitions: readonly BuiltPartition<TEntity, TId>[];
    previousPartitions: ReadonlyMap<string, BuiltPartition<TEntity, TId>> | undefined;
    keysOf: (built: BuiltPartition<TEntity, TId>, indexName: string) => PartitionSecondaryKeys;
}): AssembledIndex<TEntity, TId>[] => {
    const assembled = indexNames.map((): AssembledIndex<TEntity, TId> => ({
        entries: new Map(),
        dirtyKeys: new Set(),
    }));
    // What each key already holds, for as long as it is being assembled.
    const filedPerIndex = indexNames.map(() => new Map<EntityId, Set<TId>>());

    for (const { built, isDirty } of walked) {
        const { ids, entities } = built;

        for (let indexPosition = 0; indexPosition < indexNames.length; indexPosition++) {
            const keys = keysOf(built, indexNames[indexPosition] as string);
            const { entries, dirtyKeys } = assembled[indexPosition] as AssembledIndex<TEntity, TId>;
            const filedIds = filedPerIndex[indexPosition] as Map<EntityId, Set<TId>>;

            for (let position = 0; position < ids.length; position++) {
                const keysAt = keys[position];
                const id = ids[position] as TId;
                const entity = entities[position] as TEntity;

                forEachKey(keysAt, key => {
                    if (isDirty) {
                        dirtyKeys.add(key);
                    }

                    fileUnder({ entries, filedIds, key, id, entity });
                });
            }
        }
    }

    // What a rewritten or vanished partition used to be under is dirty too, even though no walk
    // reaches it: otherwise a key it has left keeps an array that still names it.
    const gone = [
        ...walked.flatMap(({ key, isDirty }) => (isDirty ? [previousPartitions?.get(key)] : [])),
        ...gonePartitions,
    ];

    indexNames.forEach((indexName, indexPosition) => {
        const { dirtyKeys } = assembled[indexPosition] as AssembledIndex<TEntity, TId>;

        gone.forEach(partition => {
            if (partition === undefined) {
                return;
            }

            keysOf(partition, indexName).forEach(keys =>
                forEachKey(keys, goneKey => dirtyKeys.add(goneKey)),
            );
        });
    });

    return assembled;
};
