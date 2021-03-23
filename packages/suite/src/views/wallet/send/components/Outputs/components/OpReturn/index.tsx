import React from 'react';
import styled from 'styled-components';
import { useSendFormContext } from '@wallet-hooks';
import { Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { Textarea, Icon, Tooltip } from '@trezor/components';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { isHexValid } from '@wallet-utils/validation';
import { MAX_LENGTH } from '@suite-constants/inputs';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-items: space-between;
    align-items: center;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Space = styled.div`
    display: flex;
    justify-content: center;
    min-width: 65px;
`;

const OpReturn = ({ outputId }: { outputId: number }) => {
    const {
        register,
        outputs,
        getDefaultValue,
        setValue,
        errors,
        composeTransaction,
        removeOpReturn,
    } = useSendFormContext();

    const inputAsciiName = `outputs[${outputId}].dataAscii`;
    const inputHexName = `outputs[${outputId}].dataHex`;

    const asciiValue = getDefaultValue(inputAsciiName, outputs[outputId].dataAscii || '');
    const hexValue = getDefaultValue(inputHexName, outputs[outputId].dataHex || '');

    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const asciiError = outputError ? outputError.dataAscii : undefined;
    const hexError = outputError ? outputError.dataHex : undefined;

    return (
        <Wrapper>
            <Textarea
                state={getInputState(asciiError, asciiValue)}
                monospace
                name={inputAsciiName}
                data-test={inputAsciiName}
                defaultValue={asciiValue}
                maxLength={MAX_LENGTH.OP_RETURN}
                innerRef={register({
                    required: 'DATA_NOT_SET',
                })}
                onChange={event => {
                    setValue(
                        inputHexName,
                        Buffer.from(event.target.value, 'ascii').toString('hex'),
                        { shouldValidate: true },
                    );
                    composeTransaction(inputAsciiName);
                }}
                bottomText={<InputError error={asciiError} />}
                label={
                    <Label>
                        <Tooltip content={<Translation id="OP_RETURN_TOOLTIP" />} dashed>
                            <Translation id="OP_RETURN" />
                        </Tooltip>
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
                maxLength={MAX_LENGTH.OP_RETURN}
                innerRef={register({
                    required: 'DATA_NOT_SET',
                    validate: (value: string) => {
                        if (!isHexValid(value)) return 'DATA_NOT_VALID_HEX';
                        if (value.length > 80 * 2) return 'DATA_HEX_TOO_BIG';
                    },
                })}
                onChange={event => {
                    setValue(
                        inputAsciiName,
                        !hexError ? Buffer.from(event.target.value, 'hex').toString('ascii') : '',
                    );
                    composeTransaction(inputHexName);
                }}
                bottomText={<InputError error={hexError} />}
                labelRight={
                    <Icon size={20} icon="CROSS" onClick={() => removeOpReturn(outputId)} />
                }
            />
        </Wrapper>
    );
};

export default OpReturn;
