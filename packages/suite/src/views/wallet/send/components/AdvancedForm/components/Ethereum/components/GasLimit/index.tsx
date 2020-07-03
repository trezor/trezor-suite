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
    const {
        account,
        initialSelectedFee,
        setSelectedFee,
        fiatRates,
        token,
        outputs,
        setTransactionInfo,
        register,
        errors,
        getValues,
        setValue,
        setError,
        clearError,
    } = useSendFormContext();
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
                    ethGasLimitNotNumber: (value: string) => {
                        if (value && !validator.isNumeric(value)) {
                            return <Translation id="TR_ETH_GAS_LIMIT_NOT_NUMBER" />;
                        }
                    },
                },
            })}
            bottomText={error && error.message}
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
