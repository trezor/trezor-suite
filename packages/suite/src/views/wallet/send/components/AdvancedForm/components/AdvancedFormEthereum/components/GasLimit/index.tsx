import { Translation } from '@suite-components';
import { Input, Tooltip, Icon, colors } from '@trezor/components';
import styled from 'styled-components';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Send, Account } from '@wallet-types';
import React from 'react';

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

const isDisabled = (
    networkType: Account['networkType'],
    dataState: 'error' | 'success' | undefined,
) => {
    return networkType === 'ethereum' && dataState !== undefined;
};

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
    const { networkType } = account;
    const { gasLimit, data } = send.networkTypeEthereum;
    const { error, value } = gasLimit;

    return (
        <Input
            variant="small"
            isDisabled={isDisabled(
                networkType,
                getInputState(data.error, data.value, false, false),
            )}
            state={getInputState(error, value, true, true)}
            topLabel={
                <Label>
                    <Text>
                        <Translation id="TR_GAS_LIMIT" />
                    </Text>
                    <Tooltip
                        placement="top"
                        content={
                            <Translation
                                id="TR_SEND_GAS_LIMIT_TOOLTIP"
                                // values={{ defaultGasLimit: account.network.defaultGasLimit }}
                            />
                        }
                    >
                        <StyledIcon size={16} color={colors.BLACK50} icon="QUESTION" />
                    </Tooltip>
                </Label>
            }
            bottomText={getError(error)}
            value={value || ''}
            onChange={e => sendFormActionsEthereum.handleGasLimit(e.target.value)}
        />
    );
};
