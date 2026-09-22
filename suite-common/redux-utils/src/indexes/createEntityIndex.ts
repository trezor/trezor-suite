/**
 * Lazily maintained derived indexes over store entities.
 *
 * A primary index and any number of secondary indexes computed from a Redux slice on first read,
 * rebuilt only for the partitions that changed, with stable array identities for unchanged keys.
 *
 * What a build does is spelled out in the modules beside this one — the partition diff, the walk,
 * the identities, the assembly, the settling, the changes — and what is left here is when any of
 * it runs: nothing until a getter is touched, and nothing twice while the source is the one it
 * was built from.
 */

import { EMPTY_ENTITY_IDS, NO_CHANGES } from './emptyResults';
import { changesOf } from './entityIndexChanges';
import { createEntityIndexQueries } from './entityIndexQueries';
import {
    type EntityId,
    type EntityIndex,
    type EntityIndexChanges,
    type EntityIndexDefinition,
    type EntityIndexListener,
    type EntityIndexSnapshot,
    type SecondaryIndexEntry,
    type SecondaryKeyExtractors,
} from './entityIndexTypes';
import { type Identities, lazyIdentitiesOf } from './identities';
import { diffPartitions } from './partitionDiff';
import { type BuiltPartition, secondaryKeysOf, walkPartition } from './partitionWalk';
import { assembleSecondaryIndexes } from './secondaryIndexAssembly';
import { settleSecondaryIndex } from './secondaryIndexSettling';

export type * from './entityIndexTypes';
export { EMPTY_ENTITIES, EMPTY_ENTITY_IDS } from './emptyResults';

const WHOLE_SOURCE_KEY = '';

export const createEntityIndex = <
    TState,
    TSource,
    TEntity,
    TId extends EntityId,
    TSecondaryIndexes extends SecondaryKeyExtractors<TEntity> = Record<string, never>,
    TPartition = TSource,
>({
    name,
    selectSource,
    getPartitions,
    getEntities,
    getId,
    secondaryIndexes: secondaryKeyExtractors,
}: EntityIndexDefinition<
    TState,
    TSource,
    TPartition,
    TEntity,
    TId,
    TSecondaryIndexes
>): EntityIndex<TState, TEntity, TId, TSecondaryIndexes> => {
    type Snapshot = EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes>;
    // Entries are stored under the key as a string; what a key means is the caller's business,
    // which is where the two casts back to the snapshot's own signature come from.
    type Entries = ReadonlyMap<EntityId, SecondaryIndexEntry<TEntity, TId>>;

    const indexNames = Object.keys(secondaryKeyExtractors ?? {});

    const toEntities =
        getEntities ?? ((partition: TPartition) => partition as unknown as Iterable<TEntity>);

    const toPartitions =
        getPartitions ??
        ((source: TSource) => [[WHOLE_SOURCE_KEY, source as unknown as TPartition]] as const);

    const walk = (partition: TPartition) => walkPartition({ partition, toEntities, getId });

    const keysOf = (built: BuiltPartition<TEntity, TId>, indexName: string) =>
        secondaryKeysOf({ built, indexName, extractKey: secondaryKeyExtractors?.[indexName] });

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
              partitions: ReadonlyMap<string, BuiltPartition<TEntity, TId>>;
              builtIndexes: Map<string, Entries>;
              identities: () => Identities<TEntity, TId>;
              isEmpty: boolean;
          }
        | undefined;

    const build = (source: TSource): Snapshot => {
        // Only what this build needs, never `cached` itself: a closure over it would keep every
        // build before this one alive for as long as the index lives.
        const previousPartitions = cached?.partitions;
        const previousBuiltIndexes = cached?.builtIndexes;
        const previousIdentities = cached?.identities;
        const wasEmpty = cached?.isEmpty ?? true;

        const {
            partitions,
            walked,
            gonePartitions,
            possiblyRemoved,
            entityCount,
            isPartitionOrderKept,
        } = diffPartitions({ sourcePartitions: toPartitions(source), previousPartitions, walk });

        const builtIndexes = new Map<string, Entries>();

        const wantedIndexes = demandedIndexes;
        demandedIndexes = new Set<string>();

        const assemble = (indexName: string) => {
            // The one asked for, and whatever else was read last time and has not been built yet:
            // they cost one walk together and one walk each apart.
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
                walked,
                gonePartitions,
                previousPartitions,
                keysOf,
            }).forEach((assembled, position) => {
                const builtName = toBuild[position] as string;

                builtIndexes.set(
                    builtName,
                    settleSecondaryIndex({
                        assembled,
                        previousEntries: previousBuiltIndexes?.get(builtName),
                        isPartitionOrderKept,
                    }),
                );
            });
        };

        const identities = lazyIdentitiesOf(walked);

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
                    previousIdentities === undefined
                        ? NO_CHANGES
                        : changesOf({
                              walked,
                              byId: identities().byId,
                              previousById: previousIdentities().byId,
                              possiblyRemoved,
                          });
            }

            return changes;
        };

        const isEmpty = entityCount === 0;
        const snapshot: Snapshot =
            isEmpty && wasEmpty
                ? emptySnapshot
                : {
                      getIds: () => identities().ids,
                      getEntitiesById: () => identities().byId,
                      getSecondaryIndex: getSecondaryIndex as Snapshot['getSecondaryIndex'],
                      getChanges,
                  };

        cached = { source, partitions, builtIndexes, identities, snapshot, isEmpty };

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
