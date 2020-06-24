import { QuestionTooltip, Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { Textarea } from '@trezor/components';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { getInputState } from '@wallet-utils/sendFormUtils';
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

export default () => {
    const {
        token,
        setSelectedFee,
        initialSelectedFee,
        outputs,
        fiatRates,
        setTransactionInfo,
    } = useSendContext();
    const { register, errors, getValues, setValue, clearError, setError } = useFormContext();
    const inputName = 'ethereumData';
    const { updateFeeLevelWithData } = useActions({
        updateFeeLevelWithData: sendFormActions.updateFeeLevelWithData,
    });
    const error = errors[inputName];

    return (
        <Textarea
            name={inputName}
            innerRef={register({
                validate: {
                    TR_ETH_DATA_NOT_HEX: (value: string) => {
                        if (value) {
                            return validator.isHexadecimal(value);
                        }
                    },
                },
            })}
            onChange={async event => {
                if (!error) {
                    updateFeeLevelWithData(
                        event.target.value,
                        setSelectedFee,
                        initialSelectedFee,
                        token,
                        setTransactionInfo,
                        outputs,
                        fiatRates,
                        setValue,
                        clearError,
                        setError,
                        getValues,
                    );
                }
            }}
            state={getInputState(error)}
            bottomText={error && <Translation id={error.type} />}
            disabled={token !== null}
            topLabel={
                <Label>
                    <Text>
                        <Translation id="TR_SEND_DATA" />
                    </Text>
                    <QuestionTooltip messageId="TR_SEND_DATA_TOOLTIP" />
                </Label>
            }
        />
    );
};
