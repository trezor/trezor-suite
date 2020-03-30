import { Translation, QuestionTooltip } from '@suite-components';

import { Input } from '@trezor/components';
import styled from 'styled-components';
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

const getError = (error: Send['networkTypeEthereum']['gasLimit']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation id="TR_ETH_GAS_LIMIT_NOT_NUMBER" />;
        default:
            return null;
    }
};

export default ({ send, sendFormActionsEthereum, account }: Props) => {
    if (!send || !account) return null;
    const { selectedFee } = send;
    const { gasLimit, data } = send.networkTypeEthereum;
    const { error, value } = gasLimit;

    return (
        <Input
            variant="small"
            disabled={selectedFee.label === 'custom' && data.value !== null}
            state={getInputState(error, value, true, true)}
            topLabel={
                <Label>
                    <Text>
                        <Translation id="TR_GAS_LIMIT" />
                    </Text>
                    <QuestionTooltip messageId="TR_SEND_GAS_LIMIT_TOOLTIP" />
                </Label>
            }
            bottomText={getError(error)}
            value={value || ''}
            onChange={e => sendFormActionsEthereum.handleGasLimit(e.target.value)}
        />
    );
};
