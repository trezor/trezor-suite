import { QuestionTooltip, Translation } from '@suite-components';
import { Textarea } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Send } from '@wallet-types';
import validator from 'validator';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const getError = (error: Send['networkTypeEthereum']['data']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_HEX:
            return <Translation id="TR_ETH_DATA_NOT_HEX" />;
        default:
            return null;
    }
};

export default () => {
    const { register } = useFormContext();
    const inputName = 'eth-data';

    return (
        <Textarea
            name={inputName}
            innerRef={register({
                validate: {
                    TR_ETH_DATA_NOT_HEX: (value: string) => {
                        if (value) {
                            validator.isHexadecimal(value);
                        }
                    },
                },
            })}
            // state={getInputState(error, value, false, false)}
            // bottomText={value && getError(error)}
            // disabled={!!send.networkTypeEthereum.token}
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
