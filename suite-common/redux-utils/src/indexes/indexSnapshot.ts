import { type Index, type IndexChanges, type IndexId, type IndexSnapshot } from './indexTypes';
import { EMPTY_INDEX_ENTITIES, EMPTY_INDEX_IDS, haveSameMembers } from './indexUtils';

export const NO_CHANGES: IndexChanges<never> = {
    added: EMPTY_INDEX_IDS,
    removed: EMPTY_INDEX_IDS,
    updated: EMPTY_INDEX_IDS,
};

export const EMPTY_SNAPSHOT: IndexSnapshot<never, never> = {
    ids: EMPTY_INDEX_IDS,
    entities: EMPTY_INDEX_ENTITIES,
    byId: new Map<never, never>(),
    changes: NO_CHANGES,
    revision: 0,
    changesSince: 0,
};

/**
 * How an index built over `baseline` gets to `next`: `'same'` when `next` holds the very content
 * (nothing to do), `'changes'` when `next`'s changes are relative to `baseline` (follow them),
 * `'rebuild'` when `next` was built past the baseline and the changes say nothing about the way.
 */
export const wayTo = (
    baseline: IndexSnapshot<IndexId, unknown> | undefined,
    next: IndexSnapshot<IndexId, unknown>,
): 'same' | 'changes' | 'rebuild' => {
    if (baseline === undefined) {
        return 'rebuild';
    }

    if (baseline.revision === next.revision) {
        return 'same';
    }

    return baseline.revision === next.changesSince ? 'changes' : 'rebuild';
};

export const toChanges = <TId extends IndexId>(
    added: TId[],
    removed: TId[],
    updated: TId[],
): IndexChanges<TId> =>
    added.length + removed.length + updated.length > 0 ? { added, removed, updated } : NO_CHANGES;

/** Revisions an index stamps its snapshots with: unique for the life of the index. */
export const createRevisions = () => {
    let revision = 0;

    return () => {
        revision += 1;

        return revision;
    };
};

/** What a snapshot built from nothing says it changed since: no revision it could be followed from. */
const FROM_NOTHING = -1;

/**
 * A snapshot over a filled `byId`, settled against the one before: `ids` and `entities` keep their
 * arrays while members and order stand, and a build that changed nothing is the build before.
 * New content takes the next revision; `changes` are relative to the build before, or to nothing
 * when there was none — then no index over this one can follow, and rebuilds as well.
 */
export const settleSnapshot = <TId extends IndexId, TEntity>(
    byId: ReadonlyMap<TId, TEntity>,
    orderedIds: TId[],
    changes: IndexChanges<TId>,
    previous: IndexSnapshot<TId, TEntity> | undefined,
    nextRevision: () => number,
): IndexSnapshot<TId, TEntity> => {
    const emptySnapshot = EMPTY_SNAPSHOT as IndexSnapshot<TId, TEntity>;
    const since = previous?.revision ?? FROM_NOTHING;

    if (orderedIds.length === 0) {
        return previous === undefined && changes === NO_CHANGES
            ? emptySnapshot
            : { ...emptySnapshot, changes, revision: nextRevision(), changesSince: since };
    }

    // Nothing moved: the build before, as it is. Its changes stay relative to `changesSince`,
    // which is what an index over this one that has not seen it yet follows.
    if (
        previous !== undefined &&
        changes === NO_CHANGES &&
        haveSameMembers(previous.ids, orderedIds)
    ) {
        return previous;
    }

    const entities = orderedIds.map(id => byId.get(id) as TEntity);

    return {
        ids:
            previous !== undefined && haveSameMembers(previous.ids, orderedIds)
                ? previous.ids
                : orderedIds,
        entities:
            previous !== undefined && haveSameMembers(previous.entities, entities)
                ? previous.entities
                : entities,
        byId,
        changes,
        revision: nextRevision(),
        changesSince: since,
    };
};

/** The lookups every index answers, over its `read`. */
export const createIndexQueries = <TState, TId extends IndexId, TEntity>(
    name: string,
    read: (state: TState) => IndexSnapshot<TId, TEntity>,
): Index<TState, TId, TEntity> => ({
    name,
    read,
    getIds: state => read(state).ids,
    getEntities: state => read(state).entities,
    getById: (state, id) => read(state).byId.get(id),
});
