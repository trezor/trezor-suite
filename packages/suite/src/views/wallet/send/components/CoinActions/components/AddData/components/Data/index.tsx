import React from 'react';
import styled from 'styled-components';
import { Textarea, Icon } from '@trezor/components';
import { QuestionTooltip, Translation } from '@suite-components';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

interface Props {
    close: () => void;
}

export default ({ close }: Props) => {
    const {
        register,
        errors,
        getValues,
        setValue,
        setAmount,
        composeTransaction,
    } = useSendFormContext();

    const inputAsciiName = 'ethereumDataAscii';
    const inputHexName = 'ethereumDataHex';

    const asciiValue = getValues(inputAsciiName) || '';
    const hexValue = getValues(inputHexName) || '';
    const amount = getValues(`outputs[0].amount`);
    const asciiError = errors.ethereumDataAscii;
    const hexError = errors.ethereumDataHex;

    return (
        <>
            <Textarea
                state={getInputState(asciiError, asciiValue)}
                monospace
                name={inputAsciiName}
                data-test={inputAsciiName}
                defaultValue={asciiValue}
                innerRef={register({
                    required: 'TR_DATA_IS_NOT_SET',
                })}
                onChange={event => {
                    setValue(
                        inputHexName,
                        Buffer.from(event.target.value, 'ascii').toString('hex'),
                        { shouldValidate: true },
                    );
                    if (!amount) {
                        setAmount(0, '0');
                    }
                    if ((event.target.value === '' || asciiError) && amount === '0') {
                        setAmount(0, '');
                    }
                    composeTransaction(inputAsciiName, !!asciiError);
                }}
                bottomText={asciiError && asciiError.message}
                label={
                    <Label>
                        <Text>
                            <Translation id="TR_SEND_DATA" />
                        </Text>
                        <QuestionTooltip messageId="TR_SEND_DATA_TOOLTIP" />
                    </Label>
                }
            />
            <Textarea
                state={getInputState(hexError, hexValue)}
                monospace
                name={inputHexName}
                data-test={inputHexName}
                defaultValue={hexValue}
                innerRef={register({
                    required: 'TR_DATA_IS_NOT_SET',
                    validate: (value: string) => {
                        if (value.length % 2 !== 0) return 'TR_DATA_IS_NOT_VALID_HEX';
                        if (value.length > 80 * 2) return 'TR_DATA_HEX_TOO_BIG';
                        if (!/^[\da-f]+$/.test(value)) return 'TR_DATA_IS_NOT_VALID_HEX';
                    },
                })}
                onChange={event => {
                    setValue(
                        inputAsciiName,
                        !hexError ? Buffer.from(event.target.value, 'hex').toString('ascii') : '',
                    );
                    if (!amount) {
                        setValue('outputs[0].amount', '0');
                    }
                    if ((event.target.value === '' || hexError) && amount === '0') {
                        setValue('outputs[0].amount', '');
                    }
                    composeTransaction(inputHexName, !!hexError);
                }}
                bottomText={hexError && hexError.message}
                labelRight={
                    <StyledIcon
                        size={20}
                        icon="CROSS"
                        onClick={() => {
                            if (amount === '0') {
                                setValue('outputs[0].amount', '');
                            }
                            close();
                        }}
                    />
                }
            />
        </>
    );
};
