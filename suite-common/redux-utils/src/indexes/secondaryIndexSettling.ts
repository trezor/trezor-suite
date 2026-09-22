import { type AssembledEntries } from './buildIndexes';
import { type AnySecondaryKey, type EntityId, type SecondaryIndexEntry } from './entityIndexTypes';
/**
 * Which freshly assembled arrays may keep the reference they had.
 *
 * This is what a component watching one key subscribes to: an array that kept its identity is a
 * render that did not happen. A key whose members are the same entities in the same order keeps
 * the array it had, and an index none of whose keys changed keeps the map it had.
 */
const areSame = <TItem>(left: readonly TItem[], right: readonly TItem[]) =>
    left.length === right.length && left.every((item, index) => item === right[index]);

export const settleSecondaryIndex = <TEntity, TId extends EntityId>({
    entries,
    previousEntries,
}: {
    entries: AssembledEntries<TEntity, TId>;
    previousEntries: ReadonlyMap<AnySecondaryKey, SecondaryIndexEntry<TEntity, TId>> | undefined;
}): ReadonlyMap<AnySecondaryKey, SecondaryIndexEntry<TEntity, TId>> => {
    const settled = new Map<AnySecondaryKey, SecondaryIndexEntry<TEntity, TId>>();
    let isUnchanged = previousEntries?.size === entries.size;

    entries.forEach((members, key) => {
        const previousMembers = previousEntries?.get(key);

        if (previousMembers !== undefined && areSame(previousMembers.entities, members.entities)) {
            settled.set(key, previousMembers);
        } else {
            settled.set(key, members);
            isUnchanged = false;
        }
    });

    return isUnchanged && previousEntries ? previousEntries : settled;
};
