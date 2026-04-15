import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';
import { checkAddressCheckSum } from 'web3-utils';

import { getNetworkType } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { isAddressValid } from '@suite-common/wallet-utils';
import { useFormContext } from '@suite-native/forms';
import { type SendStackParamList, type SendStackRoutes } from '@suite-native/navigation';

import { useAddressChecksum } from './useAddressChecksum';
import { useContractAddressCheck } from './useContractAddressCheck';
import { useTokenAlert } from './useTokenAlert';
import { getOutputFieldName } from '../../utils';

type UseAddressValidationAlertsArgs = {
    inputIndex: number;
};

export const useAddressValidationAlerts = ({ inputIndex }: UseAddressValidationAlertsArgs) => {
    const {
        params: { tokenContract, accountKey },
    } = useRoute<RouteProp<SendStackParamList, SendStackRoutes.SendOutputs>>();
    const { watch } = useFormContext();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const addressFieldName = getOutputFieldName(inputIndex, 'address');
    const addressValue = watch(addressFieldName);

    const { handleAddressChecksum, wasAddressChecksummed, resetAddressChecksummed } =
        useAddressChecksum(addressFieldName);

    const { handleContractAddressCheck, wasContractAlertDisplayed, resetContractAlert } =
        useContractAddressCheck(addressValue);

    const { handleTokenAlert, wasTokenAlertDisplayed, resetTokenAlert } = useTokenAlert();

    const isFilledValidAddress = !!addressValue && !!symbol && isAddressValid(addressValue, symbol);

    const networkType = symbol ? getNetworkType(symbol) : null;

    useEffect(() => {
        if (!isFilledValidAddress) {
            resetTokenAlert();
            resetContractAlert();
            resetAddressChecksummed();

            return;
        }

        const shouldShowTokenAlert = !!tokenContract && !wasTokenAlertDisplayed;

        const shouldChecksumAddress =
            networkType === 'ethereum' &&
            !checkAddressCheckSum(addressValue || '') &&
            !wasAddressChecksummed;

        const shouldCheckContractAddress =
            (wasTokenAlertDisplayed || !shouldShowTokenAlert) &&
            ['eth', 'tsep', 'thod', 'trx', 'ttrx'].includes(symbol) &&
            !wasContractAlertDisplayed;

        if (shouldShowTokenAlert) {
            handleTokenAlert();

            return;
        }

        if (shouldChecksumAddress) {
            handleAddressChecksum();

            return;
        }

        if (shouldCheckContractAddress) {
            handleContractAddressCheck();

            return;
        }
    }, [
        isFilledValidAddress,
        tokenContract,
        wasAddressChecksummed,
        handleAddressChecksum,
        wasTokenAlertDisplayed,
        wasContractAlertDisplayed,
        handleContractAddressCheck,
        handleTokenAlert,
        networkType,
        addressValue,
        symbol,
        resetContractAlert,
        resetAddressChecksummed,
        resetTokenAlert,
    ]);

    return { wasAddressChecksummed };
};
