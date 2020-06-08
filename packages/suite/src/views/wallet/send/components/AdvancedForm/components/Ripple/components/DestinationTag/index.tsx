import React from 'react';
import styled from 'styled-components';
import validator from 'validator';
import { Input } from '@trezor/components';
import { FieldError, NestDataObject, useFormContext } from 'react-hook-form';
import { Translation, QuestionTooltip } from '@suite-components';

const Label = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
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

const DestinationTag = () => {
    const { register, errors } = useFormContext();
    const inputName = 'rippleDestinationTag';
    const error = errors[inputName];

    return (
        <Input
            state={getState(error)}
            variant="small"
            topLabel={
                <Label>
                    <Text>
                        <Translation id="TR_XRP_DESTINATION_TAG" />
                    </Text>
                    <QuestionTooltip messageId="TR_XRP_DESTINATION_TAG_EXPLAINED" />
                </Label>
            }
            bottomText={error && <Translation id={error.type} />}
            name={inputName}
            innerRef={register({
                validate: {
                    TR_DESTINATION_TAG_IS_NOT_NUMBER: (value: string) => {
                        if (value !== '') {
                            return validator.isNumeric(value);
                        }
                    },
                },
            })}
        />
    );
};

export default DestinationTag;
