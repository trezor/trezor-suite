import { Translation } from '@suite-components';
import { Input, Tooltip, Icon, colors } from '@trezor/components';
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

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const getError = (error: Send['networkTypeEthereum']['gasPrice']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation id="TR_ETH_GAS_PRICE_NOT_NUMBER" />;
        default:
            return null;
    }
};

export default ({ send, sendFormActionsEthereum, selectedAccount }: Props) => {
    if (!send || selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    if (account.networkType !== 'ethereum') return null;
    const { gasPrice } = send.networkTypeEthereum;
    const { value, error } = gasPrice;

    return (
        <Input
            variant="small"
            state={getInputState(error, value, true, true)}
            label={
                <Label>
                    <Text>
                        <Translation id="TR_GAS_PRICE" />
                    </Text>
                    <Tooltip
                        placement="top"
                        content={
                            <Translation
                                id="TR_SEND_GAS_PRICE_TOOLTIP"
                                // values={{ defaultGasPrice: network.defaultGasPrice }}
                            />
                        }
                    >
                        <StyledIcon size={16} color={colors.BLACK50} icon="QUESTION" />
                    </Tooltip>
                </Label>
            }
            bottomText={getError(error)}
            value={value || ''}
            onChange={e => sendFormActionsEthereum.handleGasPrice(e.target.value)}
        />
    );
};
