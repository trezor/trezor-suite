import React from 'react';
import styled from 'styled-components';
import { Textarea, Icon } from '@trezor/components';
import { QuestionTooltip } from '@suite-components';
import { InputError } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { isHexValid } from '@wallet-utils/validation';
import { MAX_LENGTH } from '@suite-constants/inputs';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
`;

const Space = styled.div`
    display: flex;
    justify-content: center;
    min-width: 65px;
`;

interface Props {
    close: () => void;
}

const Data = ({ close }: Props) => {
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
                maxLength={MAX_LENGTH.ETH_DATA}
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
                    composeTransaction(inputAsciiName);
                }}
                bottomText={<InputError error={asciiError} />}
                label={<QuestionTooltip label="DATA_ETH" tooltip="DATA_ETH_TOOLTIP" />}
            />
            <Space> = </Space>
            <Textarea
                state={getInputState(hexError, hexValue)}
                monospace
                name={inputHexName}
                data-test={inputHexName}
                defaultValue={hexValue}
                maxLength={MAX_LENGTH.ETH_DATA}
                innerRef={register({
                    required: 'DATA_NOT_SET',
                    validate: (value: string) => {
                        if (!isHexValid(value, '0x')) return 'DATA_NOT_VALID_HEX';
                        if (value.length > 8192 * 2) return 'DATA_HEX_TOO_BIG'; // 8192 bytes limit for protobuf single message encoding in FW
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
                    composeTransaction(inputHexName);
                }}
                bottomText={<InputError error={hexError} />}
                labelRight={
                    <Icon
                        size={20}
                        icon="CROSS"
                        data-test="send/close-ethereum-data"
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

export default Data;
