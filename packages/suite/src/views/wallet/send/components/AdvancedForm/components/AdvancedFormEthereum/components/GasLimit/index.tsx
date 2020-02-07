import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Input, Icon, colors } from '@trezor/components-v2';
import styled from 'styled-components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';

import { Props } from './Container';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    display: flex;
    padding-left: 5px;
`;

const getError = (error: State['networkTypeEthereum']['gasLimit']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation>{messages.TR_ETH_GAS_LIMIT_NOT_NUMBER}</Translation>;
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
            state={getInputState(error, value, true)}
            topLabel={
                <Label>
                    Gas Limit
                    <StyledIcon size={12} color={colors.BLACK50} icon="QUESTION" />
                </Label>
            }
            bottomText={getError(error)}
            value={value || ''}
            onChange={e => sendFormActionsEthereum.handleGasLimit(e.target.value)}
        />
    );
};
