import React from 'react';
import { useSelector } from 'react-redux';

import { parseErc681TransferUri } from '@suite-common/suite-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits, isAddressValid } from '@suite-common/wallet-utils';
import { type NativeAccountsRootState, selectFreshAccountAddress } from '@suite-native/accounts';
import { events } from '@suite-native/analytics';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { isDebugEnv } from '@suite-native/config';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { SendFormLabelEditable } from '@suite-native/labeling';
import { useAnalytics } from '@suite-native/services';
import { HELP_CENTER_EVM_ADDRESS_CHECKSUM, HELP_CENTER_SOLANA_HELP_URL } from '@trezor/urls';

import { AddressInfoMessage } from './AddressInfoMessage';
import { QrCodeBottomSheetIcon } from './QrCodeBottomSheetIcon';
import { useAddressValidationAlerts } from '../hooks/useAddressValidationAlerts/useAddressValidationAlerts';
import { useSolAssociatedTokenAddress } from '../hooks/useAddressValidationAlerts/useSolAssociatedTokenAddress';
import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { getOutputFieldName } from '../utils';

type AddressInputProps = {
    index: number;
    accountKey: AccountKey;
};
export const AddressInput = ({ index, accountKey }: AddressInputProps) => {
    const addressFieldName = getOutputFieldName(index, 'address');
    const utxoLabelFieldName = getOutputFieldName(index, 'label');
    const amountFieldName = getOutputFieldName(index, 'amount');
    const tokenFieldName = getOutputFieldName(index, 'token');
    const { setValue, watch } = useFormContext<SendOutputsFormValues>();
    const analytics = useAnalytics();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { checkSolAssociatedTokenAddress, isSolATA } = useSolAssociatedTokenAddress();

    const freshAccountAddress = useSelector(
        (state: NativeAccountsRootState & TransactionsRootState) =>
            selectFreshAccountAddress(state, accountKey),
    );

    const { wasAddressChecksummed } = useAddressValidationAlerts({ inputIndex: index });

    const handleScanAddressQRCode = (qrCodeData: string) => {
        const erc681 =
            account?.networkType === 'ethereum' ? parseErc681TransferUri(qrCodeData) : null;
        if (erc681) {
            setValue(addressFieldName, erc681.recipientAddress, { shouldValidate: true });
            setValue(tokenFieldName, erc681.contractAddress, { shouldDirty: true });
            const token = account?.tokens?.find(
                t => t.contract.toLowerCase() === erc681.contractAddress.toLowerCase(),
            );
            if (token && erc681.tokenAmount !== undefined) {
                setValue(
                    amountFieldName,
                    convertAmountSubunitsToUnits(erc681.tokenAmount, token.decimals),
                    { shouldValidate: true },
                );
            }
            analytics.report({
                type: events.sendAddressFilledEvent.name,
                payload: { method: 'qr-erc681' },
            });

            return;
        }

        setValue(addressFieldName, qrCodeData, { shouldValidate: true });
        if (symbol && isAddressValid(qrCodeData, symbol)) {
            analytics.report({
                type: events.sendAddressFilledEvent.name,
                payload: { method: 'qr' },
            });
        }
    };

    const handleChangeValue = (newValue: string) => {
        if (symbol && isAddressValid(newValue, symbol)) {
            analytics.report({
                type: events.sendAddressFilledEvent.name,
                payload: { method: 'manual' },
            });
            checkSolAssociatedTokenAddress({
                value: newValue,
                symbol,
                fieldName: addressFieldName,
            });
        }
    };

    // Debug helper to fill opened account address.
    const fillSelfAddress = () => {
        if (freshAccountAddress)
            setValue(addressFieldName, freshAccountAddress.address, {
                shouldValidate: true,
            });
    };

    const utxoLabel = watch(utxoLabelFieldName);
    const outputToken = watch(tokenFieldName);

    return (
        <VStack spacing="sp12">
            <HStack alignItems="center" justifyContent="space-between" spacing="sp12">
                <Text variant="body-sm">
                    <Translation id="moduleSend.outputs.recipients.addressLabel" />
                </Text>
                {/* Tokens labels wouldn't sync properly between desktop & mobile, so labeling is */}
                {/* turned off for tokens until it's fixed. */}
                {!outputToken && (
                    <SendFormLabelEditable
                        label={utxoLabel ?? null}
                        onLabelChange={newUtxoLabel => {
                            setValue(utxoLabelFieldName, newUtxoLabel, {
                                shouldValidate: true,
                            });
                        }}
                    />
                )}
            </HStack>
            {isDebugEnv() && (
                <Button
                    size="medium"
                    intent="neutral"
                    priority="secondary"
                    onPress={fillSelfAddress}
                >
                    DEV: self address
                </Button>
            )}
            <TextInputField
                multiline
                name={addressFieldName}
                testID={addressFieldName}
                onChangeText={handleChangeValue}
                maxLength={formInputsMaxLength.address}
                accessibilityLabel="address input"
                rightIcon={<QrCodeBottomSheetIcon onCodeScanned={handleScanAddressQRCode} />}
            />
            {wasAddressChecksummed && (
                <AddressInfoMessage
                    txId="moduleSend.outputs.recipients.checksum.label"
                    link={HELP_CENTER_EVM_ADDRESS_CHECKSUM}
                />
            )}
            {isSolATA && (
                <AddressInfoMessage
                    type="warning"
                    txId="moduleSend.outputs.recipients.solAssociatedAccountAddress.label"
                    link={HELP_CENTER_SOLANA_HELP_URL}
                />
            )}
        </VStack>
    );
};
