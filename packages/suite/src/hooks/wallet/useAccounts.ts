import { useMemo } from 'react';

import {
    selectDeviceAccountsVisibleEnabledAndSupported,
    selectDiscoveryForSelectedDevice,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { getFailedAccounts, sortByCoin } from '@suite-common/wallet-utils';
import type { AccountAddress } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';
import type { Account } from 'src/types/wallet';

export const useAccounts = () => {
    const accounts = useSelector(selectDeviceAccountsVisibleEnabledAndSupported);
    const device = useSelector(selectSelectedDevice);
    const staticSessionId = device?.state?.staticSessionId;
    const discovery = useSelector(selectDiscoveryForSelectedDevice);

    return useMemo(() => {
        const failed = getFailedAccounts(staticSessionId, discovery);
        const allAccounts = [...accounts, ...failed];
        const sortedAccounts = sortByCoin(allAccounts);

        return sortedAccounts;
    }, [staticSessionId, discovery, accounts]);
};

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
