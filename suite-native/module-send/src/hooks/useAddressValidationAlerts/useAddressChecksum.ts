import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';
import { checkAddressCheckSum, toChecksumAddress } from 'web3-utils';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { isAddressValid } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { useFormContext } from '@suite-native/forms';
import { type SendStackParamList, type SendStackRoutes } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { createChecksumAlert } from './alertBuilders';

export const useAddressChecksum = (addressFieldName: string) => {
    const { showAlert } = useAlert();
    const { setValue, watch } = useFormContext();
    const {
        params: { accountKey },
    } = useRoute<RouteProp<SendStackParamList, SendStackRoutes.SendOutputs>>();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const [wasAddressChecksummed, setWasAddressChecksummed] = useState(false);

    const addressValue = watch(addressFieldName);
    const isFilledValidAddress = !!addressValue && !!symbol && isAddressValid(addressValue, symbol);

    const convertAddressToChecksum = useCallback(() => {
        setValue(addressFieldName, toChecksumAddress(addressValue), {
            shouldValidate: true,
        });
        setWasAddressChecksummed(true);
    }, [addressFieldName, addressValue, setValue, setWasAddressChecksummed]);

    const resetAddressChecksummed = useCallback(() => {
        setWasAddressChecksummed(false);
    }, []);

    const handleAddressChecksum = useCallback(async () => {
        if (isFilledValidAddress && symbol && !checkAddressCheckSum(addressValue)) {
            const params = {
                descriptor: addressValue,
                coin: symbol,
            };

            const addressInfo = await TrezorConnect.getAccountInfo(params);

            if (addressInfo.success) {
                // Already used addresses are checksumed without displaying the alert.
                const isUsedAddress = addressInfo.payload.history.total !== 0;
                if (isUsedAddress) {
                    convertAddressToChecksum();

                    return;
                }
            }

            showAlert(createChecksumAlert(convertAddressToChecksum));
        }
    }, [addressValue, isFilledValidAddress, symbol, showAlert, convertAddressToChecksum]);

    return {
        handleAddressChecksum,
        wasAddressChecksummed,
        resetAddressChecksummed,
    };
};
