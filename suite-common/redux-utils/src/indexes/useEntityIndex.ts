import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { EntityId, EntityIndex, EntityIndexSnapshot } from './createEntityIndex';

/**
 * Holds an index's build for as long as the component is mounted.
 *
 * Only worth mounting on its own when a screen reads the index through something other than the
 * hooks below — a thunk, an imperative handler — and wants the build to survive between those
 * reads. The reading hooks subscribe by themselves.
 */
export const useEntityIndexSubscription = <TState, TEntity, TId extends EntityId>(
    index: EntityIndex<TState, TEntity, TId>,
) => {
    useEffect(() => index.subscribe(), [index]);
};

/**
 * Reads the index, re-rendering only when what was read changes.
 *
 * The selector runs against the index's snapshot on every store write, which costs one identity
 * comparison while the indexed reducer has not written — so the cost of a component watching an
 * index is the cost of watching a single value, not of rebuilding anything.
 *
 * Pass a selector that returns something stable: an entity, an id, a primitive. Returning a new
 * array or object each time defeats the comparison and re-renders on every action, the same way
 * it would with a plain `useSelector`.
 */
export const useEntityIndexSelector = <TState, TEntity, TId extends EntityId, TResult>(
    index: EntityIndex<TState, TEntity, TId>,
    selector: (snapshot: EntityIndexSnapshot<TEntity, TId>) => TResult,
    equalityFn?: (left: TResult, right: TResult) => boolean,
): TResult => {
    useEntityIndexSubscription(index);

    return useSelector((state: TState) => selector(index.read(state)), equalityFn);
};

/**
 * One entity by its primary key — the question the index exists to answer.
 *
 * Re-renders when that entity changes and at no other time, so a list row watching its own entity
 * is not woken by its neighbours.
 */
export const useEntityById = <TState, TEntity, TId extends EntityId>(
    index: EntityIndex<TState, TEntity, TId>,
    id: TId,
): TEntity | undefined =>
    useEntityIndexSelector(
        index,
        useCallback(snapshot => snapshot.byId.get(id), [id]),
    );

/**
 * Every id in the index.
 *
 * The array is part of the snapshot rather than built per read, so it is stable while the indexed
 * reducer has not written and a consumer can hand it straight to a list.
 */
export const useEntityIds = <TState, TEntity, TId extends EntityId>(
    index: EntityIndex<TState, TEntity, TId>,
): readonly TId[] => useEntityIndexSelector(index, snapshot => snapshot.ids);
