import { useMemo } from 'react';

import type { SignAddressGroup } from '@trezor/network-module-suite-common-types';

import { useCapabilityLabelText } from './CapabilityLabel';

export type AddressItem = {
    label: string;
    value: string;
};

// The derivation branch the group's addresses share, such as `m/0/i` for external addresses.
const getGroupPathLabel = (group: SignAddressGroup) => {
    const pathSegment = group.addresses[0]?.path.split('/').at(-2);

    return pathSegment === undefined ? '' : ` m/${pathSegment}/i`;
};

export const useSignAddressOptions = (groups: readonly SignAddressGroup[]) => {
    const getLabelText = useCapabilityLabelText();

    const groupedOptions = useMemo(
        () =>
            groups.map(group => ({
                label: group.label ? `${getLabelText(group.label)}${getGroupPathLabel(group)}` : '',
                options: group.addresses.map(({ address, path }) => ({
                    label: address,
                    value: path,
                })),
            })),
        [groups, getLabelText],
    );

    const getValue = (path: string): AddressItem | null => {
        const address = groups
            .flatMap(group => group.addresses)
            .find(candidate => candidate.path === path);

        return address ? { label: address.address, value: address.path } : null;
    };

    return { groupedOptions, getValue };
};
