import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { checkAddressChecksum, selectAddressValidatorDep } from '@suite-common/address';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworkType } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { useFormContext, useWatch } from '@suite-native/forms';
import { type SendStackParamList, type SendStackRoutes } from '@suite-native/navigation';

import { useAddressChecksum } from './useAddressChecksum';
import { useContractAddressCheck } from './useContractAddressCheck';
import { useTokenAlert } from './useTokenAlert';
import { getOutputFieldName } from '../../utils';

type UseAddressValidationAlertsArgs = {
    inputIndex: number;
    /** Onchain address a named input (e.g. ENS) resolved to, if the input was a name. */
    resolvedAddress?: string;
};

export const useAddressValidationAlerts = ({
    inputIndex,
    resolvedAddress,
}: UseAddressValidationAlertsArgs) => {
    const { addressValidator } = useServices(selectAddressValidatorDep);
    const {
        params: { tokenContract, accountKey },
    } = useRoute<RouteProp<SendStackParamList, SendStackRoutes.SendOutputs>>();
    const { control } = useFormContext();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const addressFieldName = getOutputFieldName(inputIndex, 'address');
    const addressValue = useWatch({ control, name: addressFieldName });
    // A name is not something the backend can look up, so every check runs against the address it
    // resolved to. Without this, a name resolving to a contract would skip the contract warning.
    const checkedAddress = resolvedAddress ?? addressValue;

    const { handleAddressChecksum, wasAddressChecksummed, resetAddressChecksummed } =
        useAddressChecksum(addressFieldName);

    const { handleContractAddressCheck, wasContractAlertDisplayed, resetContractAlert } =
        useContractAddressCheck(checkedAddress);

    const { handleTokenAlert, wasTokenAlertDisplayed, resetTokenAlert } = useTokenAlert();

    const isFilledValidAddress =
        !!checkedAddress && !!symbol && addressValidator.isAddressValid(checkedAddress, symbol);

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
            // Resolver output is already canonical, and checksumming rewrites the input field —
            // which would replace the name the user typed with a hex address.
            !resolvedAddress &&
            !checkAddressChecksum(checkedAddress ?? '') &&
            !wasAddressChecksummed;

        const shouldCheckContractAddress =
            (wasTokenAlertDisplayed || !shouldShowTokenAlert) &&
            // Solana uses different address validation logic than Ethereum and Tron
            (networkType === 'ethereum' || networkType === 'tron') &&
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
        checkedAddress,
        resolvedAddress,
        symbol,
        resetContractAlert,
        resetAddressChecksummed,
        resetTokenAlert,
    ]);

    return { wasAddressChecksummed };
};
