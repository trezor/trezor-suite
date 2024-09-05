import React from 'react';

import { formInputsMaxLength } from '@suite-common/validators';
import { VStack, Text } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { getOutputFieldName } from '../utils';
import { QrCodeBottomSheetIcon } from './QrCodeBottomSheetIcon';

type AddressInputProps = {
    index: number;
};
export const AddressInput = ({ index }: AddressInputProps) => {
    const addressFieldName = getOutputFieldName(index, 'address');
    const { setValue } = useFormContext();

    const handleScanAddressQRCode = (qrCodeData: string) => {
        setValue(addressFieldName, qrCodeData);
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
                maxLength={formInputsMaxLength.address}
                accessibilityLabel="address input"
                rightIcon={<QrCodeBottomSheetIcon onCodeScanned={handleScanAddressQRCode} />}
            />
        </VStack>
    );
};
