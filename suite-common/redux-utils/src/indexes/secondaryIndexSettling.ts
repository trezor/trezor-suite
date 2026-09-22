import { type AssembledEntries, type SecondaryIndex } from './buildIndexes';
import { type AnySecondaryKey, type EntityId, type SecondaryIndexEntry } from './entityIndexTypes';

/**
 * Which freshly filled arrays may keep the reference they had.
 *
 * This is what a component watching one key subscribes to: an array that kept its identity is a
 * render that did not happen. Whether a key's members are the ones it had was answered as they
 * were filed, so all that is left is whether it has as many of them as it had.
 */
export const settleSecondaryIndex = <TEntity, TId extends EntityId>({
    entries,
    previousEntries,
}: {
    entries: AssembledEntries<TEntity, TId>;
    previousEntries: SecondaryIndex<TEntity, TId> | undefined;
}): SecondaryIndex<TEntity, TId> => {
    const settled = new Map<AnySecondaryKey, SecondaryIndexEntry<TEntity, TId>>();
    let isUnchanged = previousEntries?.size === entries.size;

    entries.forEach((held, key) => {
        const { ids, entities, previous, isSameAsPrevious } = held;

        if (isSameAsPrevious && previous?.entities.length === ids.length) {
            settled.set(key, previous);
        } else {
            settled.set(key, { ids, entities });
            isUnchanged = false;
        }
    });

    return isUnchanged && previousEntries ? previousEntries : settled;
};
