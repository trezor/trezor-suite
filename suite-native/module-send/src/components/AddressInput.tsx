import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type AddressCorrection,
    autocorrectAddress,
    selectAddressValidatorDep,
} from '@suite-common/address';
import { useServices } from '@suite-common/dependency-injection';
import { type DeviceRootState } from '@suite-common/device';
import { selectFindNetworkSymbolForProtocolDep } from '@suite-common/networks';
import { parseTransferUri } from '@suite-common/transfer-uri';
import { formInputsMaxLength } from '@suite-common/validators';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectAccountNetworkSymbol,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type AccountKey, toTokenAddress } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';
import { type NativeAccountsRootState, selectFreshAccountAddress } from '@suite-native/accounts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { isDebugEnv } from '@suite-native/config';
import { TextInputField, useFormContext, useWatch } from '@suite-native/forms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import {
    type RootStackParamList,
    type SendStackParamList,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { HELP_CENTER_EVM_ADDRESS_CHECKSUM, HELP_CENTER_SOLANA_HELP_URL } from '@trezor/urls';

import { AddressInfoMessage } from './AddressInfoMessage';
import { QrCodeBottomSheetIcon } from './QrCodeBottomSheetIcon';
import { SendFormLabelEditable } from './SendFormLabelEditable';
import { useAddressValidationAlerts } from '../hooks/useAddressValidationAlerts/useAddressValidationAlerts';
import { useSolAssociatedTokenAddress } from '../hooks/useAddressValidationAlerts/useSolAssociatedTokenAddress';
import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { getOutputFieldName } from '../utils';

const AUTOCORRECT_MESSAGE_TIMEOUT_MS = 3000;

const autocorrectMessageKeys: Record<NonNullable<AddressCorrection>['type'], TxKeyPath> = {
    lowercase: 'moduleSend.outputs.recipients.autocorrect.convertedToLowercase',
    bchPrefix: 'moduleSend.outputs.recipients.autocorrect.addedBitcoincashPrefix',
};

type AddressInputNavigationProp = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputs,
    RootStackParamList
>;

