import { useCallback, useEffect, useRef, useState } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectIsDebugModeActive } from '@suite/debug';
import { useDevice } from '@suite/device';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { Labeling } from '@suite/labeling';
import { selectIsMetadataEnabled } from '@suite/metadata';
import { openDeferredModal } from '@suite/modal';
import { selectDesktopSuiteSyncInteraction } from '@suite/suite-sync';
import {
    type AddressCorrection,
    autocorrectAddress,
    checkAddressChecksum,
    isAddressDeprecated,
    isTaprootAddress,
    selectAddressValidatorDep,
    toChecksumAddress,
} from '@suite-common/address';
import { useServices } from '@suite-common/dependency-injection';
import { selectFindNetworkSymbolForProtocolDep } from '@suite-common/networks';
import { notificationsActions } from '@suite-common/toast-notifications';
import { isAmountPresent, parseTransferUri } from '@suite-common/transfer-uri';
import { formInputsMaxLength } from '@suite-common/validators';
import type { Output } from '@suite-common/wallet-types';
import {
    checkIsAddressNotUsedNotChecksummed,
    convertAmountSubunitsToUnits,
    isProgramDerivedAccount,
} from '@suite-common/wallet-utils';
import { Icon, IconButton, Input, Link, Row, Text } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { CheckIcon, InfoIcon, QrCodeIcon, WarningCircleIcon, XIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { type TimerId } from '@trezor/type-utils';
import {
    ALL_URLS,
    HELP_CENTER_EVM_ADDRESS_CHECKSUM,
    HELP_CENTER_EVM_SEND_TO_CONTRACT_URL,
    HELP_CENTER_SOLANA_HELP_URL,
} from '@trezor/urls';
import { capitalizeFirstLetter } from '@trezor/utils';

import { AccountLabelForOwnAddress } from 'src/components/suite/labeling/AccountLabelForOwnAddress';
import { InputError } from 'src/components/wallet';
import { type InputErrorProps } from 'src/components/wallet/InputError';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { selectIsSuiteOnline } from 'src/selectors/suite/suiteSelectors';
import { captureSentryMessage } from 'src/utils/suite/sentry';

import { DevAddressBook } from './DevAddressBook';

const autocorrectTranslationKeys: Record<NonNullable<AddressCorrection>['type'], TranslationKey> = {
    lowercase: 'TR_CONVERTED_TO_LOWERCASE',
    bchPrefix: 'TR_ADDED_BITCOINCASH_PREFIX',
};

type AddressProps = {
    outputId: number;
    outputsCount: number;
    output: Partial<Output>;
};

export const Address = ({ output, outputId, outputsCount }: AddressProps) => {
    const [addressDeprecatedUrl, setAddressDeprecatedUrl] =
        useState<ReturnType<typeof isAddressDeprecated>>(undefined);
    const [hasAddressChecksummed, setHasAddressChecksummed] = useState<boolean | undefined>();
    const [autocorrectMessage, setAutocorrectMessage] = useState<string | undefined>();
    const autocorrectTimeout = useRef<TimerId>(null);
    const dispatch = useDispatch();
    const { device } = useDevice();
    const {
        account,
        removeOutput,
        composeTransaction,
        register,
        getDefaultValue,
        formState: { errors },
        setValue,
        watch,
        setDraftSaveRequest,
        trigger,
        clearErrors,
    } = useSendFormContext();
    const { translationString } = useTranslation();
    const { analytics, addressValidator, findNetworkSymbolForProtocol } = useServices(
        selectDesktopAnalyticsDep,
        selectAddressValidatorDep,
        selectFindNetworkSymbolForProtocolDep,
    );
    const { descriptor, networkType, symbol } = account;
    const inputName = `outputs.${outputId}.address` as const;
    // NOTE: compose errors are always associated with the amount.
    // If address is not valid then compose process will never be triggered,
    // however if address is changed compose process may return `AMOUNT_IS_NOT_ENOUGH` which should appear under the amount filed.
    const amountInputName = `outputs.${outputId}.amount` as const;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const addressError = outputError ? outputError.address : undefined;
    const addressValue = getDefaultValue(inputName, output.address || '');
    const recipientId = outputId + 1;
    const label = watch(`outputs.${outputId}.label`, '');
    const address = watch(inputName);
    const selectedToken = watch(`outputs.${outputId}.token`);
    const options = getDefaultValue('options', []);
    const broadcastEnabled = options.includes('broadcast');
    const isOnline = useSelector(selectIsSuiteOnline);
    const isDebug = useSelector(selectIsDebugModeActive);
    const isMetadataEnabled = useSelector(selectIsMetadataEnabled);
    const suiteSyncInteraction = useSelector(state =>
        account
            ? selectDesktopSuiteSyncInteraction(state, account.deviceState, isMetadataEnabled)
            : null,
    );

    const shouldShowLabelAction = suiteSyncInteraction === null || !!device?.connected;

    const [isExternalAddressCheckWarningDismissed, setIsExternalAddressCheckWarningDismissed] =
        useState(false);

    const isExternalAddressCheckEnabled = ['ethereum', 'solana', 'tron'].includes(networkType);

    useEffect(() => {
        setIsExternalAddressCheckWarningDismissed(false);
    }, [address]);

    useEffect(() => {
        if (networkType === 'tron' && address) {
            trigger(inputName);
        }
    }, [selectedToken, networkType, inputName, trigger, address]);

    const handleQrClick = useCallback(async () => {
        const uri = await dispatch(openDeferredModal({ type: 'qr-reader' }));

        if (typeof uri !== 'string') {
            return;
        }

        const result = parseTransferUri(uri, findNetworkSymbolForProtocol);

        let parsedScheme: string | undefined;
        if (result.success) {
            parsedScheme = result.payload.scheme;
        } else if (result.error.type === 'UNKNOWN_SCHEME') {
            parsedScheme = result.error.scheme;
        }

        if (parsedScheme !== undefined) {
            analytics.report({
                type: events.sendQrScanEvent.name,
                payload: {
                    scheme: parsedScheme,
                    isAmountPresent: result.success && isAmountPresent(result.payload),
                    networkSymbol: symbol,
                },
            });
        }

        if (!result.success) {
            if (result.error.type === 'UNKNOWN_SCHEME') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'qr-unknown-scheme-protocol',
                        scheme: result.error.scheme,
                        error: 'Unknown protocol',
                    }),
                );

                captureSentryMessage(`QR code with unknown scheme: ${result.error.scheme}`);

                return;
            }

            if (addressValidator.isAddressValid(uri, symbol)) {
                setValue(inputName, uri, { shouldValidate: true });

                composeTransaction(inputName);
            } else {
                dispatch(notificationsActions.addToast({ type: 'qr-incorrect-address' }));
            }

            return;
        }

        const { scheme, address: parsedAddress } = result.payload;

        if (findNetworkSymbolForProtocol(scheme) !== symbol) {
            dispatch(
                notificationsActions.addToast({
                    type: 'qr-incorrect-coin-scheme-protocol',
                    coin: capitalizeFirstLetter(scheme),
                }),
            );

            return;
        }

        setValue(inputName, parsedAddress, { shouldValidate: true });

        if (result.payload.format === 'erc681') {
            const { token, tokenAmount } = result.payload;

            if (token) {
                setValue(`outputs.${outputId}.token`, token, { shouldDirty: true });

                if (tokenAmount) {
                    const accountToken = account.tokens?.find(
                        t => t.contract.toLowerCase() === token.toLowerCase(),
                    );
                    if (accountToken) {
                        setValue(
                            amountInputName,
                            convertAmountSubunitsToUnits(tokenAmount, accountToken.decimals),
                            { shouldValidate: true },
                        );
                    }
                }
            }
        } else {
            if (result.payload.amount) {
                setValue(amountInputName, result.payload.amount, { shouldValidate: true });
            }
            if (result.payload.label) {
                setValue(`outputs.${outputId}.label`, result.payload.label, {
                    shouldValidate: true,
                });
            }
        }

        composeTransaction(amountInputName);
    }, [
        account.tokens,
        amountInputName,
        analytics,
        composeTransaction,
        dispatch,
        inputName,
        outputId,
        setValue,
        symbol,
        addressValidator,
        findNetworkSymbolForProtocol,
    ]);

    if (device?.state?.staticSessionId === undefined) {
        return;
    }

    const getInputErrorProps = (): {
        learnMoreUrl?: InputErrorProps['learnMoreUrl'];
        buttonProps?: InputErrorProps['buttonProps'];
    } => {
        switch (addressError?.type) {
            case 'deprecated':
                return {
                    learnMoreUrl: addressDeprecatedUrl ? ALL_URLS[addressDeprecatedUrl] : undefined,
                };
            case 'evmChecks':
                if (networkType === 'ethereum' && !checkAddressChecksum(address)) {
                    return {
                        buttonProps: {
                            onClick: () => {
                                setValue(inputName, toChecksumAddress(address), {
                                    shouldValidate: true,
                                });

                                setHasAddressChecksummed(true);
                            },
                            text: translationString('TR_CONVERT_TO_CHECKSUM_ADDRESS'),
                        },
                    };
                }
                if (!isExternalAddressCheckWarningDismissed) {
                    return {
                        buttonProps: {
                            onClick: async () => {
                                setIsExternalAddressCheckWarningDismissed(true);
                                await trigger(inputName);
                                clearErrors(inputName);
                                composeTransaction();
                            },
                            text: translationString('TR_I_UNDERSTAND_THE_RISK'),
                        },
                        learnMoreUrl: HELP_CENTER_EVM_SEND_TO_CONTRACT_URL,
                    };
                }

                return {};
            case 'solAssociatedAccountCheck':
                if (!isExternalAddressCheckWarningDismissed) {
                    return {
                        buttonProps: {
                            onClick: async () => {
                                setIsExternalAddressCheckWarningDismissed(true);
                                await trigger(inputName);
                                clearErrors(inputName);
                                composeTransaction();
                            },
                            text: translationString('TR_I_UNDERSTAND_THE_RISK'),
                        },
                        learnMoreUrl: HELP_CENTER_SOLANA_HELP_URL,
                    };
                }

                return {};

            default:
                return {};
        }
    };

    const setAutocorrectMessageWithTimeout = (message: string) => {
        setAutocorrectMessage(message);

        if (autocorrectTimeout.current) {
            clearTimeout(autocorrectTimeout.current);
        }

        autocorrectTimeout.current = setTimeout(() => {
            setAutocorrectMessage(undefined);
        }, 3000);
    };

    const { ref: inputRef, ...inputField } = register(inputName, {
        onChange: () => {
            composeTransaction(amountInputName);
            setHasAddressChecksummed(false);
            setAutocorrectMessage(undefined);

            if (autocorrectTimeout.current) {
                clearTimeout(autocorrectTimeout.current);
            }
        },
        required: translationString('RECIPIENT_IS_NOT_SET'),
        validate: {
            deprecated: (value: string) => {
                const url = isAddressDeprecated({ addressValidator, address: value, symbol });
                if (url) {
                    setAddressDeprecatedUrl(url);

                    return translationString('TR_UNSUPPORTED_ADDRESS_FORMAT');
                }
            },
            addressCorrection: (value: string) => {
                const correction = autocorrectAddress({ addressValidator, address: value, symbol });
                if (correction) {
                    setValue(inputName, correction.corrected, { shouldValidate: true });
                    composeTransaction();
                    setAutocorrectMessageWithTimeout(
                        translationString(autocorrectTranslationKeys[correction.type]),
                    );

                    return true;
                }
            },
            valid: (value: string) => {
                if (!addressValidator.isAddressValid(value, symbol)) {
                    return translationString('RECIPIENT_IS_NOT_VALID');
                }
            },
            // bech32m/Taproot addresses are valid but may not be supported by older FW
            firmware: (value: string) => {
                if (
                    networkType === 'bitcoin' &&
                    isTaprootAddress({ addressValidator, address: value, symbol }) &&
                    device?.unavailableCapabilities?.taproot
                ) {
                    return translationString('RECIPIENT_REQUIRES_UPDATE');
                }
            },
            evmChecks: async (checkedAddress: string) => {
                if (networkType !== 'ethereum' && networkType !== 'tron') return;

                if (!isOnline) {
                    return translationString('TR_ADDRESS_CANT_VERIFY_HISTORY');
                }

                const result = await TrezorConnect.getAccountInfo({
                    descriptor: checkedAddress,
                    coin: symbol,
                });

                if (!result.success) {
                    return translationString('TR_ADDRESS_CANT_VERIFY_HISTORY');
                }

                const { payload } = result;

                // 1. Validate address checksum.
                // Eth addresses are valid without checksum but Trezor displays them as checksummed.
                if (networkType === 'ethereum' && !checkAddressChecksum(checkedAddress)) {
                    const checksumAndUsageValidationResult = checkIsAddressNotUsedNotChecksummed(
                        checkedAddress,
                        payload.history,
                        checksummed => setValue(inputName, checksummed, { shouldValidate: true }),
                        setHasAddressChecksummed,
                    );
                    if (checksumAndUsageValidationResult) {
                        return translationString('TR_ETH_ADDRESS_NOT_USED_NOT_CHECKSUMMED');
                    }
                }

                if (!isExternalAddressCheckWarningDismissed && isExternalAddressCheckEnabled) {
                    const isContract = payload.misc?.contractInfo;
                    if (isContract) {
                        return translationString('TR_EVM_ADDRESS_IS_CONTRACT');
                    }
                }
            },
            solAssociatedAccountCheck: async (value: string) => {
                if (networkType === 'solana') {
                    if (!isOnline) {
                        return translationString('TR_ADDRESS_CANT_VERIFY_HISTORY');
                    }

                    const result = await TrezorConnect.getAccountInfo({
                        descriptor: value,
                        coin: symbol,
                        details: 'basic',
                    });

                    if (!result.success) {
                        return translationString('TR_ADDRESS_CANT_VERIFY_HISTORY');
                    }

                    if (!isExternalAddressCheckWarningDismissed && isExternalAddressCheckEnabled) {
                        if (isProgramDerivedAccount(result.payload)) {
                            return translationString('TR_SOL_ADDRESS_IS_ASSOCIATED_ACCOUNT');
                        }
                    }
                }
            },
            noSelfTransfer: (value: string) => {
                if (
                    (networkType === 'ripple' || (networkType === 'tron' && !selectedToken)) &&
                    value === descriptor
                ) {
                    return translationString('RECIPIENT_CANNOT_SEND_TO_MYSELF');
                }
            },
        },
    });

    // Required for the correct functionality of bottom text in the input.
    const addressLabelComponent = (
        <AccountLabelForOwnAddress address={addressValue} knownOnly symbol={symbol} />
    );
    const isAddressWithLabel = !!addressLabelComponent.type({
        symbol,
        address: addressValue,
        knownOnly: true,
    });

    const getBottomText = () => {
        if (addressError) {
            return <InputError message={addressError.message} {...getInputErrorProps()} />;
        }

        if (hasAddressChecksummed) {
            return (
                <Translation
                    id="TR_CHECKSUM_CONVERSION_INFO"
                    values={{
                        a: chunks => <Link href={HELP_CENTER_EVM_ADDRESS_CHECKSUM}>{chunks}</Link>,
                    }}
                />
            );
        }

        if (autocorrectMessage) {
            return autocorrectMessage;
        }

        return isAddressWithLabel ? addressLabelComponent : null;
    };

    const getBottomTextIconComponent = () => {
        if (addressError) {
            return <Icon as={WarningCircleIcon} size={16} intent="critical" />;
        }

        if (hasAddressChecksummed) {
            return <Icon as={CheckIcon} size={16} isDisabled={true} />;
        }

        if (autocorrectMessage) {
            return <Icon as={InfoIcon} size={16} intent="info" />;
        }

        if (isAddressWithLabel) {
            return <TokenIcon symbol={symbol} size={16} />;
        }

        return undefined;
    };

    return (
        <Input
            hasError={!!addressError}
            rightContent={<Icon as={QrCodeIcon} onClick={handleQrClick} />}
            label={<Translation id="RECIPIENT_ADDRESS" />}
            labelLeft={
                <Translation
                    id={outputsCount > 1 ? 'TR_SEND_RECIPIENT_ADDRESS' : 'TR_SEND_ADDRESS_SECTION'}
                    values={{ index: recipientId }}
                />
            }
            labelRight={
                <Row gap={16}>
                    {isDebug && <DevAddressBook outputId={outputId} account={account} />}
                    {shouldShowLabelAction && broadcastEnabled && (
                        <Text typographyStyle="body-sm" as="div">
                            <Labeling
                                deviceStaticSessionId={device.state.staticSessionId}
                                displayValue={
                                    <Text typographyStyle="body-sm-strong">
                                        <Translation id="TR_LABELING_ADD_LABEL" />
                                    </Text>
                                }
                                isAlwaysActive
                                gap={10}
                                placeholder={translationString('TR_LABELING_OUTPUT_LABEL')}
                                payload={{
                                    type: 'outputLabel',
                                    entityKey: account.key,
                                    // txid is not known at this moment. metadata is only saved
                                    // along with other sendForm data and processed in sendFormActions.
                                    txid: 'will-be-replaced',
                                    outputIndex: `${outputId}`,
                                    defaultValue: `${outputId}`,
                                    networkSymbol: symbol,
                                    accountDescriptor: descriptor,
                                }}
                                maxWidth={300}
                                onSubmit={value => {
                                    setValue(`outputs.${outputId}.label`, value || '');
                                    setDraftSaveRequest(true);

                                    return Promise.resolve(true);
                                }}
                            >
                                {label}
                            </Labeling>
                        </Text>
                    )}
                    {outputsCount > 1 && (
                        <IconButton
                            icon={XIcon}
                            intent="neutral"
                            size="small"
                            priority="secondary"
                            data-testid={`outputs.${outputId}.remove`}
                            onClick={() => {
                                removeOutput(outputId);
                                // compose by first Output
                                composeTransaction();
                            }}
                            tooltip={{ content: <Translation id="TR_REMOVE" /> }}
                        />
                    )}
                </Row>
            }
            bottomText={getBottomText()}
            bottomTextIconComponent={getBottomTextIconComponent()}
            data-testid={inputName}
            defaultValue={addressValue}
            maxLength={formInputsMaxLength.address}
            innerRef={inputRef}
            {...inputField}
        />
    );
};
