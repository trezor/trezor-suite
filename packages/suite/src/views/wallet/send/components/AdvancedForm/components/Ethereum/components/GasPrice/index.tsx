import { Translation } from '@suite-components';
import { colors, Icon, Input, Tooltip } from '@trezor/components';
import { useSendContext, SendContext } from '@wallet-hooks/useSendContext';
import { getInputState, updateMax } from '@wallet-utils/sendFormUtils';
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
    const {
        initialSelectedFee,
        setSelectedFee,
        setTransactionInfo,
        outputs,
        account,
        fiatRates,
        token,
    } = useSendContext();
    const { register, errors, getValues, setError, setValue, clearError } = useFormContext();
    const inputName = 'ethereumGasPrice';
    const error = errors[inputName];

    return (
        <Input
            variant="small"
            name={inputName}
            state={getInputState(error)}
            onChange={async event => {
                if (!error) {
                    const isMaxActive = getValues('setMax-0') === '1';
                    const gasPrice = event.target.value;
                    const gasLimit = getValues('ethereumGasLimit');
                    const newFeeLevel: SendContext['selectedFee'] = {
                        feePerUnit: gasPrice,
                        feeLimit: gasLimit,
                        label: 'custom',
                        blocks: -1,
                    };

                    setSelectedFee(newFeeLevel);

                    if (isMaxActive) {
                        await updateMax(
                            0,
                            account,
                            setValue,
                            getValues,
                            clearError,
                            setError,
                            newFeeLevel,
                            outputs,
                            token,
                            fiatRates,
                            setTransactionInfo,
                        );
                    }
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
