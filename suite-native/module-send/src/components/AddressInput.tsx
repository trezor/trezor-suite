import React from 'react';
import { useSelector } from 'react-redux';

import { formInputsMaxLength } from '@suite-common/validators';
import { VStack, Text } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { analytics, EventType } from '@suite-native/analytics';
import { isAddressValid } from '@suite-common/wallet-utils';
import { AccountKey } from '@suite-common/wallet-types';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';

import { QrCodeBottomSheetIcon } from './QrCodeBottomSheetIcon';
import { getOutputFieldName } from '../utils';

type AddressInputProps = {
    index: number;
    accountKey: AccountKey;
};
export const AddressInput = ({ index, accountKey }: AddressInputProps) => {
    const addressFieldName = getOutputFieldName(index, 'address');
    const { setValue } = useFormContext();

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const handleScanAddressQRCode = (qrCodeData: string) => {
        setValue(addressFieldName, qrCodeData, { shouldValidate: true });
        if (networkSymbol && isAddressValid(qrCodeData, networkSymbol)) {
            analytics.report({ type: EventType.SendAddressFilled, payload: { method: 'qr' } });
        }
    };

    const handleChangeValue = (newValue: string) => {
        if (networkSymbol && isAddressValid(newValue, networkSymbol)) {
            analytics.report({ type: EventType.SendAddressFilled, payload: { method: 'manual' } });
        }
    };

    return (
        <VStack spacing={12}>
            <Text variant="hint">
                <Translation id="moduleSend.outputs.recipients.addressLabel" />
            </Text>
            <TextInputField
                multiline
                name={addressFieldName}
                testID={addressFieldName}
                onChangeText={handleChangeValue}
                maxLength={formInputsMaxLength.address}
                accessibilityLabel="address input"
                rightIcon={<QrCodeBottomSheetIcon onCodeScanned={handleScanAddressQRCode} />}
            />
        </VStack>
    );
};
