import React from 'react';
import styled from 'styled-components';
import { Input, colors, variables, Icon, Button } from '@trezor/components';
import { FormattedPlural } from 'react-intl';
import AddLabel from './components/AddLabel';
import { checkRippleEmptyAddress, scanQrRequest } from '@wallet-actions/sendFormActions';
import { useActions } from '@suite-hooks';
import { useSendFormContext } from '@wallet-hooks';
import { isAddressValid } from '@wallet-utils/validation';
import { getInputState } from '@wallet-utils/sendFormUtils';

import { AddressLabeling, QuestionTooltip, Translation } from '@suite-components';

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
        updateContext,
        removeOutput,
        composeTransaction,
        register,
        outputs,
        getValues,
        errors,
        setValue,
    } = useSendFormContext();
    const { descriptor, networkType, symbol } = account;
    const { openQrModal } = useActions({ openQrModal: scanQrRequest });
    const inputName = `outputs[${outputId}].address`;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const addressError = outputError ? outputError.address : undefined;
    // addressValue is a "defaultValue" from draft (`outputs` fields) OR regular "onChange" during lifecycle (`getValues` fields)
    // it needs to be done like that, because of `useFieldArray` architecture which requires defaultValue for registered inputs
    const addressValue = outputs[outputId].address || getValues(inputName) || '';

    return (
        <Input
            state={getInputState(addressError, addressValue)}
            monospace
            innerAddon={<AddLabel />}
            label={
                <Label>
                    <Left>
                        <Text>
                            {outputsCount > 1 && (
                                <>
                                    {outputId + 1}
                                    <FormattedPlural
                                        one="st"
                                        two="nd"
                                        few="rd"
                                        other="th"
                                        value={outputId + 1}
                                    />
                                </>
                            )}{' '}
                            <Translation id="TR_RECIPIENT_ADDRESS" />
                        </Text>
                        <QuestionTooltip messageId="TR_RECIPIENT_ADDRESS_TOOLTIP" />
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
                    <Translation id="TR_SCAN" />
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
            onChange={async () => {
                if (!addressError && networkType === 'ripple') {
                    const destinationAddressEmpty = await checkRippleEmptyAddress(
                        addressValue,
                        symbol,
                    );
                    updateContext({ destinationAddressEmpty });
                }
                composeTransaction(`outputs[${outputId}].amount`, !!addressError);
            }}
            bottomText={
                addressError ? (
                    addressError.message
                ) : (
                    <AddressLabeling address={addressValue} knownOnly />
                )
            }
            name={inputName}
            data-test={inputName}
            defaultValue={addressValue}
            innerRef={register({
                required: 'TR_ADDRESS_IS_NOT_SET',
                validate: (value: string) => {
                    if (!isAddressValid(value, symbol)) {
                        return 'TR_ADDRESS_IS_NOT_VALID';
                    }
                    if (networkType === 'ripple' && value === descriptor) {
                        return 'TR_XRP_CANNOT_SEND_TO_MYSELF';
                    }
                },
            })}
        />
    );
};
