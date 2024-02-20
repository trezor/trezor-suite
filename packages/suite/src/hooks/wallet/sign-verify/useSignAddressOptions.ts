import { useMemo } from 'react';
import { useTranslation } from 'src/hooks/suite';
import type { Account } from 'src/types/wallet';
import type { ExtendedMessageDescriptor } from 'src/types/suite';
import type { State as RevealedAddresses } from 'src/reducers/wallet/receiveReducer';

export type AddressItem = {
    label: string;
    value: string;
};

export const useSignAddressOptions = (
    account: Account | undefined,
    revealedAddresses: RevealedAddresses,
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
                        revealedAddresses.length
                            ? revealedAddresses
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
    }, [account, revealedAddresses]);

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

            const pathParts = options[0].value.split('/');
            const pathLabel = `m/${pathParts[pathParts.length - 2]}/i`;

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
