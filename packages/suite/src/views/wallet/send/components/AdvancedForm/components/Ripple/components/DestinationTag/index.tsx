import React from 'react';
import styled from 'styled-components';
import validator from 'validator';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { Input } from '@trezor/components';
import { U_INT_32 } from '@wallet-constants/sendForm';
import { Translation, QuestionTooltip } from '@suite-components';

const Label = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const DestinationTag = () => {
    const { formContext } = useSendFormContext();
    const { register, errors } = formContext;
    const inputName = 'rippleDestinationTag';
    const error = errors[inputName];

    return (
        <Input
            state={getInputState(error)}
            variant="small"
            topLabel={
                <Label>
                    <Text>
                        <Translation id="TR_XRP_DESTINATION_TAG" />
                    </Text>
                    <QuestionTooltip messageId="TR_XRP_DESTINATION_TAG_EXPLAINED" />
                </Label>
            }
            bottomText={error && error.message}
            name={inputName}
            innerRef={register({
                validate: {
                    xrpDestinationTagNotNumber: (value: string) => {
                        if (value && !validator.isNumeric(value)) {
                            return <Translation id="TR_DESTINATION_TAG_IS_NOT_NUMBER" />;
                        }
                    },
                    xrpDestinationTagNotValid: (value: string) => {
                        if (value && parseInt(value, 10) > U_INT_32) {
                            return <Translation id="TR_DESTINATION_TAG_IS_NOT_VALID" />;
                        }
                    },
                },
            })}
        />
    );
};

export default DestinationTag;
