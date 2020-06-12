import { Translation } from '@suite-components';
import { toWei } from 'web3-utils';
import { colors, Icon, Input, Tooltip } from '@trezor/components';
import { useSendContext } from '@wallet-hooks/useSendContext';
import { getState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { useFormContext } from 'react-hook-form';
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
    const { initialSelectedFee, setSelectedFee } = useSendContext();
    const { register, errors, getValues } = useFormContext();
    const inputName = 'ethereumGasPrice';
    const error = errors[inputName];

    return (
        <Input
            variant="small"
            name={inputName}
            state={getState(error)}
            onChange={event => {
                if (!error) {
                    const gasPrice = event.target.value;
                    const gasLimit = getValues('ethereumGasLimit');
                    setSelectedFee({
                        feePerUnit: gasPrice,
                        feeLimit: gasLimit,
                        label: 'custom',
                        blocks: -1,
                    });
                }
            }}
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
                                values={{ defaultGasPrice: initialSelectedFee.feePerUnit }}
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
