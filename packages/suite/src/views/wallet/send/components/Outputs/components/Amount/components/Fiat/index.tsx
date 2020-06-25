import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Select, Input } from '@trezor/components';
import { useFormContext, Controller } from 'react-hook-form';
import BigNumber from 'bignumber.js';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { FIAT } from '@suite-config';
import { composeChange, updateFiatInput } from '@wallet-actions/sendFormActions';
import { getInputState, getFiatRate, buildCurrencyOption } from '@wallet-utils/sendFormUtils';

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

export default ({ outputId }: { outputId: number }) => {
    const { register, errors, getValues, control, setValue, setError } = useFormContext();
    const {
        fiatRates,
        token,
        network,
        localCurrencyOption,
        account,
        setTransactionInfo,
        selectedFee,
        outputs,
    } = useSendContext();
    const inputName = `fiatInput[${outputId}]`;
    const inputNameSelect = `localCurrency[${outputId}]`;
    const error = errors && errors.fiatInput ? errors.fiatInput[outputId] : null;
    const decimals = token ? token.decimals : network.decimals;

    useEffect(() => {
        const fiatInputValue = getValues(inputName);
        if (fiatInputValue.length > 0) {
            updateFiatInput(outputId, fiatRates, getValues, setValue);
        }
    }, [outputId, fiatRates, getValues, setValue, inputName]);

    return (
        <Wrapper>
            <Input
                state={getInputState(error)}
                name={inputName}
                innerRef={register}
                onChange={async event => {
                    const selectedCurrency = getValues(inputNameSelect);
                    const localCurrencyValue = new BigNumber(event.target.value);
                    const rate = getFiatRate(fiatRates, selectedCurrency.value);

                    if (rate) {
                        await composeChange(
                            outputId,
                            account,
                            setTransactionInfo,
                            getValues,
                            setError,
                            selectedFee,
                            outputs,
                            token,
                        );

                        const amountBigNumber = localCurrencyValue.dividedBy(rate);

                        if (!amountBigNumber.isNaN() && !amountBigNumber.isLessThan(0)) {
                            const isFixed = amountBigNumber.isZero();
                            const fixedDecimals = isFixed ? 0 : decimals;
                            setValue(`amount[${outputId}]`, amountBigNumber.toFixed(fixedDecimals));
                        }
                    }
                }}
            />
            <SelectWrapper>
                <Controller
                    as={Select}
                    options={FIAT.currencies.map((currency: string) =>
                        buildCurrencyOption(currency),
                    )}
                    name={inputNameSelect}
                    register={register}
                    isSearchable
                    defaultValue={localCurrencyOption}
                    isClearable={false}
                    onChange={([selected]) => {
                        const rate = getFiatRate(fiatRates, selected.value);
                        const amountValue = getValues(`amount[${outputId}]`);
                        const amountBig = new BigNumber(amountValue);

                        if (rate && amountValue) {
                            const fiatValueBigNumber = amountBig.multipliedBy(rate);
                            setValue(inputName, fiatValueBigNumber.toFixed(2));
                        }

                        return { ...selected };
                    }}
                    control={control}
                />
            </SelectWrapper>
        </Wrapper>
    );
};
