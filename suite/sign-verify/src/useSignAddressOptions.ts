import { useMemo } from 'react';

import { type ExtendedMessageDescriptor, useTranslation } from '@suite/intl';
import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';

import type { SignVerifyNetworkConfig } from './types';

export type AddressItem = {
    label: string;
    value: string;
};

export const useSignAddressOptions = (
    account: Account,
    touchedAddresses: ReceiveInfo[],
    getSignAddresses: SignVerifyNetworkConfig['getSignAddresses'],
) => {
    const signAddresses = useMemo(
        () =>
            Object.fromEntries(
                getSignAddresses(account, touchedAddresses).map(address => [address.path, address]),
            ),
        [account, getSignAddresses, touchedAddresses],
    );

    const { translationString } = useTranslation();

    const groupedOptions = useMemo(() => {
        const signAddressesValues = Object.values(signAddresses);
        const groupedAddresses = signAddressesValues.reduce<{
            [category: string]: AddressItem[];
        }>(
            (grouped, { address, path, category }) => ({
                ...grouped,
                [category]: [
                    ...(grouped[category] || []),
                    {
                        label: address,
                        value: path,
                    },
                ],
            }),
            {},
        );

        return Object.entries(groupedAddresses).map(([label, options]) => {
            const translatedLabel = label
                ? translationString(label as ExtendedMessageDescriptor['id'])
                : label;

            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstOption: (typeof options)[number] = options[0];
            const pathParts = firstOption.value.split('/');
            const lastSegmentIndex = pathParts.length - 2;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const pathSegment: string = pathParts[lastSegmentIndex];
            const pathLabel = `m/${pathSegment}/i`;

            return {
                label: `${translatedLabel} ${pathLabel}`,
                options,
            };
        });
    }, [signAddresses, translationString]);

    const getValue = (path: string): AddressItem | null => {
        const address = signAddresses[path];

        return address
            ? {
                  label: address.address,
                  value: address.path,
              }
            : null;
    };

    return {
        groupedOptions,
        getValue,
    };
};
