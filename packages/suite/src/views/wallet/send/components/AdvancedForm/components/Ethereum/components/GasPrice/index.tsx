import { Translation } from '@suite-components';
// import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { colors, Icon, Input, Tooltip } from '@trezor/components';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { getState } from '@wallet-utils/sendFormUtils';
import styled from 'styled-components';
import validator from 'validator';

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

export default () => {
    // const { account } = useSendContext();
    const { register, errors } = useFormContext();
    const inputName = 'ethereum-gas-price';
    // const { network } = account;
    const error = errors[inputName];

    return (
        <Input
            variant="small"
            name={inputName}
            state={getState(error)}
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
            bottomText={error && <Translation id={error.type} />}
            innerRef={register({
                validate: {
                    TR_ETH_GAS_PRICE_NOT_NUMBER: (value: string) => {
                        if (value) {
                            return validator.isNumeric(value);
                        }
                    },
                },
            })}
        />
    );
};
