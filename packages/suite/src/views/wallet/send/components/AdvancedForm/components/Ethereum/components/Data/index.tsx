import { QuestionTooltip, Translation } from '@suite-components';
import { Textarea } from '@trezor/components';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import React from 'react';
import { FieldError, NestDataObject, useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import validator from 'validator';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const getState = (error: NestDataObject<Record<string, any>, FieldError>) => {
    if (error) {
        return 'error';
    }

    return undefined;
};

export default () => {
    const { isToken } = useSendContext();
    const { register, errors } = useFormContext();
    const inputName = 'ethereum-data';
    const error = errors[inputName];

    return (
        <Textarea
            name={inputName}
            innerRef={register({
                validate: {
                    TR_ETH_DATA_NOT_HEX: (value: string) => {
                        if (value) {
                            return validator.isHexadecimal(value);
                        }
                    },
                },
            })}
            state={getState(error)}
            bottomText={error && <Translation id={error.type} />}
            disabled={isToken}
            topLabel={
                <Label>
                    <Text>
                        <Translation id="TR_SEND_DATA" />
                    </Text>
                    <QuestionTooltip messageId="TR_SEND_DATA_TOOLTIP" />
                </Label>
            }
        />
    );
};
