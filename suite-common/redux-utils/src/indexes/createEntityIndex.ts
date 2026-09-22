/**
 * Derived indexes over store entities.
 *
 * A primary index computed from a Redux slice on first read, and any number of secondary indexes
 * assembled on the first read that asks for one, with stable array identities for keys whose
 * members did not change.
 *
 * What a build does is spelled out in the modules beside this one — the primary index, the
 * assembly of a secondary one off it, the settling of their identities, the changes — and what is
 * left here is when any of it runs: a secondary index not until it is asked for, and nothing twice
 * while the source is the one it was built from.
 */

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
import { type PrimaryIndex, buildPrimaryIndex } from './primaryIndex';
import { assembleSecondaryIndexes } from './secondaryIndexAssembly';

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

    const indexNames = Object.keys(secondaryKeyExtractors ?? {});

    const toEntities = getEntities ?? ((source: TSource) => source as unknown as Iterable<TEntity>);

    const noEntries: Entries = new Map();
    const noEntities: ReadonlyMap<TId, TEntity> = new Map();

    const emptySnapshot: Snapshot = {
        getIds: () => EMPTY_ENTITY_IDS,
        getEntitiesById: () => noEntities,
        getSecondaryIndex: ((_indexName: string) => noEntries) as Snapshot['getSecondaryIndex'],
        getChanges: () => NO_CHANGES,
    };

    // Which indexes were read off the last snapshot, so the next build assembles them together.
    let demandedIndexes = new Set<string>();

    const listeners = new Set<EntityIndexListener<TEntity, TId, TSecondaryIndexes>>();
    let notifiedSnapshot: Snapshot | undefined;
    let cached:
        | {
              source: TSource;
              snapshot: Snapshot;
              builtIndexes: Map<string, Entries>;
              primary: PrimaryIndex<TEntity, TId>;
              isEmpty: boolean;
          }
        | undefined;

    const build = (source: TSource): Snapshot => {
        // Only what this build needs, never `cached` itself: a closure over it would keep every
        // build before this one alive for as long as the index lives.
        const previousBuiltIndexes = cached?.builtIndexes;
        const previousPrimary = cached?.primary;
        const wasEmpty = cached?.isEmpty ?? true;
        const previousSnapshot = cached?.snapshot;

        const primary = buildPrimaryIndex({ source, toEntities, getId, name });

        const builtIndexes = new Map<string, Entries>();

        const wantedIndexes = demandedIndexes;
        demandedIndexes = new Set<string>();

        const assemble = (indexName: string) => {
            // The one asked for, and whatever else was read last time and has not been built yet:
            // they cost one pass together and one pass each apart.
            const toBuild = [
                indexName,
                ...indexNames.filter(
                    wanted =>
                        wanted !== indexName &&
                        wantedIndexes.has(wanted) &&
                        !builtIndexes.has(wanted),
                ),
            ];

            assembleSecondaryIndexes({
                indexNames: toBuild,
                secondaryIndexes: secondaryKeyExtractors,
                byId: primary.byId,
                previousIndexes: previousBuiltIndexes,
                builtIndexes,
            });
        };

        const getSecondaryIndex = (indexName: string) => {
            demandedIndexes.add(indexName);

            if (!builtIndexes.has(indexName)) {
                assemble(indexName);
            }

            return builtIndexes.get(indexName) as Entries;
        };

        let changes: EntityIndexChanges<TId> | undefined;

        const getChanges = () => {
            if (changes === undefined) {
                changes =
                    previousPrimary === undefined
                        ? NO_CHANGES
                        : changesOf({
                              byId: primary.byId,
                              previousById: previousPrimary.byId,
                          });
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

        cached = { source, snapshot, builtIndexes, primary, isEmpty };

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
