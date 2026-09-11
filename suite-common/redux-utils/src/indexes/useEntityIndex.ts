import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    EMPTY_ENTITIES,
    EMPTY_ENTITY_IDS,
    type EntityGroupKey,
    type EntityGroupKeySelectors,
    type EntityId,
    type EntityIndex,
    type EntityIndexSnapshot,
} from './createEntityIndex';

/**
 * Holds an index's build for as long as the component is mounted.
 *
 * Only worth mounting on its own when a screen reads the index through something other than the
 * hooks below — a thunk, an imperative handler — and wants the build to survive between those
 * reads. The reading hooks subscribe by themselves.
 */
export const useEntityIndexSubscription = <
    TState,
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity>,
>(
    index: EntityIndex<TState, TEntity, TId, TGroups>,
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
 * Pass a selector that returns something stable: an entity, an id, a group's id list. Returning a
 * new array or object each time defeats the comparison and re-renders on every action, the same
 * way it would with a plain `useSelector`.
 */
export const useEntityIndexSelector = <
    TState,
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity>,
    TResult,
>(
    index: EntityIndex<TState, TEntity, TId, TGroups>,
    selector: (snapshot: EntityIndexSnapshot<TEntity, TId, TGroups>) => TResult,
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
export const useEntityById = <
    TState,
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity>,
>(
    index: EntityIndex<TState, TEntity, TId, TGroups>,
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
export const useEntityIds = <
    TState,
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity>,
>(
    index: EntityIndex<TState, TEntity, TId, TGroups>,
): readonly TId[] => useEntityIndexSelector(index, snapshot => snapshot.ids);

/**
 * The ids in one group — an account's transactions, say, rather than all of them.
 *
 * Re-renders when that group's members change and at no other time: a write to another group, or
 * to an entity this one does not hold, leaves the array identical.
 */
export const useEntityIdsBy = <
    TState,
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity>,
    TName extends keyof TGroups,
>(
    index: EntityIndex<TState, TEntity, TId, TGroups>,
    groupName: TName,
    key: EntityGroupKey<TGroups[TName]>,
): readonly TId[] =>
    useEntityIndexSelector(
        index,
        useCallback(
            snapshot =>
                snapshot.groups[groupName].get(key)?.ids ?? (EMPTY_ENTITY_IDS as readonly TId[]),
            [groupName, key],
        ),
    );

/**
 * The entities in one group — an account's transactions, say, rather than all of them.
 *
 * Re-renders when that group's members change and at no other time. Prefer `useEntityIdsBy` for a
 * long list, where a row watching its own entity is cheaper than the whole list re-rendering
 * because one member changed.
 */
export const useEntitiesBy = <
    TState,
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity>,
    TName extends keyof TGroups,
>(
    index: EntityIndex<TState, TEntity, TId, TGroups>,
    groupName: TName,
    key: EntityGroupKey<TGroups[TName]>,
): readonly TEntity[] =>
    useEntityIndexSelector(
        index,
        useCallback(
            snapshot =>
                snapshot.groups[groupName].get(key)?.entities ??
                (EMPTY_ENTITIES as readonly TEntity[]),
            [groupName, key],
        ),
    );
