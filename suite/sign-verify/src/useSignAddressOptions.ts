import { useMemo } from 'react';

import { type TranslationKey, useTranslation } from '@suite/intl';

import { type SignAddress } from './types';

export type AddressItem = {
    label: string;
    value: string;
};

export const useSignAddressOptions = (addresses: SignAddress[]) => {
    const signAddresses = useMemo(
        () =>
            addresses.reduce<Record<string, SignAddress>>(
                (byPath, signAddress) => ({ ...byPath, [signAddress.path]: signAddress }),
                {},
            ),
        [addresses],
    );

    const { translationString } = useTranslation();

    const groupedOptions = useMemo(() => {
        const groupedAddresses = new Map<TranslationKey | undefined, AddressItem[]>();

        Object.values(signAddresses).forEach(({ address, path, category }) => {
            groupedAddresses.set(category, [
                ...(groupedAddresses.get(category) ?? []),
                { label: address, value: path },
            ]);
        });

        return Array.from(groupedAddresses, ([category, options]) => {
            if (!category) {
                return { label: '', options };
            }

            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstOption: (typeof options)[number] = options[0];
            const pathParts = firstOption.value.split('/');
            const lastSegmentIndex = pathParts.length - 2;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const pathSegment: string = pathParts[lastSegmentIndex];
            const pathLabel = `m/${pathSegment}/i`;

            return {
                label: `${translationString(category)} ${pathLabel}`,
                options,
            };
        });
    }, [signAddresses, translationString]);

    const getValue = (path: string): AddressItem | null => {
        const signAddress = signAddresses[path];

        return signAddress
            ? {
                  label: signAddress.address,
                  value: signAddress.path,
              }
            : null;
    };

    return {
        groupedOptions,
        getValue,
    };
};
