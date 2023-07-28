import React from 'react';
import styled from 'styled-components';
import { Textarea, Icon } from '@trezor/components';
import { QuestionTooltip } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { getInputState, isHexValid } from '@suite-common/wallet-utils';
import { MAX_LENGTH } from 'src/constants/suite/inputs';
import { useTranslation } from 'src/hooks/suite';

const inputAsciiName = 'ethereumDataAscii';
const inputHexName = 'ethereumDataHex';
const inputAmountName = 'outputs.0.amount';

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

interface DataProps {
    close: () => void;
}

export const Data = ({ close }: DataProps) => {
    const {
        register,
        formState: { errors },
        setValue,
        setAmount,
        composeTransaction,
        watch,
    } = useSendFormContext();
    const { translationString } = useTranslation();

    const [asciiValue, hexValue, amount] = watch([inputAsciiName, inputHexName, inputAmountName]);

    const asciiError = errors.ethereumDataAscii;
    const hexError = errors.ethereumDataHex;

    const { ref: asciiRef, ...asciiField } = register(inputAsciiName, {
        required: translationString('DATA_NOT_SET'),
        onChange: event => {
            setValue(inputHexName, Buffer.from(event.target.value, 'ascii').toString('hex'), {
                shouldValidate: true,
            });
            if (!amount) {
                setAmount(0, '0');
            }
            if ((event.target.value === '' || asciiError) && amount === '0') {
                setAmount(0, '');
            }
            composeTransaction(inputAsciiName);
        },
    });
    const { ref: hexRef, ...hexField } = register(inputHexName, {
        onChange: event => {
            setValue(
                inputAsciiName,
                !hexError ? Buffer.from(event.target.value, 'hex').toString('ascii') : '',
            );
            if (!amount) {
                setValue(inputAmountName, '0');
            }
            if ((event.target.value === '' || hexError) && amount === '0') {
                setValue(inputAmountName, '');
            }
            composeTransaction(inputHexName);
        },
        required: translationString('DATA_NOT_SET'),
        validate: (value = '') => {
            if (!isHexValid(value, '0x')) return translationString('DATA_NOT_VALID_HEX');
            if (value.length > 8192 * 2) return translationString('DATA_HEX_TOO_BIG'); // 8192 bytes limit for protobuf single message encoding in FW
        },
    });

    return (
        <Wrapper>
            <Textarea
                inputState={getInputState(asciiError, asciiValue)}
                isMonospace
                data-test={inputAsciiName}
                defaultValue={asciiValue}
                maxLength={MAX_LENGTH.ETH_DATA}
                bottomText={asciiError?.message}
                label={<QuestionTooltip label="DATA_ETH" tooltip="DATA_ETH_TOOLTIP" />}
                innerRef={asciiRef}
                {...asciiField}
            />
            <Space> = </Space>
            <Textarea
                inputState={getInputState(hexError, hexValue)}
                isMonospace
                data-test={inputHexName}
                defaultValue={hexValue}
                maxLength={MAX_LENGTH.ETH_DATA}
                bottomText={hexError?.message}
                labelRight={
                    <Icon
                        size={20}
                        icon="CROSS"
                        data-test="send/close-ethereum-data"
                        onClick={() => {
                            if (amount === '0') {
                                setValue('outputs.0.amount', '');
                            }
                            close();
                        }}
                    />
                }
                innerRef={hexRef}
                {...hexField}
            />
        </Wrapper>
    );
};
