import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    selectAccountByKey,
    TransactionsRootState,
    selectPendingAccountAddresses,
    selectIsAccountUtxoBased,
    selectDevice,
    selectAccountNetworkSymbol,
    selectIsSelectedDeviceImported,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { getFirstFreshAddress, confirmAddressOnDevice } from '@suite-common/wallet-utils';
import { analytics, EventType } from '@suite-native/analytics';

export const useAccountReceiveAddress = (accountKey: AccountKey) => {
    const [isReceiveApproved, setIsReceiveApproved] = useState(false);
    const [isUnverifiedAddressRevealed, setIsUnverifiedAddressRevealed] = useState(false);

    const isPortfolioTracker = useSelector(selectIsSelectedDeviceImported);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const device = useSelector(selectDevice);
    const pendingAddresses = useSelector((state: TransactionsRootState) =>
        selectPendingAccountAddresses(state, accountKey),
    );
    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, accountKey),
    );

    const freshAddress = useMemo(() => {
        if (account) {
            return getFirstFreshAddress(account, [], pendingAddresses, isAccountUtxoBased);
        }
    }, [account, pendingAddresses, isAccountUtxoBased]);

    const verifyAddressOnDevice = useCallback(async () => {
        if (device && account && freshAddress) {
            const response = await confirmAddressOnDevice({
                device,
                account,
                addressPath: freshAddress.path,
            });

            return response.success;
        }

        return false;
    }, [device, account, freshAddress]);

    const handleShowAddress = useCallback(async () => {
        if (isPortfolioTracker) {
            if (networkSymbol)
                analytics.report({
                    type: EventType.CreateReceiveAddressShowAddress,
                    payload: { assetSymbol: networkSymbol },
                });
        } else {
            setIsUnverifiedAddressRevealed(true);
            const wasVerificationSuccessful = await verifyAddressOnDevice();

            if (!wasVerificationSuccessful) {
                // TODO: handle the possibility that user declines on the trezor device
                // https://github.com/trezor/trezor-suite/issues/9776
                return;
            }
        }

        setIsReceiveApproved(true);
    }, [networkSymbol, isPortfolioTracker, verifyAddressOnDevice]);

    return {
        address: freshAddress?.address,
        isReceiveApproved,
        isUnverifiedAddressRevealed,
        handleShowAddress,
    };
};
