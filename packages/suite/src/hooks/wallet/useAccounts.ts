import { useState, useEffect, useMemo } from 'react';
import { useSelector } from '@suite-hooks';
import { Account, Discovery } from '@wallet-types';
import * as accountUtils from '@wallet-utils/accountUtils';

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