type AddressInputProps = {
    index: number;
    accountKey: AccountKey;
    onQrNetworkMismatch?: (qrNetworkSymbol: NetworkSymbol | null) => void;
};
export const AddressInput = ({ index, accountKey, onQrNetworkMismatch }: AddressInputProps) => {
    const addressFieldName = getOutputFieldName(index, 'address');
    const utxoLabelFieldName = getOutputFieldName(index, 'label');
    const amountFieldName = getOutputFieldName(index, 'amount');
    const tokenFieldName = getOutputFieldName(index, 'token');
    const { setValue, control } = useFormContext<SendOutputsFormValues>();
    const { analytics, addressValidator, findNetworkSymbolForProtocol } = useServices(
        selectNativeAnalyticsDep,
        selectAddressValidatorDep,
        selectFindNetworkSymbolForProtocolDep,
    );
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const deviceAccounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectVisibleDeviceAccounts(state),
    );
    const navigation = useNavigation<AddressInputNavigationProp>();

    const { checkSolAssociatedTokenAddress, isSolATA } = useSolAssociatedTokenAddress();

    const freshAccountAddress = useSelector((state: NativeAccountsRootState) =>
        selectFreshAccountAddress(state, accountKey),
    );

    const { wasAddressChecksummed } = useAddressValidationAlerts({ inputIndex: index });

    const [autocorrectMessageId, setAutocorrectMessageId] = useState<TxKeyPath | null>(null);
    const autocorrectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showAutocorrectMessage = (messageId: TxKeyPath) => {
        setAutocorrectMessageId(messageId);
        if (autocorrectTimeoutRef.current) {
            clearTimeout(autocorrectTimeoutRef.current);
        }
        autocorrectTimeoutRef.current = setTimeout(() => {
            setAutocorrectMessageId(null);
            autocorrectTimeoutRef.current = null;
        }, AUTOCORRECT_MESSAGE_TIMEOUT_MS);
    };

    useEffect(
        () => () => {
            if (autocorrectTimeoutRef.current) {
                clearTimeout(autocorrectTimeoutRef.current);
            }
        },
        [],
    );

    const correctAddress = (value: string): string => {
        if (!symbol) return value;

        const correction = autocorrectAddress({ addressValidator, address: value, symbol });
        if (correction) {
            showAutocorrectMessage(autocorrectMessageKeys[correction.type]);

            return correction.corrected;
        }

        return value;
    };

    const handleScanAddressQRCode = (qrCodeData: string) => {
        const parsed = parseTransferUri(qrCodeData, findNetworkSymbolForProtocol);

        // ERC-681 (Ethereum) — may switch to a matching account on another EVM network.
        const erc681 =
            parsed.success &&
            parsed.payload.format === 'erc681' &&
            account?.networkType === 'ethereum'
                ? parsed.payload
                : null;
        if (erc681) {
            // Token amount is in subunits; convert it to display units using the holding
            // account's decimals (the target account when switching networks, see below).
            const toDisplayAmount = (tokenAccount: typeof account) => {
                if (!erc681.token || erc681.tokenAmount === undefined) return undefined;

                const token = tokenAccount?.tokens?.find(
                    t => t.contract.toLowerCase() === erc681.token!.toLowerCase(),
                );

                return token
                    ? convertAmountSubunitsToUnits(erc681.tokenAmount, token.decimals)
                    : undefined;
            };

            if (erc681.networkSymbol && erc681.networkSymbol !== symbol) {
                // EVM accounts share the same address across networks, so descriptor matches.
                const matchingAccount = deviceAccounts.find(
                    a => a.symbol === erc681.networkSymbol && a.descriptor === account?.descriptor,
                );
                if (matchingAccount) {
                    navigation.replace(SendStackRoutes.SendOutputs, {
                        accountKey: matchingAccount.key,
                        tokenContract: erc681.token ? toTokenAddress(erc681.token) : undefined,
                        initialAddress: erc681.address,
                        initialAmount: toDisplayAmount(matchingAccount),
                    });

                    return;
                }
                onQrNetworkMismatch?.(erc681.networkSymbol);
            } else {
                onQrNetworkMismatch?.(null);
            }
            setValue(addressFieldName, erc681.address, { shouldValidate: true });
            if (erc681.token) {
                setValue(tokenFieldName, erc681.token, { shouldDirty: true });
                const displayAmount = toDisplayAmount(account);
                if (displayAmount !== undefined) {
                    setValue(amountFieldName, displayAmount, { shouldValidate: true });
                }
            }
            analytics.report({
                type: events.sendAddressFilledEvent.name,
                payload: { method: 'qr-erc681' },
            });

            return;
        }

        // BIP-321 (bitcoin & other coin transfer URIs)
        if (
            parsed.success &&
            parsed.payload.format === 'bip321' &&
            findNetworkSymbolForProtocol(parsed.payload.scheme) === symbol
        ) {
            const bip321 = parsed.payload;
            onQrNetworkMismatch?.(null);
            setValue(addressFieldName, bip321.address, { shouldValidate: true });
            if (bip321.amount) {
                setValue(amountFieldName, bip321.amount, { shouldValidate: true });
            }
            if (bip321.label) {
                setValue(utxoLabelFieldName, bip321.label, { shouldValidate: true });
            }
            analytics.report({
                type: events.sendAddressFilledEvent.name,
                payload: { method: 'qr' },
            });

            return;
        }

        onQrNetworkMismatch?.(null);
        const corrected = correctAddress(qrCodeData);
        setValue(addressFieldName, corrected, { shouldValidate: true });
        if (symbol && addressValidator.isAddressValid(corrected, symbol)) {
            analytics.report({
                type: events.sendAddressFilledEvent.name,
                payload: { method: 'qr' },
            });
        }
    };

    const handleChangeValue = (newValue: string) => {
        onQrNetworkMismatch?.(null);
        const corrected = correctAddress(newValue);
        if (corrected !== newValue) {
            setValue(addressFieldName, corrected, { shouldValidate: true });
        }
        if (symbol && addressValidator.isAddressValid(corrected, symbol)) {
            analytics.report({
                type: events.sendAddressFilledEvent.name,
                payload: { method: 'manual' },
            });
            checkSolAssociatedTokenAddress({
                value: corrected,
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

    const utxoLabel = useWatch({ control, name: utxoLabelFieldName });
    const outputToken = useWatch({ control, name: tokenFieldName });

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
            {autocorrectMessageId !== null && <AddressInfoMessage txId={autocorrectMessageId} />}
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
