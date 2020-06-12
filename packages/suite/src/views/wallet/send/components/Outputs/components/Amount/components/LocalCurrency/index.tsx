import React from 'react';
import styled from 'styled-components';
import { Select, Input } from '@trezor/components';
// import { fromFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { useFormContext, Controller } from 'react-hook-form';
import BigNumber from 'bignumber.js';
import { useSendContext, SendContext } from '@suite/hooks/wallet/useSendContext';
import { FIAT } from '@suite-config';
import { composeTx, getState } from '@wallet-utils/sendFormUtils';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: row;
    justify-content: flex-start;
`;

const SelectWrapper = styled.div`
    width: 100px;
    min-width: 80px;
    margin-left: 10px;
`;

const getCurrencyOptions = (currency: string) => {
    return { value: currency, label: currency.toUpperCase() };
};

export default ({ outputId }: { outputId: number }) => {
    const { register, errors, getValues, control, setValue } = useFormContext();
    const {
        fiatRates,
        token,
        network,
        account,
        selectedFee,
        outputs,
        setTransactionInfo,
    } = useSendContext();
    const inputName = `localCurrencyInput-${outputId}`;
    const inputNameSelect = `localCurrencySelect-${outputId}`;
    const error = errors[inputName];

    return (
        <Wrapper>
            <Input
                state={getState(error)}
                name={inputName}
                innerRef={register}
                onChange={async () => {
                    // const formValues = getValues();
                    // const composedTransaction = await composeTx(
                    //     account,
                    //     formValues,
                    //     selectedFee,
                    //     outputs,
                    //     token,
                    // );
                    // if (composedTransaction && composedTransaction.type === 'error') {
                    //     setError(amountInput, composedTransaction.error);
                    // }
                    // if (composedTransaction && composedTransaction.type !== 'error') {
                    //     setTransactionInfo(composedTransaction);
                    //     setValue(amountInput, composedTransaction.max);
                    //     // setValue(inputNameMax, true);
                    // }
                    // console.log('composedTransaction', composedTransaction);
                    // if (fiatRates) {
                    //     const coinValue = fromFiatCurrency(
                    //         event.target.value,
                    //         localCurrency.value,
                    //         fiatRates.current?.rates,
                    //         decimals,
                    //     );
                    //     setValue(`amount-${outputId}`, coinValue);
                    // }
                }}
            />
            <SelectWrapper>
                <Controller
                    as={Select}
                    options={FIAT.currencies.map((currency: string) =>
                        getCurrencyOptions(currency),
                    )}
                    name={inputNameSelect}
                    isSearchable
                    isClearable={false}
                    onChange={option => {
                        if (fiatRates) {
                            const rate = fiatRates.current?.rates[option[0].value];
                            console.log('rate', rate);
                            if (rate) {
                                const oldValue = getValues(inputName);
                                const fiatValueBigNumber = new BigNumber(oldValue).multipliedBy(
                                    new BigNumber(rate),
                                );
                                const fiatValue = fiatValueBigNumber.isNaN()
                                    ? ''
                                    : fiatValueBigNumber.toFixed(2);
                                setValue(inputName, fiatValue);
                            }
                        }
                    }}
                    control={control}
                />
            </SelectWrapper>
        </Wrapper>
    );
};
