import { Translation, QuestionTooltip } from '@suite-components';
import messages from '@suite/support/messages';
import { Input } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Send } from '@wallet-types';
import styled from 'styled-components';
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

const getError = (error: Send['networkTypeEthereum']['gasPrice']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation {...messages.TR_ETH_GAS_PRICE_NOT_NUMBER} />;
        default:
            return null;
    }
};

export default ({ send, sendFormActionsEthereum, account }: Props) => {
    if (!send || !account) return null;
    const { gasPrice } = send.networkTypeEthereum;
    const { value, error } = gasPrice;

    return (
        <Input
            variant="small"
            display="block"
            state={getInputState(error, value, true)}
            topLabel={
                <Label>
                    <Text>
                        <Translation {...messages.TR_GAS_PRICE} />
                    </Text>
                    <QuestionTooltip messageId="TR_SEND_GAS_PRICE_TOOLTIP" />
                </Label>
            }
            bottomText={getError(error)}
            value={value || ''}
            onChange={e => sendFormActionsEthereum.handleGasPrice(e.target.value)}
        />
    );
};
