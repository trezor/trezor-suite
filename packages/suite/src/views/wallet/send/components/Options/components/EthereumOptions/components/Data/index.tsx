import React from 'react';
import styled from 'styled-components';
import { Textarea, Icon } from '@trezor/components';
import { QuestionTooltip, Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { isHexValid } from '@wallet-utils/validation';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const Space = styled.div`
    display: flex;
    justify-content: center;
    min-width: 65px;
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
        outputs,
        errors,
        getDefaultValue,
        setValue,
        setAmount,
        composeTransaction,
    } = useSendFormContext();

    const inputAsciiName = 'ethereumDataAscii';
    const inputHexName = 'ethereumDataHex';

    const asciiValue = getDefaultValue(inputAsciiName);
    const hexValue = getDefaultValue(inputHexName);
    const amount = getDefaultValue('outputs[0].amount', outputs[0].amount);
    const asciiError = errors.ethereumDataAscii;
    const hexError = errors.ethereumDataHex;

    return (
        <Wrapper>
            <Textarea
                state={getInputState(asciiError, asciiValue)}
                monospace
                name={inputAsciiName}
                data-test={inputAsciiName}
                defaultValue={asciiValue}
                innerRef={register({
                    required: 'DATA_NOT_SET',
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
                bottomText={<InputError error={asciiError} />}
                label={
                    <Label>
                        <Text>
                            <Translation id="DATA_ETH" />
                        </Text>
                        <QuestionTooltip messageId="DATA_ETH_TOOLTIP" />
                    </Label>
                }
            />
            <Space> = </Space>
            <Textarea
                state={getInputState(hexError, hexValue)}
                monospace
                name={inputHexName}
                data-test={inputHexName}
                defaultValue={hexValue}
                innerRef={register({
                    required: 'DATA_NOT_SET',
                    validate: (value: string) => {
                        if (!isHexValid(value, '0x')) return 'DATA_NOT_VALID_HEX';
                        if (value.length > 80 * 2) return 'DATA_HEX_TOO_BIG'; // TODO: is the limit necessary?
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
                bottomText={<InputError error={hexError} />}
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
        </Wrapper>
    );
};
