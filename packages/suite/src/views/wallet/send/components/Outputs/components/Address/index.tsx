import { useCallback, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { isValidChecksumAddress, toChecksumAddress } from '@ethereumjs/util';
import { capitalizeFirstLetter } from '@trezor/utils';
import { Input, Icon, Button, Tooltip } from '@trezor/components';
import { AddressLabeling, Translation, MetadataLabeling } from 'src/components/suite';
import { scanQrRequest } from 'src/actions/wallet/sendFormActions';
import { useDevice, useDispatch, useTranslation } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { getProtocolInfo } from 'src/utils/suite/protocol';
import {
    isAddressValid,
    isAddressDeprecated,
    isTaprootAddress,
    isBech32AddressUppercase,
    getInputState,
} from '@suite-common/wallet-utils';
import { MAX_LENGTH } from 'src/constants/suite/inputs';
import { PROTOCOL_TO_NETWORK } from 'src/constants/suite/protocol';
import { notificationsActions } from '@suite-common/toast-notifications';

import type { Output } from 'src/types/wallet/sendForm';
import { InputError } from 'src/components/wallet';

const Text = styled.span`
    display: flex;
    align-items: center;

    > div {
        margin-left: 4px;
    }
`;

const StyledIcon = styled(Icon)`
    display: flex;
`;

interface AddressProps {
    outputId: number;
    outputsCount: number;
    output: Partial<Output>;
}

export const Address = ({ output, outputId, outputsCount }: AddressProps) => {
    const [addressDeprecatedUrl, setAddressDeprecatedUrl] = useState<string | undefined>(undefined);
    const dispatch = useDispatch();
    const theme = useTheme();
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
    // if address is not valid then compose process will never be triggered,
    // however if address is changed compose process may return `AMOUNT_IS_NOT_ENOUGH` which should appear under the amount filed
    const amountInputName = `outputs.${outputId}.amount` as const;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const addressError = outputError ? outputError.address : undefined;
    const addressValue = getDefaultValue(inputName, output.address || '');
    const recipientId = outputId + 1;
    const label = watch(`outputs.${outputId}.label`, '');
    const address = watch(inputName);
    const options = getDefaultValue('options', []);
    const broadcastEnabled = options.includes('broadcast');
    const inputState = getInputState(addressError, addressValue);

    const handleQrClick = useCallback(async () => {
        const uri = await dispatch(scanQrRequest());

        if (typeof uri !== 'string') {
            return;
        }

        const protocol = getProtocolInfo(uri);

        if (protocol) {
            const isSymbolValidProtocol = PROTOCOL_TO_NETWORK[protocol.scheme] === symbol;

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

    const getValidationButtonProps = () => {
        switch (addressError?.type) {
            case 'deprecated':
                if (addressDeprecatedUrl) {
                    return {
                        url: addressDeprecatedUrl,
                    };
                }
                break;
            case 'checksum':
                return {
                    onClick: () =>
                        setValue(inputName, toChecksumAddress(address), {
                            shouldValidate: true,
                        }),
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
        onChange: () => composeTransaction(amountInputName),
        required: translationString('RECIPIENT_IS_NOT_SET'),
        validate: {
            deprecated: (value: string) => {
                const url = isAddressDeprecated(value, symbol);
                if (url) {
                    setAddressDeprecatedUrl(url);
                    return translationString('TR_UNSUPPORTED_ADDRESS_FORMAT', {
                        url,
                    });
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
            // eth addresses are valid without checksum but Trezor displays them as checksummed
            checksum: (value: string) => {
                if (networkType === 'ethereum' && !isValidChecksumAddress(value)) {
                    return translationString('RECIPIENT_IS_NOT_VALID');
                }
            },
            rippleToSelf: (value: string) => {
                if (networkType === 'ripple' && value === descriptor) {
                    return translationString('RECIPIENT_CANNOT_SEND_TO_MYSELF');
                }
            },
        },
    });

    return (
        <Input
            inputState={inputState}
            innerAddon={
                metadataEnabled && broadcastEnabled ? (
                    <MetadataLabeling
                        defaultVisibleValue=""
                        payload={{
                            type: 'outputLabel',
                            entityKey: account.key,
                            // txid is not known at this moment. metadata is only saved
                            // along with other sendForm data and processed in sendFormActions
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
                ) : undefined
            }
            label={
                <Text>
                    {outputsCount > 1 && `${recipientId}.`} &nbsp;
                    <Translation id="RECIPIENT_ADDRESS" />
                    {inputState === 'success' && (
                        <Tooltip content={<Translation id="TR_ADDRESS_FORMAT" />}>
                            <Icon icon="CHECK" size={18} color={theme.TYPE_GREEN} />
                        </Tooltip>
                    )}
                </Text>
            }
            labelHoverAddon={
                <Button variant="tertiary" icon="QR" onClick={handleQrClick}>
                    <Translation id="RECIPIENT_SCAN" />
                </Button>
            }
            labelRight={
                outputsCount > 1 ? (
                    <StyledIcon
                        size={16}
                        color={theme.TYPE_LIGHT_GREY}
                        icon="CROSS"
                        useCursorPointer
                        data-test={`outputs.${outputId}.remove`}
                        onClick={() => {
                            removeOutput(outputId);
                            // compose by first Output
                            composeTransaction();
                        }}
                    />
                ) : undefined
            }
            bottomText={
                addressError ? (
                    <InputError
                        message={addressError.message}
                        button={getValidationButtonProps()}
                    />
                ) : (
                    <AddressLabeling address={addressValue} knownOnly />
                )
            }
            data-test={inputName}
            defaultValue={addressValue}
            maxLength={MAX_LENGTH.ADDRESS}
            innerRef={inputRef}
            {...inputField}
        />
    );
};
