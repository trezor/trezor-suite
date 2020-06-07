import { Translation } from '@suite-components';
import validator from 'validator';
import { colors, Icon, Input, Tooltip } from '@trezor/components';
import { Account } from '@wallet-types';
import { getState } from '@wallet-utils/sendFormUtils';
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

export default () => {
    const inputName = 'ethereum-gas-limit';
    const { register, errors } = useFormContext();
    const error = errors[inputName];

    return (
        <Input
            variant="small"
            name={inputName}
            // disabled={isDisabled(networkType, getInputState(data.error, data.value, false, false))}
            state={getState(error)}
            innerRef={register({
                validate: {
                    TR_ETH_GAS_LIMIT_NOT_NUMBER: (value: string) => {
                        if (value) {
                            return validator.isNumeric(value);
                        }
                    },
                },
            })}
            bottomText={error && <Translation id={error.type} />}
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
        />
    );
};
