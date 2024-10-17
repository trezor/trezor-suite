import { useCallback, useState } from 'react';
import { checkAddressCheckSum, toChecksumAddress } from 'web3-utils';
import styled, { useTheme } from 'styled-components';

import { Input, Button, IconButton, getInputStateTextColor, Icon } from '@trezor/components';
import { capitalizeFirstLetter } from '@trezor/utils';
import * as URLS from '@trezor/urls';
import { notificationsActions } from '@suite-common/toast-notifications';
import { formInputsMaxLength } from '@suite-common/validators';
import type { Output } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { useSelector } from 'src/hooks/suite';
import {
    isAddressValid,
    isAddressDeprecated,
    isTaprootAddress,
    isBech32AddressUppercase,
    getInputState,
} from '@suite-common/wallet-utils';

import { AddressLabeling, MetadataLabeling } from 'src/components/suite';
import { Link } from '@trezor/components';
import { Translation } from '../../../../components/suite/Translation';

import { scanOrRequestSendFormThunk } from 'src/actions/wallet/send/sendFormThunks';
import { useDevice, useDispatch, useTranslation } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { getProtocolInfo } from 'src/utils/suite/protocol';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';

import { InputError } from 'src/components/wallet';
import { InputErrorProps } from 'src/components/wallet/InputError';
import { Row } from '@trezor/components';

import { HELP_CENTER_EVM_ADDRESS_CHECKSUM } from '@trezor/urls';
import { spacings } from '@trezor/theme';
import { CoinLogo } from '@trezor/product-components';

const Container = styled.div`
    position: relative;
`;

const Text = styled.span`
    display: flex;
    align-items: center;

    > div {
        margin-left: 4px;
    }
`;

const MetadataLabelingWrapper = styled.div`
    max-width: 200px;
`;
interface AddressProps {
    outputId: number;
    outputsCount: number;
    output: Partial<Output>;
}

