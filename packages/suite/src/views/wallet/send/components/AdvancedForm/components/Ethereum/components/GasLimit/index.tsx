import { Translation } from '@suite-components';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { colors, Icon, Input, Tooltip } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Account, Send } from '@wallet-types';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

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

export default () => {
    const inputName = 'eth-gas-limit';

    return (
        <Input
            variant="small"
            name={inputName}
            // disabled={isDisabled(networkType, getInputState(data.error, data.value, false, false))}
            // state={getInputState(error, value, true, true)}
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
            // bottomText={getError(error)}
        />
    );
};
