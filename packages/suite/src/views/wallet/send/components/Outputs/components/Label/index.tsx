import React from 'react';
import styled from 'styled-components';
import { Input, colors, variables, Icon } from '@trezor/components';
import { Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { MAX_LENGTH } from '@suite-constants/inputs';

const Label = styled.div`
    display: flex;
    align-items: center;
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

export default ({ outputId }: { outputId: number }) => {
    const {
        register,
        getDefaultValue,
        errors,
        setValue,
        composeTransaction,
    } = useSendFormContext();

    const isLabelEnabled = getDefaultValue(`outputs[${outputId}].labelEnabled`, false);
    if (!isLabelEnabled) return null;

    const inputName = `outputs[${outputId}].label`;
    const inputValue = getDefaultValue(inputName, '');
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.label : undefined;

    return (
        <Input
            state={getInputState(error, inputValue)}
            monospace
            innerAddon={
                <Remove
                    data-test={`outputs[${outputId}].removeLabeling`}
                    onClick={() => {
                        setValue(`outputs[${outputId}].label`, '');
                        setValue(`outputs[${outputId}].labelEnabled`, false);
                        composeTransaction(`outputs[${outputId}].amount`);
                    }}
                >
                    <StyledIcon size={20} color={colors.BLACK50} icon="CROSS" />
                </Remove>
            }
            label={
                <Label>
                    <Translation id="RECIPIENT_LABEL" />
                </Label>
            }
            onChange={async () => {
                composeTransaction(`outputs[${outputId}].amount`, !!error);
            }}
            bottomText={error && <InputError error={error} />}
            name={inputName}
            data-test={inputName}
            defaultValue={inputValue}
            maxLength={MAX_LENGTH.LABEL}
            innerRef={register()} // TODO: is validation necessary for this?
        />
    );
};
