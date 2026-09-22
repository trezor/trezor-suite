import {
    type AnySecondaryKey,
    type EntityId,
    type SecondaryKeyExtractor,
} from './entityIndexTypes';

/** What the source's entities say their key is, in the order the source holds them. */
export type SourceSecondaryKeys = readonly (
    AnySecondaryKey | readonly AnySecondaryKey[] | undefined
)[];

export type WalkedSource<TEntity, TId extends EntityId> = {
    ids: readonly TId[];
    entities: readonly TEntity[];
    secondaryKeys: Map<string, SourceSecondaryKeys>;
};

/** Once per source, and what it walked is kept for as long as that source is the one in the store. */
export const walkSource = <TSource, TEntity, TId extends EntityId>({
    source,
    toEntities,
    getId,
}: {
    source: TSource;
    toEntities: (source: TSource) => Iterable<TEntity>;
    getId: (entity: TEntity) => TId;
}): WalkedSource<TEntity, TId> => {
    const ids: TId[] = [];
    const entities: TEntity[] = [];
    const held = toEntities(source);

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

    return { ids, entities, secondaryKeys: new Map() };
};

/** Asked once per index, however many times the index is assembled from this walk. */
export const secondaryKeysOf = <TEntity, TId extends EntityId>({
    walked,
    indexName,
    extractKey,
}: {
    walked: WalkedSource<TEntity, TId>;
    indexName: string;
    extractKey: SecondaryKeyExtractor<TEntity> | undefined;
}): SourceSecondaryKeys => {
    const known = walked.secondaryKeys.get(indexName);

    if (known !== undefined) {
        return known;
    }

    const keys = walked.entities.map(entity => extractKey?.(entity));
    walked.secondaryKeys.set(indexName, keys);

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
