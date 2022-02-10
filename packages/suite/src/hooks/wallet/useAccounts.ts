import { useState, useEffect, useMemo } from 'react';
import { useSelector } from '@suite-hooks';
import type { AccountAddress } from 'trezor-connect';
import * as accountUtils from '@wallet-utils/accountUtils';
import type { Account, Discovery } from '@wallet-types';

export const useAccounts = (discovery?: Discovery) => {
    const [accounts, setAccounts] = useState<Account[]>([]);

    const { device, accountsState } = useSelector(state => ({
        device: state.suite.device,
        accountsState: state.wallet.accounts,
    }));

    useEffect(() => {
        if (device) {
            const deviceAccounts = accountUtils.getAllAccounts(device.state, accountsState);
            const failedAccounts = discovery ? accountUtils.getFailedAccounts(discovery) : [];
            const sortedAccounts = accountUtils.sortByCoin(deviceAccounts.concat(failedAccounts));
            setAccounts(sortedAccounts);
        }
    }, [device, discovery, accountsState]);

    return {
        accounts,
    };
};

export const useFastAccounts = () => {
    const { device, accounts } = useSelector(state => ({
        device: state.suite.device,
        accounts: state.wallet.accounts,
    }));
    const deviceAccounts = useMemo(
        () => (device ? accountUtils.getAllAccounts(device.state, accounts) : []),
        [accounts, device],
    );
    return deviceAccounts;
};

export const useAccountAddressDictionary = (account: Account | undefined) =>
    useMemo(() => {
        switch (account?.networkType) {
            case 'cardano':
            case 'bitcoin': {
                return (account?.addresses?.unused ?? [])
                    .concat(account?.addresses?.used ?? [])
                    .reduce((previous, current) => {
                        previous[current.address] = current;
                        return previous;
                    }, {} as { [address: string]: AccountAddress });
            }
            case 'ripple':
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
