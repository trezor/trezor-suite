import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type ReceiveRootState, selectTouchedAddresses } from '@suite-common/receive';
import { type Account } from '@suite-common/wallet-types';

import { type SignAddress } from './types';

/**
 * The fresh, used and change addresses of an account that tracks them, newest first. The fresh
 * ones are those the user has already seen, or the first unused one.
 */
export const useAccountSignAddresses = (account: Account): SignAddress[] => {
    const touchedAddresses = useSelector((state: ReceiveRootState) =>
        selectTouchedAddresses(state, account.key),
    );
    const { addresses } = account;

    return useMemo(() => {
        const freshAddresses = touchedAddresses.length
            ? touchedAddresses
            : (addresses?.unused || []).slice(0, 1);

        return [
            ...freshAddresses.map(({ path, address }) => ({
                path,
                address,
                category: 'TR_ADDRESSES_FRESH' as const,
            })),
            ...(addresses?.used || [])
                .slice()
                .reverse()
                .map(({ path, address }) => ({
                    path,
                    address,
                    category: 'TR_ADDRESSES_USED' as const,
                })),
            ...(addresses?.change || [])
                .slice()
                .reverse()
                .map(({ path, address }) => ({
                    path,
                    address,
                    category: 'TR_ADDRESSES_CHANGE' as const,
                })),
        ];
    }, [addresses, touchedAddresses]);
};
