import React from 'react';
import { FIAT } from '@suite-config';
import { Translation } from '@suite-components';
import { Select, Input } from '@trezor/components';
import { buildOption } from '@wallet-utils/coinmarket/coinmarketUtils';
import Bignumber from 'bignumber.js';
import { Controller } from 'react-hook-form';
import { useCoinmarketSellFormContext } from '@wallet-hooks/useCoinmarketSellForm';
import { isDecimalsValid } from '@wallet-utils/validation';
import { InputError } from '@wallet-components';
import { MAX_LENGTH } from '@suite-constants/inputs';
import {
    CRYPTO_INPUT,
    FIAT_CURRENCY_SELECT,
    FIAT_INPUT,
} from '@suite/types/wallet/coinmarketSellForm';
import { getInputState } from '@suite/utils/wallet/sendFormUtils';

interface Props {
    activeInput: typeof FIAT_INPUT | typeof CRYPTO_INPUT;
    setActiveInput: React.Dispatch<React.SetStateAction<typeof FIAT_INPUT | typeof CRYPTO_INPUT>>;
}

const FiatInput = ({ activeInput, setActiveInput }: Props) => {
    const {
        register,
        errors,
        control,
        formState,
        amountLimits,
        sellInfo,
        setAmountLimits,
        defaultCurrency,
        quotesRequest,
        onFiatAmountChange,
        getValues,
    } = useCoinmarketSellFormContext();

    const fiatInputValue = getValues(FIAT_INPUT);

    return (
        <Input
            noTopLabel
            defaultValue=""
            innerRef={register({
                validate: (value: string) => {
                    if (activeInput === FIAT_INPUT) {
                        if (!value) {
                            if (formState.isSubmitting) {
                                return <Translation id="TR_SELL_VALIDATION_ERROR_EMPTY" />;
                            }
                            return;
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
            })}
            onFocus={() => {
                setActiveInput(FIAT_INPUT);
            }}
            onChange={event => {
                setActiveInput(FIAT_INPUT);
                onFiatAmountChange(event.target.value);
            }}
            state={getInputState(errors.fiatInput, fiatInputValue)}
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
                    render={({ onChange, value }) => (
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
