import { QuestionTooltip, Translation } from '@suite-components';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { Textarea } from '@trezor/components';
import { getState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import validator from 'validator';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

export default () => {
    const { token } = useSendContext();
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
            disabled={token !== null}
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
