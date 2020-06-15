import { QuestionTooltip, Translation } from '@suite-components';
import { useSendContext, SendContext } from '@suite/hooks/wallet/useSendContext';
import { Textarea } from '@trezor/components';
import TrezorConnect from 'trezor-connect';
import { fromWei } from 'web3-utils';
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

export default () => {
    const {
        token,
        account,
        setSelectedFee,
        initialSelectedFee,
        outputs,
        fiatRates,
        setTransactionInfo,
    } = useSendContext();
    const { register, errors, getValues, setValue, clearError, setError } = useFormContext();
    const inputName = 'ethereumData';
    const error = errors[inputName];
    const addressError = errors['address-0'];

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
                if (!error && !addressError) {
                    const data = event.target.value;
                    const address = getValues('address-0');
                    const isMaxActive = getValues('setMax-0') === '1';
                    const response = await TrezorConnect.blockchainEstimateFee({
                        coin: account.symbol,
                        request: {
                            blocks: [2],
                            specific: {
                                from: account.descriptor,
                                to: address || account.descriptor,
                                data,
                            },
                        },
                    });

                    if (!response.success) return null;

                    const level = response.payload.levels[0];
                    const gasLimit = level.feeLimit || initialSelectedFee.feeLimit;
                    const gasPrice = fromWei(level.feePerUnit, 'gwei');
                    const newFeeLevel: SendContext['selectedFee'] = {
                        label: 'normal',
                        feePerUnit: gasPrice,
                        feeLimit: gasLimit,
                        blocks: -1,
                    };

                    setValue('ethereumGasPrice', gasPrice);
                    setValue('ethereumGasLimit', gasLimit);
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
