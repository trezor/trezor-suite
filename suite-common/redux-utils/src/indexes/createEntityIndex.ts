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

import {
    type BuiltIndexes,
    type SecondaryIndex,
    assembleSecondaryIndex,
    buildPrimaryIndex,
} from './buildIndexes';
import { EMPTY_SNAPSHOT, NO_CHANGES } from './emptyResults';
import { changesOf } from './entityIndexChanges';
import { createEntityIndexQueries } from './entityIndexQueries';
import {
    type EntityId,
    type EntityIndex,
    type EntityIndexChanges,
    type EntityIndexDefinition,
    type EntityIndexListener,
    type EntityIndexSnapshot,
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
    // What a key means is the caller's business, which is where the cast to the snapshot's own
    // signature comes from.
    type Snapshot = EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes>;

    const toEntities = getEntities ?? ((source: TSource) => source as unknown as Iterable<TEntity>);

    const emptySnapshot = EMPTY_SNAPSHOT as unknown as Snapshot;
    const noEntries = emptySnapshot.getSecondaryIndex('' as never);

    const listeners = new Set<EntityIndexListener<TEntity, TId, TSecondaryIndexes>>();
    let notifiedSnapshot: Snapshot | undefined;
    let cached:
        | {
              source: TSource;
              snapshot: Snapshot;
              indexes: BuiltIndexes<TEntity, TId>;
          }
        | undefined;

    const build = (source: TSource): Snapshot => {
        // Only what this build needs, never `cached` itself: a closure over it would keep every
        // build before this one alive for as long as the index lives.
        const previous = cached?.indexes;
        const previousSnapshot = cached?.snapshot;

        const primary = buildPrimaryIndex({
            source,
            toEntities,
            getId,
            previous: previous?.primary,
            name,
        });

        const secondaryIndexes = new Map<string, SecondaryIndex<TEntity, TId>>();
        const indexes: BuiltIndexes<TEntity, TId> = { primary, secondaryIndexes };

        // The source was replaced but holds what it held: what was built from it still stands,
        // including whatever secondary indexes were assembled off it.
        // A source that was replaced but holds what it held — including one that was empty and
        // still is — keeps everything that was built from it, so no listener hears of it.
        if (primary === previous?.primary && previousSnapshot !== undefined) {
            cached = { source, snapshot: previousSnapshot, indexes: previous };

            return previousSnapshot;
        }

        const getSecondaryIndex = (indexName: string) => {
            const known = secondaryIndexes.get(indexName);

            if (known !== undefined) {
                return known;
            }

            const extractKey = secondaryKeyExtractors?.[indexName];

            if (extractKey === undefined) {
                return noEntries;
            }

            const built = assembleSecondaryIndex({
                extractKey,
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

        // Only the first build over a source with nothing in it: one that empties out has
        // removals to report, and one that stays empty came back above.
        const snapshot: Snapshot =
            previous === undefined && primary.ids.length === 0
                ? emptySnapshot
                : {
                      getIds: () => primary.ids,
                      getEntitiesById: () => primary.byId,
                      getSecondaryIndex: getSecondaryIndex as Snapshot['getSecondaryIndex'],
                      getChanges,
                  };

        cached = { source, snapshot, indexes };

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
