import type { SignAddressGroup } from './MessageSigning';
import type { AddressRef, OpenAccountAddresses } from '../OpenAccount';

/** Addresses the user revealed, or the first unused one when nothing was revealed yet. */
export const getFreshAddresses = (
    addresses: OpenAccountAddresses | undefined,
    touchedAddresses: readonly AddressRef[],
): readonly AddressRef[] =>
    touchedAddresses.length > 0 ? touchedAddresses : (addresses?.unused ?? []).slice(0, 1);

/**
 * An address listed in several groups stays only in the last one, so a revealed address that has
 * since been used shows up as used. Groups left without addresses are dropped.
 */
export const groupSignAddresses = (
    groups: readonly SignAddressGroup[],
): readonly SignAddressGroup[] => {
    const lastGroupIndexByPath = new Map<string, number>();

    groups.forEach((group, groupIndex) =>
        group.addresses.forEach(({ path }) => lastGroupIndexByPath.set(path, groupIndex)),
    );

    return groups
        .map((group, groupIndex) => ({
            ...group,
            addresses: group.addresses.filter(
                ({ path }) => lastGroupIndexByPath.get(path) === groupIndex,
            ),
        }))
        .filter(group => group.addresses.length > 0);
};
