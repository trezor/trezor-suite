import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '@suite-types';
import { Account, Discovery } from '@wallet-types';
import * as accountUtils from '@wallet-utils/accountUtils';

export const useAccounts = (discovery?: Discovery) => {
    const [accounts, setAccounts] = useState<Account[]>([]);

    const device = useSelector<AppState, AppState['suite']['device']>(state => state.suite.device);
    const accountsState = useSelector<AppState, AppState['wallet']['accounts']>(
        state => state.wallet.accounts,
    );

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
    const device = useSelector<AppState, AppState['suite']['device']>(state => state.suite.device);
    const accounts = useSelector<AppState, AppState['wallet']['accounts']>(
        state => state.wallet.accounts,
    );
    const deviceAccounts = useMemo(
        () => (device ? accountUtils.getAllAccounts(device.state, accounts) : []),
        [accounts, device],
    );
    return deviceAccounts;
};
