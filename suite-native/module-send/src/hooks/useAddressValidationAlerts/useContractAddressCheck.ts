import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { getNetworkType } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { type SendStackParamList, type SendStackRoutes } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { createContractAlert } from './alertBuilders';

export const useContractAddressCheck = (addressValue: string) => {
    const {
        params: { accountKey },
    } = useRoute<RouteProp<SendStackParamList, SendStackRoutes.SendOutputs>>();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const { showAlert } = useAlert();

    const [wasContractAlertDisplayed, setWasContractAlertDisplayed] = useState(false);

    const networkType = symbol ? getNetworkType(symbol) : null;

    const resetContractAlert = useCallback(() => setWasContractAlertDisplayed(false), []);

    const handleContractAddressCheck = useCallback(async () => {
        if (!symbol || !networkType) return;

        const result = await TrezorConnect.getAccountInfo({
            descriptor: addressValue,
            coin: symbol,
        });

        if (!result?.success) {
            return;
        }

        const isContract = !!result.payload.misc?.contractInfo;

        if (isContract && !wasContractAlertDisplayed) {
            showAlert(createContractAlert(() => setWasContractAlertDisplayed(true)));
        }
    }, [
        addressValue,
        symbol,
        networkType,
        wasContractAlertDisplayed,
        showAlert,
        setWasContractAlertDisplayed,
    ]);

    return {
        handleContractAddressCheck,
        wasContractAlertDisplayed,
        resetContractAlert,
    };
};
