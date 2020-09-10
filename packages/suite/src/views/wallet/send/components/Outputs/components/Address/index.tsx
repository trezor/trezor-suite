import React from 'react';
import styled from 'styled-components';
import { Input, colors, variables, Icon, Button } from '@trezor/components';
import { AddressLabeling, Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { scanQrRequest } from '@wallet-actions/sendFormActions';
import { useActions } from '@suite-hooks';
import { useSendFormContext } from '@wallet-hooks';
import { isAddressValid } from '@wallet-utils/validation';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { MAX_LENGTH } from '@suite-constants/inputs';

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
    cursor: pointer;
    display: flex;
`;

export default ({ outputId, outputsCount }: { outputId: number; outputsCount: number }) => {
    const {
        account,
        removeOutput,
        composeTransaction,
        register,
        outputs,
        getDefaultValue,
        errors,
        setValue,
    } = useSendFormContext();
    const { descriptor, networkType, symbol } = account;
    const { openQrModal } = useActions({ openQrModal: scanQrRequest });
    const inputName = `outputs[${outputId}].address`;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const addressError = outputError ? outputError.address : undefined;
    const addressValue = getDefaultValue(inputName, outputs[outputId].address || '');
    const recipientId = outputId + 1;

    return (
        <Input
            state={getInputState(addressError, addressValue)}
            monospace
            // innerAddon={
            //     <AddLabel onClick={() => setValue(`outputs[${outputId}].labelInput`, 'enabled')} />
            // }
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
                            composeTransaction(`outputs[0].amount`);
                        }}
                    >
                        <StyledIcon size={20} color={colors.BLACK50} icon="CROSS" />
                    </Remove>
                ) : undefined
            }
            onChange={() => {
                composeTransaction(`outputs[${outputId}].amount`, !!addressError);
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
                validate: (value: string) => {
                    if (!isAddressValid(value, symbol)) {
                        return 'RECIPIENT_IS_NOT_VALID';
                    }
                    if (networkType === 'ripple' && value === descriptor) {
                        return 'RECIPIENT_CANNOT_SEND_TO_MYSELF';
                    }
                },
            })}
        />
    );
};
