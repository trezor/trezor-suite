import { useCallback } from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Controller } from 'react-hook-form';

import { Select } from '@trezor/components';
import { useSendFormContext } from 'src/hooks/wallet';
import {
    fromFiatCurrency,
    getInputState,
    getFiatRate,
    findToken,
    isLowAnonymityWarning,
    amountToSatoshi,
    formatAmount,
    buildCurrencyOptions,
} from '@suite-common/wallet-utils';
import { CurrencyOption, Output } from 'src/types/wallet/sendForm';
import { MAX_LENGTH } from 'src/constants/suite/inputs';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { NumberInput } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { validateDecimals } from 'src/utils/suite/validation';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: row;
    justify-content: flex-start;
`;

interface FiatProps {
    output: Partial<Output>;
    outputId: number;
}

export const Fiat = ({ output, outputId }: FiatProps) => {
    const {
        account,
        network,
        fiatRates,
        formState: { errors },
        clearErrors,
        getDefaultValue,
        control,
        setValue,
        localCurrencyOption,
        composeTransaction,
    } = useSendFormContext();

    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const { translationString } = useTranslation();

    const inputName = `outputs.${outputId}.fiat` as const;
    const currencyInputName = `outputs.${outputId}.currency` as const;
    const amountInputName = `outputs.${outputId}.amount` as const;
    const tokenInputName = `outputs.${outputId}.token` as const;
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;

    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.fiat : undefined;
    const fiatValue = getDefaultValue(inputName, output.fiat || '');
    const tokenValue = getDefaultValue(tokenInputName, output.token);
    const currencyValue =
        getDefaultValue(currencyInputName, output.currency) || localCurrencyOption;
    const token = findToken(account.tokens, tokenValue);

    // relation case:
    // Amount input has an error and Fiat has not (but it should)
    // usually this happens after Fiat > Amount recalculation (from here, onChange event)
    // or as a result on composeTransaction process
    const amountError = outputError ? outputError.amount : undefined;
    const errorToDisplay = !error && fiatValue && amountError ? amountError : error;

    const isLowAnonymity = isLowAnonymityWarning(outputError);
    const inputState = isLowAnonymity ? 'warning' : getInputState(errorToDisplay, fiatValue);
    const bottomText = isLowAnonymity ? null : errorToDisplay?.message;

    const handleChange = useCallback(
        (value: string) => {
            if (isSetMaxActive) {
                setValue('setMaxOutputId', undefined);
            }

            if (error && error.message !== 'AMOUNT_IS_NOT_SET') {
                // reset Amount field in case of invalid Fiat value
                if (getDefaultValue(amountInputName, '').length > 0) {
                    setValue(amountInputName, '');
                    clearErrors(amountInputName);
                }

                composeTransaction(amountInputName);

                return;
            }

            // calculate new Amount, Fiat input times currency rate
            // NOTE: get fresh values (currencyValue may be outdated)
            const { value: fiatCurrency } = getDefaultValue(currencyInputName, localCurrencyOption);

            const decimals = token ? token.decimals : network.decimals;

            const amount =
                fiatRates && fiatRates.current && fiatCurrency
                    ? fromFiatCurrency(value, fiatCurrency, fiatRates.current.rates, decimals)
                    : null;

            const formattedAmount = shouldSendInSats
                ? amountToSatoshi(amount || '0', decimals)
                : amount;

            if (formattedAmount) {
                // set Amount value and validate if
                setValue(amountInputName, formattedAmount, {
                    shouldValidate: true,
                });
            }

            composeTransaction(amountInputName);
        },
        [
            amountInputName,
            clearErrors,
            composeTransaction,
            currencyInputName,
            error,
            fiatRates,
            getDefaultValue,
            isSetMaxActive,
            localCurrencyOption,
            network.decimals,
            setValue,
            token,
            shouldSendInSats,
        ],
    );

    const rules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            decimals: validateDecimals(translationString, { decimals: 2 }),
        },
    };

    interface CallbackParams {
        field: {
            onChange: (...event: any[]) => void;
            value: any;
        };
    }

    const renderCurrencySelect = useCallback(
        ({ field: { onChange, value } }: CallbackParams) => (
            <Select
                options={buildCurrencyOptions(value)}
                value={value}
                isClearable={false}
                isSearchable
                hideTextCursor
                minWidth="58px"
                isClean
                data-test={currencyInputName}
                onChange={(selected: CurrencyOption) => {
                    // propagate changes to FormState
                    onChange(selected);
                    // calculate Amount value
                    const rate = getFiatRate(fiatRates, selected.value);
                    const amountValue = getDefaultValue(amountInputName, '');

                    const formattedAmount = new BigNumber(
                        shouldSendInSats
                            ? formatAmount(amountValue, network.decimals)
                            : amountValue,
                    );

                    if (
                        rate &&
                        formattedAmount &&
                        !formattedAmount.isNaN() &&
                        formattedAmount.gt(0) // formatAmount() returns '-1' on error
                    ) {
                        const fiatValueBigNumber = formattedAmount.multipliedBy(rate);

                        setValue(inputName, fiatValueBigNumber.toFixed(2), {
                            shouldValidate: true,
                        });
                        // call compose to store draft, precomposedTx should be the same
                        composeTransaction(amountInputName);
                    }
                }}
            />
        ),
        [
            currencyInputName,
            fiatRates,
            amountInputName,
            composeTransaction,
            getDefaultValue,
            inputName,
            setValue,
            shouldSendInSats,
            network.decimals,
        ],
    );

    return (
        <Wrapper>
            <NumberInput
                control={control}
                inputState={inputState}
                onChange={handleChange}
                name={inputName}
                data-test={inputName}
                defaultValue={fiatValue}
                maxLength={MAX_LENGTH.FIAT}
                rules={rules}
                bottomText={bottomText || null}
                innerAddon={
                    <Controller
                        control={control}
                        name={currencyInputName}
                        defaultValue={currencyValue}
                        render={renderCurrencySelect}
                    />
                }
            />
        </Wrapper>
    );
};
