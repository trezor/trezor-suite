import React, { useMemo } from 'react';
import { FIAT } from 'src/config/suite';
import { Translation, NumberInput } from 'src/components/suite';
import { Select } from '@trezor/components';
import { buildOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import Bignumber from 'bignumber.js';
import { Controller } from 'react-hook-form';
import { useCoinmarketSellFormContext } from 'src/hooks/wallet/useCoinmarketSellForm';
import { isDecimalsValid, getInputState } from '@suite-common/wallet-utils';
import { InputError } from 'src/components/wallet';
import { MAX_LENGTH } from 'src/constants/suite/inputs';
import {
    CRYPTO_INPUT,
    FIAT_CURRENCY_SELECT,
    FIAT_INPUT,
} from 'src/types/wallet/coinmarketSellForm';
import { TypedValidationRules } from 'src/types/wallet/form';

interface Props {
    activeInput: typeof FIAT_INPUT | typeof CRYPTO_INPUT;
    setActiveInput: React.Dispatch<React.SetStateAction<typeof FIAT_INPUT | typeof CRYPTO_INPUT>>;
}

const FiatInput = ({ activeInput, setActiveInput }: Props) => {
    const {
        formState: { errors },
        control,
        formState,
        amountLimits,
        sellInfo,
        setAmountLimits,
        defaultCurrency,
        quotesRequest,
        onFiatAmountChange,
        getValues,
        account,
    } = useCoinmarketSellFormContext();

    const fiatInputValue = getValues(FIAT_INPUT);
    const tokenAddress = getValues('outputs.0.token');
    const tokenData = account.tokens?.find(t => t.contract === tokenAddress);

    const fiatInputRules = {
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: 2 }),
            limits: (value: string) => {
                if (value && amountLimits) {
                    const amount = Number(value);
                    if (amountLimits.minFiat && amount < amountLimits.minFiat) {
                        return translationString('TR_SELL_VALIDATION_ERROR_MINIMUM_FIAT', {
                            minimum: amountLimits.minFiat,
                            currency: amountLimits.currency,
                        });
                    }

                    const amountBig = new Bignumber(value);
                    if (amountBig.isNaN()) {
                        return <Translation id="AMOUNT_IS_NOT_NUMBER" />;
                    }

                    if (amountBig.lte(0)) {
                        return <Translation id="AMOUNT_IS_TOO_LOW" />;
                    }

                    if (!isDecimalsValid(value, 2)) {
                        return (
                            <Translation
                                id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                                values={{ decimals: 2 }}
                            />
                        );
                    }

                    if (amountLimits) {
                        const amount = Number(value);
                        if (amountLimits.minFiat && amount < amountLimits.minFiat) {
                            return (
                                <Translation
                                    id="TR_SELL_VALIDATION_ERROR_MINIMUM_FIAT"
                                    values={{
                                        minimum: amountLimits.minFiat,
                                        currency: amountLimits.currency,
                                    }}
                                />
                            );
                        }
                        if (amountLimits.maxFiat && amount > amountLimits.maxFiat) {
                            return (
                                <Translation
                                    id="TR_SELL_VALIDATION_ERROR_MAXIMUM_FIAT"
                                    values={{
                                        maximum: amountLimits.maxFiat,
                                        currency: amountLimits.currency,
                                    }}
                                />
                            );
                        }
                    }
                }
            },
        }),
        [activeInput, amountLimits, formState.isSubmitting],
    );

    return (
        <NumberInput
            control={control}
            noTopLabel
            defaultValue=""
            rules={fiatInputRules}
            onFocus={() => {
                setActiveInput(FIAT_INPUT);
            }}
            onChange={value => {
                setActiveInput(FIAT_INPUT);
                onFiatAmountChange(value);
            }}
            isDisabled={tokenData !== undefined}
            inputState={getInputState(errors.fiatInput, fiatInputValue)}
            name={FIAT_INPUT}
            maxLength={MAX_LENGTH.AMOUNT}
            bottomText={<InputError error={errors[FIAT_INPUT]} />}
            innerAddon={
                <Controller
                    control={control}
                    name={FIAT_CURRENCY_SELECT}
                    defaultValue={
                        quotesRequest?.fiatCurrency
                            ? {
                                  label: quotesRequest.fiatCurrency.toUpperCase(),
                                  value: quotesRequest.fiatCurrency.toUpperCase(),
                              }
                            : defaultCurrency
                    }
                    render={({ field: { value, onChange } }) => (
                        <Select
                            options={FIAT.currencies
                                .filter(c => sellInfo?.supportedFiatCurrencies.has(c))
                                .map((currency: string) => buildOption(currency))}
                            isSearchable
                            value={value}
                            isClearable={false}
                            minWidth="45px"
                            isClean
                            hideTextCursor
                            onChange={(selected: any) => {
                                onChange(selected);
                                setAmountLimits(undefined);
                            }}
                        />
                    )}
                />
            }
        />
    );
};

export default FiatInput;
