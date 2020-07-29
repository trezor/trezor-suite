import React from 'react';
import styled from 'styled-components';
import { Input } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { Translation, QuestionTooltip } from '@suite-components';
import { Send } from '@wallet-types';
import { Props } from './Container';

const Label = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const getErrorMessage = (
    error: Send['networkTypeRipple']['destinationTag']['error'],
    value: Send['networkTypeRipple']['destinationTag']['value'],
) => {
    if (!value) return null;

    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation id="TR_DESTINATION_TAG_IS_NOT_NUMBER" />;
        default:
            return null;
    }
};

const AdvancedFormRipple = ({ send, sendFormActionsRipple }: Props) => {
    if (!send) return null;
    const { networkTypeRipple } = send;
    const { destinationTag } = networkTypeRipple;
    const { error, value } = destinationTag;

    return (
        <Input
            state={getInputState(error, value, undefined, false)}
            variant="small"
            label={
                <Label>
                    <Text>
                        <Translation id="TR_XRP_DESTINATION_TAG" />
                    </Text>
                    <QuestionTooltip messageId="TR_XRP_DESTINATION_TAG_EXPLAINED" />
                </Label>
            }
            bottomText={getErrorMessage(error, value)}
            value={value || ''}
            onChange={e => sendFormActionsRipple.handleDestinationTagChange(e.target.value)}
        />
    );
};

export default AdvancedFormRipple;
