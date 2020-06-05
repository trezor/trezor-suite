import { Translation } from '@suite-components';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { colors, Icon, Input, Tooltip } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Send } from '@wallet-types';
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

const getError = (error: Send['networkTypeEthereum']['gasPrice']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation id="TR_ETH_GAS_PRICE_NOT_NUMBER" />;
        default:
            return null;
    }
};

export default () => {
    const { account } = useSendContext();
    const { register } = useFormContext();
    const inputName = 'eth-gas-price';

    return (
        <Input
            variant="small"
            name={inputName}
            // state={getInputState(error, value, true, true)}
            topLabel={
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
            // bottomText={getError(error)}
            innerRef={register()}
        />
    );
};