export const Address = ({ output, outputId, outputsCount }: AddressProps) => {
    const [addressDeprecatedUrl, setAddressDeprecatedUrl] =
        useState<ReturnType<typeof isAddressDeprecated>>(undefined);
    const [hasAddressChecksummed, setHasAddressChecksummed] = useState<boolean | undefined>();
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
        metadataEnabled,
        watch,
        setDraftSaveRequest,
    } = useSendFormContext();
    const { translationString } = useTranslation();
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
    const options = getDefaultValue('options', []);
    const broadcastEnabled = options.includes('broadcast');
    const isOnline = useSelector(state => state.suite.online);
    const theme = useTheme();
    const getInputErrorState = () => {
        if (hasAddressChecksummed) {
            return 'primary';
        }
        if (addressError) {
            return getInputState(addressError);
        }

        return undefined;
    };

    const handleQrClick = useCallback(async () => {
        const uri = await dispatch(scanOrRequestSendFormThunk()).unwrap();

        if (typeof uri !== 'string') {
            return;
        }

        const protocol = getProtocolInfo(uri);

        if (protocol) {
            const isSymbolValidProtocol = getNetworkSymbolForProtocol(protocol.scheme) === symbol;

            if (!isSymbolValidProtocol) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'qr-incorrect-coin-scheme-protocol',
                        coin: capitalizeFirstLetter(protocol.scheme),
                    }),
                );

                return;
            }

            setValue(inputName, protocol.address, { shouldValidate: true });

            if (protocol.amount) {
                setValue(amountInputName, String(protocol.amount), {
                    shouldValidate: true,
                });
            }

            composeTransaction(amountInputName);

            return;
        }

        if (isAddressValid(uri, symbol)) {
            setValue(inputName, uri, { shouldValidate: true });

            composeTransaction(inputName);
        } else {
            dispatch(notificationsActions.addToast({ type: 'qr-incorrect-address' }));
        }
    }, [amountInputName, composeTransaction, dispatch, inputName, setValue, symbol]);

    const getValidationButtonProps = (): InputErrorProps['button'] => {
        switch (addressError?.type) {
            case 'deprecated':
                if (addressDeprecatedUrl) {
                    return {
                        url: URLS[addressDeprecatedUrl],
                    };
                }

                return undefined;

            case 'checksum':
                return {
                    onClick: () => {
                        setValue(inputName, toChecksumAddress(address), {
                            shouldValidate: true,
                        });

                        setHasAddressChecksummed(true);
                    },
                    text: translationString('TR_CONVERT_TO_CHECKSUM_ADDRESS'),
                };

            case 'uppercase':
                return {
                    onClick: () =>
                        setValue(inputName, address.toLowerCase(), {
                            shouldValidate: true,
                        }),
                    text: translationString('TR_CONVERT_TO_LOWERCASE'),
                };
            default:
                return undefined;
        }
    };

    const { ref: inputRef, ...inputField } = register(inputName, {
        onChange: () => {
            composeTransaction(amountInputName);
            setHasAddressChecksummed(false);
        },
        required: translationString('RECIPIENT_IS_NOT_SET'),
        validate: {
            deprecated: (value: string) => {
                const url = isAddressDeprecated(value, symbol);
                if (url) {
                    setAddressDeprecatedUrl(url);

                    return translationString('TR_UNSUPPORTED_ADDRESS_FORMAT');
                }
            },
            valid: (value: string) => {
                if (!isAddressValid(value, symbol)) {
                    return translationString('RECIPIENT_IS_NOT_VALID');
                }
            },
            // bech32m/Taproot addresses are valid but may not be supported by older FW
            firmware: (value: string) => {
                if (
                    networkType === 'bitcoin' &&
                    isTaprootAddress(value, symbol) &&
                    device?.unavailableCapabilities?.taproot
                ) {
                    return translationString('RECIPIENT_REQUIRES_UPDATE');
                }
            },
            // bech32 addresses are valid as uppercase but are not accepted by Trezor
            uppercase: (value: string) => {
                if (networkType === 'bitcoin' && isBech32AddressUppercase(value)) {
                    return translationString('RECIPIENT_IS_NOT_VALID');
                }
            },
            // Eth addresses are valid without checksum but Trezor displays them as checksummed.
            checksum: async (address: string) => {
                if (networkType === 'ethereum' && !checkAddressCheckSum(address)) {
                    if (isOnline) {
                        const params = {
                            descriptor: address,
                            coin: symbol,
                        };
                        // 1. If the address is used but unchecksummed, then Suite will automatically
                        // convert the address to the correct checksummed form and inform the user as described in the OP.
                        const result = await TrezorConnect.getAccountInfo(params);

                        if (result.success) {
                            const hasHistory = result.payload.history.total !== 0;
                            if (hasHistory) {
                                setValue(inputName, toChecksumAddress(address), {
                                    shouldValidate: true,
                                });
                                setHasAddressChecksummed(true);

                                return;
                            }

                            // 2. If the address is not checksummed at all and not found in blockbook
                            // offer to checksum it with a button.
                            if (!hasHistory && address === address.toLowerCase()) {
                                return translationString('TR_ETH_ADDRESS_NOT_USED_NOT_CHECKSUMMED');
                            }
                        }
                    }

                    return translationString('TR_ETH_ADDRESS_CANT_VERIFY_HISTORY');
                }
            },
            rippleToSelf: (value: string) => {
                if (networkType === 'ripple' && value === descriptor) {
                    return translationString('RECIPIENT_CANNOT_SEND_TO_MYSELF');
                }
            },
        },
    });

    // Required for the correct functionality of bottom text in the input.
    const addressLabelComponent = (
        <AddressLabeling address={addressValue} knownOnly networkSymbol={symbol} />
    );
    const isAddressWithLabel = !!addressLabelComponent.type({
        networkSymbol: symbol,
        address: addressValue,
        knownOnly: true,
    });
    const addressBottomText = isAddressWithLabel ? addressLabelComponent : null;

    const getBottomText = () => {
        if (hasAddressChecksummed) {
            return (
                <Row width="100%" justifyContent="flex-start" gap={spacings.xs}>
                    <Translation
                        id="TR_CHECKSUM_CONVERSION_INFO"
                        values={{
                            a: chunks => (
                                <Link
                                    href={HELP_CENTER_EVM_ADDRESS_CHECKSUM}
                                    variant="nostyle"
                                    icon="arrowUpRight"
                                    type="label"
                                >
                                    {chunks}
                                </Link>
                            ),
                        }}
                    />
                </Row>
            );
        }
        if (addressError) {
            return (
                <InputError message={addressError.message} button={getValidationButtonProps()} />
            );
        }

        return addressBottomText;
    };

    const getBottomTextIconComponent = () => {
        if (hasAddressChecksummed) {
            return <Icon name="check" size="medium" color={theme.iconDisabled} />;
        }

        if (isAddressWithLabel) {
            return <CoinLogo symbol={symbol} size={16} />;
        }

        if (addressError) {
            return (
                <Icon
                    name="warningCircle"
                    size="medium"
                    color={getInputStateTextColor('error', theme)}
                />
            );
        }

        return undefined;
    };

    return (
        <Container>
            <Input
                inputState={getInputErrorState()}
                innerAddon={
                    metadataEnabled && broadcastEnabled ? (
                        <MetadataLabelingWrapper>
                            <MetadataLabeling
                                defaultVisibleValue=""
                                payload={{
                                    type: 'outputLabel',
                                    entityKey: account.key,
                                    // txid is not known at this moment. metadata is only saved
                                    // along with other sendForm data and processed in sendFormActions.
                                    txid: 'will-be-replaced',
                                    outputIndex: outputId,
                                    defaultValue: `${outputId}`,
                                    value: label,
                                }}
                                onSubmit={(value: string | undefined) => {
                                    setValue(`outputs.${outputId}.label`, value || '');
                                    setDraftSaveRequest(true);
                                }}
                                visible
                            />
                        </MetadataLabelingWrapper>
                    ) : undefined
                }
                label={
                    <Text>
                        <Translation id="RECIPIENT_ADDRESS" />
                    </Text>
                }
                labelHoverRight={
                    <Button variant="tertiary" size="tiny" icon="qrCode" onClick={handleQrClick}>
                        <Translation id="RECIPIENT_SCAN" />
                    </Button>
                }
                labelLeft={
                    <p>
                        <Translation
                            id={
                                outputsCount > 1
                                    ? 'TR_SEND_RECIPIENT_ADDRESS'
                                    : 'TR_SEND_ADDRESS_SECTION'
                            }
                            values={{ index: recipientId }}
                        />
                    </p>
                }
                labelRight={
                    outputsCount > 1 ? (
                        <IconButton
                            icon="x"
                            size="tiny"
                            variant="tertiary"
                            data-testid={`outputs.${outputId}.remove`}
                            onClick={() => {
                                removeOutput(outputId);
                                // compose by first Output
                                composeTransaction();
                            }}
                        />
                    ) : undefined
                }
                bottomText={getBottomText()}
                bottomTextIconComponent={getBottomTextIconComponent()}
                data-testid={inputName}
                defaultValue={addressValue}
                maxLength={formInputsMaxLength.address}
                innerRef={inputRef}
                {...inputField}
            />
        </Container>
    );
};
