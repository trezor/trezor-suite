import {
    type AnySecondaryKey,
    type EntityId,
    type SecondaryKeyExtractor,
} from './entityIndexTypes';

/** What one partition's entities say their key is, in the order the partition holds them. */
export type PartitionSecondaryKeys = readonly (
    AnySecondaryKey | readonly AnySecondaryKey[] | undefined
)[];

export type BuiltPartition<TEntity, TId extends EntityId> = {
    partition: unknown;
    ids: readonly TId[];
    entities: readonly TEntity[];
    secondaryKeys: Map<string, PartitionSecondaryKeys>;
};

export type WalkedPartition<TEntity, TId extends EntityId> = {
    key: string;
    built: BuiltPartition<TEntity, TId>;
    isDirty: boolean;
};

/** A partition is walked once per reference: the result is kept and handed back to the next build. */
export const walkPartition = <TPartition, TEntity, TId extends EntityId>({
    partition,
    toEntities,
    getId,
}: {
    partition: TPartition;
    toEntities: (partition: TPartition) => Iterable<TEntity>;
    getId: (entity: TEntity) => TId;
}): BuiltPartition<TEntity, TId> => {
    const ids: TId[] = [];
    const entities: TEntity[] = [];
    const held = toEntities(partition);

    if (Array.isArray(held)) {
        for (let position = 0; position < held.length; position++) {
            const entity = held[position] as TEntity;
            ids.push(getId(entity));
            entities.push(entity);
        }
    } else {
        for (const entity of held) {
            ids.push(getId(entity));
            entities.push(entity);
        }
    }

    return { partition, ids, entities, secondaryKeys: new Map() };
};

/** Asked once per partition per index, however many times the index is assembled. */
export const secondaryKeysOf = <TEntity, TId extends EntityId>({
    built,
    indexName,
    extractKey,
}: {
    built: BuiltPartition<TEntity, TId>;
    indexName: string;
    extractKey: SecondaryKeyExtractor<TEntity> | undefined;
}): PartitionSecondaryKeys => {
    const known = built.secondaryKeys.get(indexName);

    if (known !== undefined) {
        return known;
    }

    const keys = built.entities.map(entity => extractKey?.(entity));
    built.secondaryKeys.set(indexName, keys);

    return keys;
};

export const forEachKey = (
    keys: AnySecondaryKey | readonly AnySecondaryKey[] | undefined,
    visit: (key: AnySecondaryKey) => void,
) => {
    if (keys === undefined) {
        return;
    }

    if (Array.isArray(keys)) {
        for (const key of keys) {
            visit(key);
        }

        return;
    }

    visit(keys as AnySecondaryKey);
};
