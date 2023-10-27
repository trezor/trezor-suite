import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    selectAccountByKey,
    TransactionsRootState,
    selectPendingAccountAddresses,
    selectIsAccountUtxoBased,
    selectDevice,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { getFirstFreshAddress, readAddressFromDevice } from '@suite-common/wallet-utils';

export const useFreshAccountAddress = (accountKey: AccountKey) => {
    // TODO: add device verification??
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const device = useSelector(selectDevice);
    const pendingAddresses = useSelector((state: TransactionsRootState) =>
        selectPendingAccountAddresses(state, accountKey),
    );
    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, accountKey),
    );

    const freshAddress = useMemo(() => {
        if (account && pendingAddresses) {
            // Pass receive addresses empty. We proceed without address verification - not possible in watch only mode.
            // PORTFOLIO TRACKER::::::::::::::
            return getFirstFreshAddress(account, [], pendingAddresses, isAccountUtxoBased);
        }
    }, [account, pendingAddresses, isAccountUtxoBased]);

    const verifyAddress = async () => {
        if (device && account && freshAddress) {
            const response = await readAddressFromDevice({
                device,
                account,
                addressPath: freshAddress.path,
            });

            return response.success;
        }
    };

    return { address: freshAddress?.address, verifyAddress };
};
