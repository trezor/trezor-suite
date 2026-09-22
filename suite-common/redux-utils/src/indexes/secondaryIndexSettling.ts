import { type EntityId, type SecondaryIndexEntry } from './entityIndexTypes';
import { areSame } from './identities';
import { type AssembledIndex } from './secondaryIndexAssembly';

/**
 * Which freshly assembled arrays may keep the reference they had.
 *
 * This is what a component watching one key subscribes to: an array that kept its identity is a
 * render that did not happen. Two ways to know, and the cheap one needs the partition order to
 * have held — then a key no dirty partition touched cannot have changed, whatever else did.
 * Otherwise the members are compared one by one.
 */
export const settleSecondaryIndex = <TEntity, TId extends EntityId>({
    assembled,
    previousEntries,
    isPartitionOrderKept,
}: {
    assembled: AssembledIndex<TEntity, TId>;
    previousEntries: ReadonlyMap<EntityId, SecondaryIndexEntry<TEntity, TId>> | undefined;
    isPartitionOrderKept: boolean;
}): ReadonlyMap<EntityId, SecondaryIndexEntry<TEntity, TId>> => {
    const { entries, dirtyKeys } = assembled;
    const settled = new Map<EntityId, SecondaryIndexEntry<TEntity, TId>>();
    let isUnchanged = previousEntries?.size === entries.size;

    entries.forEach((members, key) => {
        const previousMembers = previousEntries?.get(key);
        const isKept =
            previousMembers !== undefined &&
            ((isPartitionOrderKept && !dirtyKeys.has(key)) ||
                areSame(previousMembers.entities, members.entities));

        if (isKept) {
            settled.set(key, previousMembers);
        } else {
            settled.set(key, members);
            isUnchanged = false;
        }
    });

    // Every key kept what it had, so the index as a whole did too.
    return isUnchanged && previousEntries ? previousEntries : settled;
};
