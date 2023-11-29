import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsRootState,
    selectAccountByKey,
    TransactionsRootState,
    selectPendingAccountAddresses,
    selectIsAccountUtxoBased,
    selectAccountNetworkSymbol,
    selectIsSelectedDeviceImported,
    confirmAddressOnDeviceThunk,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { getFirstFreshAddress } from '@suite-common/wallet-utils';
import { analytics, EventType } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';

export const useAccountReceiveAddress = (accountKey: AccountKey) => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const [isReceiveApproved, setIsReceiveApproved] = useState(false);
    const [isUnverifiedAddressRevealed, setIsUnverifiedAddressRevealed] = useState(false);

    const isPortfolioTracker = useSelector(selectIsSelectedDeviceImported);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
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
        if (accountKey && freshAddress) {
            const { success } = await requestPrioritizedDeviceAccess(() =>
                dispatch(
                    confirmAddressOnDeviceThunk({
                        accountKey,
                        addressPath: freshAddress.path,
                    }),
                ).unwrap(),
            );

            return success;
        }

        return false;
    }, [dispatch, accountKey, freshAddress]);

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

            analytics.report({ type: EventType.ConfirmedReceiveAdress });
            // In case that user cancels the verification or device is disconnected, navigate out of the receive flow.
            if (!wasVerificationSuccessful) {
                navigation.goBack();
                return;
            }
        }

        setIsReceiveApproved(true);
    }, [networkSymbol, isPortfolioTracker, verifyAddressOnDevice, navigation]);

    return {
        address: freshAddress?.address,
        isReceiveApproved,
        isUnverifiedAddressRevealed,
        handleShowAddress,
    };
};
