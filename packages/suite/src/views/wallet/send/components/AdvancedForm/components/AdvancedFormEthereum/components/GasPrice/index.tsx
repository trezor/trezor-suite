import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Input, Icon, colors } from '@trezor/components-v2';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import styled from 'styled-components';
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

const getError = (error: State['networkTypeEthereum']['gasPrice']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation>{messages.TR_ETH_GAS_PRICE_NOT_NUMBER}</Translation>;
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
                    Gas Price
                    <StyledIcon size={12} color={colors.BLACK50} icon="QUESTION" />
                </Label>
            }
            bottomText={getError(error)}
            value={value || ''}
            onChange={e => sendFormActionsEthereum.handleGasPrice(e.target.value)}
        />
    );
};
