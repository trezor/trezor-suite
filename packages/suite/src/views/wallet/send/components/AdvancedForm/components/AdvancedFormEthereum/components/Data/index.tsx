import { Translation, QuestionTooltip } from '@suite-components';
import messages from '@suite/support/messages';
import styled from 'styled-components';
import { Textarea } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Send } from '@wallet-types';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { Props } from './Container';

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
            return <Translation>{messages.TR_ETH_DATA_NOT_HEX}</Translation>;
        default:
            return null;
    }
};

export default ({ send, sendFormActionsEthereum, account }: Props) => {
    if (!send || !account) return null;
    const { data } = send.networkTypeEthereum;
    const { error, value } = data;

    return (
        <Textarea
            state={getInputState(error, value)}
            value={value || ''}
            bottomText={getError(error)}
            onChange={e => sendFormActionsEthereum.handleData(e.target.value)}
            topLabel={
                <Label>
                    <Text>
                        <Translation {...messages.TR_SEND_DATA} />
                    </Text>
                    <QuestionTooltip messageId="TR_SEND_DATA_TOOLTIP" />
                </Label>
            }
        />
    );
};
