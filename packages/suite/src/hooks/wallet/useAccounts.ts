import { useMemo } from 'react';

import type { AccountAddress } from '@trezor/connect';

import type { Account } from 'src/types/wallet';

export const useAccountAddressDictionary = (account: Account | undefined) => {
    const { addresses, descriptor, networkType, path } = account ?? {};
    const { unused: unusedAddresses = [], used: usedAddresses = [] } = addresses ?? {};

    return useMemo(() => {
        switch (networkType) {
            case 'cardano':
            case 'bitcoin': {
                return (unusedAddresses ?? []).concat(usedAddresses ?? []).reduce(
                    (previous, current) => {
                        previous[current.address] = current;

                        return previous;
                    },
                    {} as { [address: string]: AccountAddress },
                );
            }
            case 'solana':
            case 'ripple':
            case 'stellar':
            case 'tron':
            case 'ethereum': {
                if (!descriptor || path === undefined) return {};

                return {
                    [descriptor]: {
                        address: descriptor,
                        path,
                    },
                };
            }
            default:
                return {};
        }
    }, [unusedAddresses, usedAddresses, descriptor, networkType, path]);
};
