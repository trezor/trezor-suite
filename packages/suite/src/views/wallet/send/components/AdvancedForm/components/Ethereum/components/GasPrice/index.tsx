import { Translation } from '@suite-components';
import { colors, Icon, Input, Tooltip } from '@trezor/components';
import { updateMax } from '@wallet-actions/sendFormActions';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
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
    const { formContext, sendContext } = useSendFormContext();
    const {
        initialSelectedFee,
        // setSelectedFee,
        // setTransactionInfo,
        outputs,
        account,
        fiatRates,
        token,
    } = sendContext;
    const { register, errors, getValues, setError, setValue, clearError } = formContext;
    const inputName = 'ethereumGasPrice';
    const error = errors[inputName];

    return (
        <Input
            variant="small"
            name={inputName}
            state={getInputState(error)}
            onChange={async event => {
                if (!error) {
                    const isMaxActive = getValues('setMax[0]') === 'active';
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
            bottomText={error && error.message}
            innerRef={register({
                validate: {
                    gasPriceNotNumber: (value: string) => {
                        if (value && !validator.isNumeric(value)) {
                            return <Translation id="TR_ETH_GAS_PRICE_NOT_NUMBER" />;
                        }
                    },
                },
            })}
        />
    );
};
