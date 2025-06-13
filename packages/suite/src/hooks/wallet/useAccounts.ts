import { useMemo } from 'react';

import type { AccountAddress } from '@trezor/connect';

import type { Account } from 'src/types/wallet';

export const useAccountAddressDictionary = (account: Account | undefined) =>
    useMemo(() => {
        switch (account?.networkType) {
            case 'cardano':
            case 'bitcoin': {
                return (account?.addresses?.unused ?? [])
                    .concat(account?.addresses?.used ?? [])
                    .reduce(
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
            case 'ethereum': {
                return {
                    [account.descriptor]: {
                        address: account.descriptor,
                        path: account.path,
                    },
                };
            }
            default:
                return {};
        }
    }, [
        account?.addresses?.unused,
        account?.addresses?.used,
        account?.descriptor,
        account?.networkType,
        account?.path,
    ]);
