import { QuestionTooltip, Translation } from '@suite-components';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { Textarea } from '@trezor/components';
import TrezorConnect from 'trezor-connect';
import { fromWei } from 'web3-utils';
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
    const { token, account, setSelectedFee, initialSelectedFee } = useSendContext();
    const { register, errors, getValues, setValue } = useFormContext();
    const inputName = 'ethereumData';
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
                    const data = event.target.value;
                    const address = getValues('address-0');
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

                    setValue('ethereumGasPrice', gasPrice);
                    setValue('ethereumGasLimit', gasLimit);
                    setSelectedFee({
                        label: 'normal',
                        feePerUnit: gasPrice,
                        feeLimit: gasLimit,
                        blocks: -1, // irrelevant for eth
                    });
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
