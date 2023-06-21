import React, { useCallback } from 'react';
import styled from 'styled-components';
import { isValidChecksumAddress, toChecksumAddress } from 'ethereumjs-util';
import { capitalizeFirstLetter } from '@trezor/utils';
import { Input, useTheme, Icon, Button, Tooltip } from '@trezor/components';
import { AddressLabeling, Translation, ReadMoreLink, MetadataLabeling } from 'src/components/suite';
import { InputError } from 'src/components/wallet';
import { scanQrRequest } from 'src/actions/wallet/sendFormActions';
import { useActions, useDevice } from 'src/hooks/suite';
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
import { ConvertAddress } from './components/ConvertAddress';
import { PROTOCOL_TO_NETWORK } from 'src/constants/suite/protocol';
import { notificationsActions } from '@suite-common/toast-notifications';

import type { Output } from 'src/types/wallet/sendForm';

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
    const { openQrModal, addToast } = useActions({
        openQrModal: scanQrRequest,
        addToast: notificationsActions.addToast,
    });

    const { descriptor, networkType, symbol } = account;
    const inputName = `outputs[${outputId}].address`;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const addressError = outputError ? outputError.address : undefined;
    const addressValue = getDefaultValue(inputName, output.address || '');
    const recipientId = outputId + 1;
    const label = watch(`outputs[${outputId}].label`, '');
    const options = getDefaultValue('options', []);
    const broadcastEnabled = options.includes('broadcast');
    const inputState = getInputState(addressError, addressValue);

    const handleQrClick = useCallback(async () => {
        const uri = await openQrModal();

        if (typeof uri !== 'string') {
            return;
        }

        const protocol = getProtocolInfo(uri);

        if (protocol) {
            const isSymbolValidProtocol = PROTOCOL_TO_NETWORK[protocol.scheme] === symbol;

            if (!isSymbolValidProtocol) {
                addToast({
                    type: 'qr-incorrect-coin-scheme-protocol',
                    coin: capitalizeFirstLetter(protocol.scheme),
                });

                return;
            }

            setValue(inputName, protocol.address, { shouldValidate: true });

            if (protocol.amount) {
                setValue(`outputs[${outputId}].amount`, String(protocol.amount), {
                    shouldValidate: true,
                });
            }

            // if amount is set compose by amount otherwise compose by address
            composeTransaction(protocol.amount ? `outputs[${outputId}].amount` : inputName);

            return;
        }

        if (isAddressValid(uri, symbol)) {
            setValue(inputName, uri, { shouldValidate: true });

            composeTransaction(inputName);
        } else {
            addToast({
                type: 'qr-incorrect-address',
            });
        }
    }, [composeTransaction, inputName, openQrModal, outputId, setValue, symbol, addToast]);

    const validateAddress = (value: string) => {
        if (!isAddressValid(value, symbol)) {
            const addressDeprecatedUrl = isAddressDeprecated(value, symbol);

            if (addressDeprecatedUrl) {
                return (
                    <ReadMoreLink
                        message="RECIPIENT_FORMAT_DEPRECATED"
                        url={addressDeprecatedUrl}
                    />
                );
            }

            return 'RECIPIENT_IS_NOT_VALID';
        }
        // bech32m/Taproot addresses are valid but may not be supported by older FW
        if (
            networkType === 'bitcoin' &&
            isTaprootAddress(value, symbol) &&
            device?.unavailableCapabilities?.taproot
        ) {
            return 'RECIPIENT_REQUIRES_UPDATE';
        }

        // bech32 addresses are valid as uppercase but are not accepted by Trezor
        if (networkType === 'bitcoin' && isBech32AddressUppercase(value)) {
            return (
                <ConvertAddress
                    label="RECIPIENT_FORMAT_UPPERCASE"
                    onClick={() => {
                        setValue(inputName, value.toLowerCase(), {
                            shouldValidate: true,
                        });
                    }}
                />
            );
        }
        // eth addresses are valid without checksum but Trezor displays them as checksummed
        if (networkType === 'ethereum' && !isValidChecksumAddress(value)) {
            return (
                <ConvertAddress
                    label="RECIPIENT_FORMAT_CHECKSUM"
                    onClick={() => {
                        setValue(inputName, toChecksumAddress(value), {
                            shouldValidate: true,
                        });
                    }}
                />
            );
        }

        if (networkType === 'ripple' && value === descriptor) {
            return 'RECIPIENT_CANNOT_SEND_TO_MYSELF';
        }
    };

    return (
        <Input
            inputState={inputState}
            isMonospace
            innerAddon={
                metadataEnabled && broadcastEnabled ? (
                    <MetadataLabeling
                        defaultVisibleValue=""
                        payload={{
                            type: 'outputLabel',
                            accountKey: account.key,
                            // txid is not known at this moment. metadata is only saved
                            // along with other sendForm data and processed in sendFormActions
                            txid: 'will-be-replaced',
                            outputIndex: outputId,
                            defaultValue: `${outputId}`,
                            value: label,
                        }}
                        onSubmit={(value: string | undefined) => {
                            setValue(`outputs[${outputId}].label`, value || '');
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
            labelAddon={
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
                        data-test={`outputs[${outputId}].remove`}
                        onClick={() => {
                            removeOutput(outputId);
                            // compose by first Output
                            composeTransaction();
                        }}
                    />
                ) : undefined
            }
            onChange={() => composeTransaction(`outputs[${outputId}].amount`)}
            bottomText={
                addressError ? (
                    <InputError error={addressError} />
                ) : (
                    <AddressLabeling address={addressValue} knownOnly />
                )
            }
            name={inputName}
            data-test={inputName}
            defaultValue={addressValue}
            maxLength={MAX_LENGTH.ADDRESS}
            innerRef={register({
                required: 'RECIPIENT_IS_NOT_SET',
                validate: validateAddress,
            })}
        />
    );
};
