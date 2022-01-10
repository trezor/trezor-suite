import React from 'react';
import styled from 'styled-components';
import { isValidChecksumAddress, toChecksumAddress } from 'ethereumjs-util';
import { Input, useTheme, variables, Icon, Button } from '@trezor/components';
import { AddressLabeling, Translation, ReadMoreLink, MetadataLabeling } from '@suite-components';
import { InputError } from '@wallet-components';
import { scanQrRequest } from '@wallet-actions/sendFormActions';
import { useActions, useDevice } from '@suite-hooks';
import { useSendFormContext } from '@wallet-hooks';
import {
    isAddressValid,
    isAddressDeprecated,
    isTaprootAddress,
    isBech32AddressUppercase,
} from '@wallet-utils/validation';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { MAX_LENGTH } from '@suite-constants/inputs';
import ConvertAddress from './components/Convert';
import { Output } from '@wallet-types/sendForm';

const Label = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const Left = styled.div`
    display: flex;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const Remove = styled.div`
    display: flex;
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const StyledIcon = styled(Icon)`
    display: flex;
`;

interface Props {
    outputId: number;
    outputsCount: number;
    output: Partial<Output>;
}

const Address = ({ output, outputId, outputsCount }: Props) => {
    const theme = useTheme();
    const { device } = useDevice();
    const {
        account,
        removeOutput,
        composeTransaction,
        register,
        getDefaultValue,
        errors,
        setValue,
        metadataEnabled,
        watch,
        setDraftSaveRequest,
    } = useSendFormContext();
    const { openQrModal } = useActions({ openQrModal: scanQrRequest });
    const { descriptor, networkType, symbol } = account;
    const inputName = `outputs[${outputId}].address`;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const addressError = outputError ? outputError.address : undefined;
    const addressValue = getDefaultValue(inputName, output.address || '');
    const recipientId = outputId + 1;
    const label = watch(`outputs[${outputId}].label`, '');
    const options = getDefaultValue('options', []);
    const broadcastEnabled = options.includes('broadcast');

    return (
        <Input
            state={getInputState(addressError, addressValue)}
            monospace
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
                ) : null
            }
            label={
                <Label>
                    <Left>
                        <Text>
                            {outputsCount > 1 && `${recipientId}. `}
                            <Translation id="RECIPIENT_ADDRESS" />
                        </Text>
                    </Left>
                </Label>
            }
            labelAddon={
                <Button
                    variant="tertiary"
                    icon="QR"
                    onClick={async () => {
                        const result = await openQrModal();
                        if (result) {
                            setValue(inputName, result.address, { shouldValidate: true });
                            if (result.amount) {
                                setValue(`outputs[${outputId}].amount`, result.amount, {
                                    shouldValidate: true,
                                });
                                // if amount is set compose by amount
                                composeTransaction(`outputs[${outputId}].amount`);
                            } else {
                                // otherwise compose by address
                                composeTransaction(inputName);
                            }
                        }
                    }}
                >
                    <Translation id="RECIPIENT_SCAN" />
                </Button>
            }
            labelRight={
                outputsCount > 1 ? (
                    <Remove
                        data-test={`outputs[${outputId}].remove`}
                        onClick={() => {
                            removeOutput(outputId);
                            // compose by first Output
                            composeTransaction();
                        }}
                    >
                        <StyledIcon
                            size={20}
                            color={theme.TYPE_LIGHT_GREY}
                            icon="CROSS"
                            useCursorPointer
                        />
                    </Remove>
                ) : undefined
            }
            onChange={() => {
                composeTransaction(`outputs[${outputId}].amount`);
            }}
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
                validate: value => {
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
                },
            })}
        />
    );
};

export default Address;
