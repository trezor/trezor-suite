import { QuestionTooltip, Translation } from '@suite-components';
import { Textarea } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Send } from '@wallet-types';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import styled from 'styled-components';

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
            return <Translation id="TR_ETH_DATA_NOT_HEX" />;
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
            state={getInputState(error, value, false, false)}
            value={value || ''}
            bottomText={value && getError(error)}
            isDisabled={!!send.networkTypeEthereum.token}
            onChange={e => sendFormActionsEthereum.handleData(e.target.value)}
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
