/**
 * Derived indexes over store entities.
 *
 * A primary index computed from a Redux slice on first read, and any number of secondary ones
 * assembled off it when a read asks for one, with stable array identities for keys whose members
 * did not change.
 *
 * What a build does is spelled out in the modules beside this one — the indexes, the settling of
 * their identities, the changes — and what is left here is when any of it runs: an index not until
 * something asks for it, and nothing twice while the source is the one it was built from.
 */

import { type BuiltIndexes, assembleSecondaryIndex, buildIndexes } from './buildIndexes';
import { EMPTY_ENTITY_IDS, NO_CHANGES } from './emptyResults';
import { changesOf } from './entityIndexChanges';
import { createEntityIndexQueries } from './entityIndexQueries';
import {
    type AnySecondaryKey,
    type EntityId,
    type EntityIndex,
    type EntityIndexChanges,
    type EntityIndexDefinition,
    type EntityIndexListener,
    type EntityIndexSnapshot,
    type SecondaryIndexEntry,
    type SecondaryKeyExtractors,
} from './entityIndexTypes';

export type * from './entityIndexTypes';
export { EMPTY_ENTITIES, EMPTY_ENTITY_IDS } from './emptyResults';

export const createEntityIndex = <
    TState,
    TSource,
    TEntity,
    TId extends EntityId,
    TSecondaryIndexes extends SecondaryKeyExtractors<TEntity> = Record<string, never>,
>({
    name,
    selectSource,
    getEntities,
    getId,
    secondaryIndexes: secondaryKeyExtractors,
}: EntityIndexDefinition<TState, TSource, TEntity, TId, TSecondaryIndexes>): EntityIndex<
    TState,
    TEntity,
    TId,
    TSecondaryIndexes
> => {
    type Snapshot = EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes>;
    // What a key means is the caller's business, which is where the two casts back to the
    // snapshot's own signature come from.
    type Entries = ReadonlyMap<AnySecondaryKey, SecondaryIndexEntry<TEntity, TId>>;

    const toEntities = getEntities ?? ((source: TSource) => source as unknown as Iterable<TEntity>);

    const noEntries: Entries = new Map();
    const noEntities: ReadonlyMap<TId, TEntity> = new Map();

    const emptySnapshot: Snapshot = {
        getIds: () => EMPTY_ENTITY_IDS,
        getEntitiesById: () => noEntities,
        getSecondaryIndex: ((_indexName: string) => noEntries) as Snapshot['getSecondaryIndex'],
        getChanges: () => NO_CHANGES,
    };

    // Which indexes were read off the last snapshot, so the next build fills them as it walks.
    let demandedIndexes = new Set<string>();

    const listeners = new Set<EntityIndexListener<TEntity, TId, TSecondaryIndexes>>();
    let notifiedSnapshot: Snapshot | undefined;
    let cached:
        | {
              source: TSource;
              snapshot: Snapshot;
              indexes: BuiltIndexes<TEntity, TId>;
              isEmpty: boolean;
          }
        | undefined;

    const build = (source: TSource): Snapshot => {
        // Only what this build needs, never `cached` itself: a closure over it would keep every
        // build before this one alive for as long as the index lives.
        const previous = cached?.indexes;
        const wasEmpty = cached?.isEmpty ?? true;
        const previousSnapshot = cached?.snapshot;

        // What was read off the last snapshot is filled as this source is walked; anything else is
        // assembled off `byId` if a read asks for it, and is in the walk from then on.
        const wantedIndexes = demandedIndexes;
        demandedIndexes = new Set<string>();

        const indexes = buildIndexes({
            source,
            toEntities,
            getId,
            secondaryIndexes: secondaryKeyExtractors,
            indexNames: [...wantedIndexes],
            previous,
            name,
        });

        const { primary, secondaryIndexes } = indexes;

        // The source was replaced but holds what it held: what was built from it still stands.
        if (primary === previous?.primary && previousSnapshot !== undefined) {
            cached = { source, snapshot: previousSnapshot, indexes: previous, isEmpty: wasEmpty };

            return previousSnapshot;
        }

        const getSecondaryIndex = (indexName: string) => {
            demandedIndexes.add(indexName);

            const known = secondaryIndexes.get(indexName);

            if (known !== undefined) {
                return known;
            }

            const built = assembleSecondaryIndex({
                extractKey: secondaryKeyExtractors?.[indexName],
                byId: primary.byId,
                previousEntries: previous?.secondaryIndexes.get(indexName),
            });
            secondaryIndexes.set(indexName, built);

            return built;
        };

        let changes: EntityIndexChanges<TId> | undefined;

        const getChanges = () => {
            if (changes === undefined) {
                changes =
                    previous === undefined
                        ? NO_CHANGES
                        : changesOf({ byId: primary.byId, previousById: previous.primary.byId });
            }

            return changes;
        };

        const isEmpty = primary.ids.length === 0;
        // Nothing to say and nothing to hand back that it has not handed back already: an index
        // that was empty and stays empty keeps the snapshot it had, so no listener hears of it.
        const snapshot: Snapshot =
            isEmpty && wasEmpty
                ? (previousSnapshot ?? emptySnapshot)
                : {
                      getIds: () => primary.ids,
                      getEntitiesById: () => primary.byId,
                      getSecondaryIndex: getSecondaryIndex as Snapshot['getSecondaryIndex'],
                      getChanges,
                  };

        cached = { source, snapshot, indexes, isEmpty };

        return snapshot;
    };

    const notify = (snapshot: Snapshot) => {
        if (listeners.size === 0 || snapshot === notifiedSnapshot) {
            return;
        }
        notifiedSnapshot = snapshot;

        listeners.forEach(listener => {
            try {
                listener(snapshot);
            } catch (error) {
                console.error(`entity index "${name}" listener failed`, error);
            }
        });
    };

    const read = (state: TState): Snapshot => {
        const source = selectSource(state);

        if (cached?.source === source) {
            return cached.snapshot;
        }

        const snapshot = build(source);
        notify(snapshot);

        return snapshot;
    };

    return {
        name,

        subscribe: listener => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },

        getListenerCount: () => listeners.size,

        read,

        ...createEntityIndexQueries<TState, TEntity, TId, TSecondaryIndexes>(read),
    };
};
