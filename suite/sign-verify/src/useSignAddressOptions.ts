import { useMemo } from 'react';

import { type ExtendedMessageDescriptor, useTranslation } from '@suite/intl';

import { type SignAddresses } from './types';

export type AddressItem = {
    label: string;
    value: string;
};

export const toSignAddresses = (
    addresses: { address: string; path: string }[],
    category: ExtendedMessageDescriptor['id'] | '',
): SignAddresses =>
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

export const useSignAddressOptions = (signAddresses: SignAddresses) => {
    const { translationString } = useTranslation();

    const groupedOptions = useMemo(() => {
        const groupedAddresses = Object.values(signAddresses).reduce<{
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
            if (!label) {
                return { label: '', options };
            }

            const translatedLabel = translationString(label as ExtendedMessageDescriptor['id']);

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
