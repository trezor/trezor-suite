import { Translation } from '@suite-components';
import { colors, Icon, Input, Tooltip } from '@trezor/components';
import { useSendContext, SendContext } from '@wallet-hooks/useSendContext';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { updateMax } from '@wallet-actions/sendFormActions';
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
    const { register, errors, getValues, setValue, setError, clearError } = useFormContext();
    const {
        account,
        initialSelectedFee,
        setSelectedFee,
        fiatRates,
        token,
        outputs,
        setTransactionInfo,
    } = useSendContext();
    const { networkType } = account;
    const inputName = 'ethereumGasLimit';
    const ethData = getValues('ethereumData');
    const error = errors[inputName];

    return (
        <Input
            variant="small"
            name={inputName}
            isDisabled={networkType === 'ethereum' && ethData}
            state={getInputState(error)}
            onChange={async event => {
                if (!error) {
                    const gasPrice = getValues('ethereumGasPrice');
                    const gasLimit = event.target.value;
                    const isMaxActive = getValues('setMax[0]') === 'active';
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
                                values={{ defaultGasLimit: initialSelectedFee.feeLimit }}
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
