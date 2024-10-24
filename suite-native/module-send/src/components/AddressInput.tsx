import React from 'react';
import { useSelector } from 'react-redux';

import { formInputsMaxLength } from '@suite-common/validators';
import { VStack, Text, HStack, Button } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { analytics, EventType } from '@suite-native/analytics';
import { isAddressValid } from '@suite-common/wallet-utils';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    selectAccountNetworkSymbol,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { NativeAccountsRootState, selectFreshAccountAddress } from '@suite-native/accounts';
import { isDebugEnv } from '@suite-native/config';

import { QrCodeBottomSheetIcon } from './QrCodeBottomSheetIcon';
import { getOutputFieldName } from '../utils';
import { SendOutputsFormValues } from '../sendOutputsFormSchema';

type AddressInputProps = {
    index: number;
    accountKey: AccountKey;
};
export const AddressInput = ({ index, accountKey }: AddressInputProps) => {
    const addressFieldName = getOutputFieldName(index, 'address');
    const { setValue } = useFormContext<SendOutputsFormValues>();

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const freshAccountAddress = useSelector(
        (state: NativeAccountsRootState & TransactionsRootState) =>
            selectFreshAccountAddress(state, accountKey),
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

    // Debug helper to fill opened account address.
    const fillSelfAddress = () => {
        if (freshAccountAddress)
            setValue(addressFieldName, freshAccountAddress.address, { shouldValidate: true });
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
        </VStack>
    );
};
