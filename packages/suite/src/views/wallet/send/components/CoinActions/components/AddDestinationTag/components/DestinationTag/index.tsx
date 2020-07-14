import React from 'react';
import styled from 'styled-components';
import validator from 'validator';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { Input, Icon } from '@trezor/components';
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

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

interface Props {
    setIsActive: (isActive: boolean) => void;
}

const DestinationTag = ({ setIsActive }: Props) => {
    const { register, errors } = useSendFormContext();
    const inputName = 'rippleDestinationTag';
    const error = errors[inputName];

    return (
        <Input
            state={getInputState(error)}
            label={
                <Label>
                    <Text>
                        <Translation id="TR_XRP_DESTINATION_TAG" />
                    </Text>
                    <QuestionTooltip messageId="TR_XRP_DESTINATION_TAG_EXPLAINED" />
                </Label>
            }
            bottomText={error && error.message}
            name={inputName}
            labelRight={<StyledIcon size={20} icon="CROSS" onClick={() => setIsActive(false)} />}
            innerRef={register({
                validate: {
                    error: (value: string) => {
                        if (value) {
                            if (!validator.isNumeric(value)) {
                                return <Translation id="TR_DESTINATION_TAG_IS_NOT_NUMBER" />;
                            }

                            if (parseInt(value, 10) > U_INT_32) {
                                return <Translation id="TR_DESTINATION_TAG_IS_NOT_VALID" />;
                            }
                        }
                    },
                },
            })}
        />
    );
};

export default DestinationTag;
