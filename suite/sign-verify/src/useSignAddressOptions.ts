import { useMemo } from 'react';

import { type ExtendedMessageDescriptor, useTranslation } from '@suite/intl';
import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import { getStakingPath } from '@suite-common/wallet-utils';

export type AddressItem = {
    label: string;
    value: string;
};

export const useSignAddressOptions = (
    account: Account | undefined,
    touchedAddresses: ReceiveInfo[],
) => {
    const reduceAddresses = (
        addresses: { address: string; path: string }[],
        category: ExtendedMessageDescriptor['id'],
    ) =>
        addresses.reduce(
            (prev, { address, path }) => ({
                ...prev,
                [path]: {
                    path,
                    address,
                    category,
                },
            }),
            {},
        );

    const signAddresses = useMemo(() => {
        switch (account?.networkType) {
            case 'bitcoin':
                return {
                    ...reduceAddresses(
                        touchedAddresses.length
                            ? touchedAddresses
                            : (account.addresses?.unused || []).slice(0, 1),
                        'TR_ADDRESSES_FRESH',
                    ),
                    ...reduceAddresses(
                        account.addresses?.used?.slice().reverse() || [],
                        'TR_ADDRESSES_USED',
                    ),
                    ...reduceAddresses(
                        account.addresses?.change?.slice().reverse() || [],
                        'TR_ADDRESSES_CHANGE',
                    ),
                };
            case 'cardano': {
                const stakingPath = getStakingPath(account);

                return {
                    ...reduceAddresses(
                        [
                            {
                                path: stakingPath,
                                address: account.misc.staking.address,
                            },
                        ],
                        'TR_STAKING_STAKE_ADDRESS',
                    ),
                    ...reduceAddresses(
                        touchedAddresses.length
                            ? touchedAddresses
                            : (account.addresses?.unused || []).slice(0, 1),
                        'TR_ADDRESSES_FRESH',
                    ),
                    ...reduceAddresses(
                        account.addresses?.used?.slice().reverse() || [],
                        'TR_ADDRESSES_USED',
                    ),
                    ...reduceAddresses(
                        account.addresses?.change?.slice().reverse() || [],
                        'TR_ADDRESSES_CHANGE',
                    ),
                };
            }
            case 'ethereum':
                return {
                    [account.path]: {
                        path: account.path,
                        address: account.descriptor,
                        category: '',
                    },
                };
            default:
                return {};
        }
    }, [account, touchedAddresses]);

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
