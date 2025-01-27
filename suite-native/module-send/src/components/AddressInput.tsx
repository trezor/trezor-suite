import React from 'react';
import { useSelector } from 'react-redux';

import { formInputsMaxLength } from '@suite-common/validators';
import {
    AccountsRootState,
    TransactionsRootState,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { isAddressValid } from '@suite-common/wallet-utils';
import { NativeAccountsRootState, selectFreshAccountAddress } from '@suite-native/accounts';
import { EventType, analytics } from '@suite-native/analytics';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { isDebugEnv } from '@suite-native/config';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { QrCodeBottomSheetIcon } from './QrCodeBottomSheetIcon';
import { useAddressValidationAlerts } from '../hooks/useAddressValidationAlerts';
import { SendOutputsFormValues } from '../sendOutputsFormSchema';
import { getOutputFieldName } from '../utils';
import { AddressChecksumMessage } from './AddressChecksumMessage';

type AddressInputProps = {
    index: number;
    accountKey: AccountKey;
};
export const AddressInput = ({ index, accountKey }: AddressInputProps) => {
    const addressFieldName = getOutputFieldName(index, 'address');
    const { setValue } = useFormContext<SendOutputsFormValues>();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const freshAccountAddress = useSelector(
        (state: NativeAccountsRootState & TransactionsRootState) =>
            selectFreshAccountAddress(state, accountKey),
    );

    const { wasAddressChecksummed } = useAddressValidationAlerts({ inputIndex: index });

    const handleScanAddressQRCode = (qrCodeData: string) => {
        setValue(addressFieldName, qrCodeData, { shouldValidate: true });
        if (symbol && isAddressValid(qrCodeData, symbol)) {
            analytics.report({ type: EventType.SendAddressFilled, payload: { method: 'qr' } });
        }
    };

    const handleChangeValue = (newValue: string) => {
        if (symbol && isAddressValid(newValue, symbol)) {
            analytics.report({ type: EventType.SendAddressFilled, payload: { method: 'manual' } });
        }
    };

    // Debug helper to fill opened account address.
    const fillSelfAddress = () => {
        if (freshAccountAddress)
            setValue(addressFieldName, freshAccountAddress.address, {
                shouldValidate: true,
                shouldTouch: true,
            });
    };

    return (
        <VStack spacing="sp12">
            <HStack flex={1} justifyContent="space-between" alignItems="center">
                <Text variant="hint">
                    <Translation id="moduleSend.outputs.recipients.addressLabel" />
                </Text>
                {isDebugEnv() && (
                    <Button size="small" colorScheme="tertiaryElevation0" onPress={fillSelfAddress}>
                        DEV: self address
                    </Button>
                )}
            </HStack>
            <TextInputField
                multiline
                name={addressFieldName}
                testID={addressFieldName}
                onChangeText={handleChangeValue}
                maxLength={formInputsMaxLength.address}
                accessibilityLabel="address input"
                rightIcon={<QrCodeBottomSheetIcon onCodeScanned={handleScanAddressQRCode} />}
            />
            {wasAddressChecksummed && <AddressChecksumMessage />}
        </VStack>
    );
};
