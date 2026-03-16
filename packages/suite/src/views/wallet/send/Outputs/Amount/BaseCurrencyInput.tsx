import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { useTranslation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { updateFiatRatesThunk } from '@suite-common/wallet-core';
import {
    type BaseCurrencyOption,
    type FiatRatesResult,
    type Output,
    type Timestamp,
    type TokenAddress,
} from '@suite-common/wallet-types';
import {
    buildCurrencyLongOption,
    buildCurrencyShortOption,
    findToken,
    getDecimalsForBaseCurrency,
    isLowAnonymityWarning,
    parseBaseCurrencyToFormattedCrypto,
    parseCryptoToFormattedBaseCurrency,
} from '@suite-common/wallet-utils';
import {
    type BaseCurrencyCode,
    fiatBaseCurrencies,
    valuablesBaseCurrencies,
} from '@trezor/blockchain-link-types';
import { Select } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber, typedObjectKeys } from '@trezor/utils';

import { useSendFormContext } from 'src/hooks/wallet';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { selectLanguage } from 'src/selectors/suite/suiteSelectors';
import { validateDecimals } from 'src/utils/suite/validation';

type FiatInputProps = {
    output: Partial<Output>;
    outputId: number;
    isSendMaxActive?: boolean;
    labelLeft?: React.ReactNode;
    labelHoverRight?: React.ReactNode;
    labelRight?: React.ReactNode;
};

export const BaseCurrencyInput = ({
    output,
    outputId,
    isSendMaxActive,
    labelLeft,
    labelHoverRight,
    labelRight,
}: FiatInputProps) => {
    const {
        account,
        network,
        formState: { errors },
        getDefaultValue,
        handleFiatChange,
        control,
        setValue,
        composeTransaction,
        watch,
    } = useSendFormContext();

    const { shouldSendInSats, areSatsDisplayed } = useBitcoinAmountUnit(account.symbol);

    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const baseCurrencyInputName = `outputs.${outputId}.fiat` as const;
    const currencyInputName = `outputs.${outputId}.currency` as const;
    const amountInputName = `outputs.${outputId}.amount` as const;
    const tokenInputName = `outputs.${outputId}.token` as const;

    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.fiat : undefined;
    const baseCurrencyValue = getDefaultValue(baseCurrencyInputName, output.fiat || '');
    const tokenContractAddress = getDefaultValue(tokenInputName, output.token);

    const cryptoAmountValue = getDefaultValue(amountInputName, '');
    const token = findToken(account.tokens, tokenContractAddress);

    const currencyValue = watch(currencyInputName);
    const baseCurrencyCode = currencyValue.value;

    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        code: baseCurrencyCode,
        isInSats: areSatsDisplayed,
    });

    const recalculate = (rate: number) => {
        const cryptoValue = new BigNumber(cryptoAmountValue);
        const fiatValue = new BigNumber(baseCurrencyValue);
        const cryptoDecimals = token ? token.decimals : network.decimals;

        if (rate && !cryptoValue.isNaN() && baseCurrencyCode !== '') {
            const baseFormatOptions = {
                areSatsDisplayed,
                symbol: network.symbol,
                rate,
            };

            if (isSendMaxActive) {
                const formattedAmount = parseCryptoToFormattedBaseCurrency({
                    ...baseFormatOptions,
                    value: cryptoValue,
                    baseCurrencyCode,
                    baseCurrencyToSats: shouldSendInSats === true,
                });
                setValue(baseCurrencyInputName, formattedAmount || '', {
                    shouldValidate: true,
                });
            } else {
                const formattedAmount = parseBaseCurrencyToFormattedCrypto({
                    ...baseFormatOptions,
                    value: fiatValue,
                    isCryptoInSats: shouldSendInSats === true,
                    areSatsDisplayed: false,
                    cryptoDecimals,
                });
                setValue(amountInputName, formattedAmount || '', {
                    shouldValidate: true,
                });

                composeTransaction(amountInputName);
            }
        }
    };

    // relation case:
    // Amount input has an error and Fiat has not (but it should)
    // usually this happens after Fiat > Amount recalculation (from here, onChange event)
    // or as a result on composeTransaction process
    const amountError = outputError ? outputError.amount : undefined;
    const errorToDisplay = !error && baseCurrencyValue && amountError ? amountError : error;

    const isLowAnonymity = isLowAnonymityWarning(outputError);
    const hasError = !!errorToDisplay;
    const bottomText = isLowAnonymity ? null : errorToDisplay?.message;

    const handleChange = (value: string) => handleFiatChange({ outputId, token, value });

    const rules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            decimals: validateDecimals(translationString, { decimals: baseCurrencyDecimals }),
        },
    };

    interface CallbackParams {
        field: {
            onChange: (...event: any[]) => void;
            value: BaseCurrencyOption;
        };
    }

    const options = useMemo(
        () => [
            {
                label: translationString('TR_BASE_CURRENCY_FIAT'),
                options: typedObjectKeys(fiatBaseCurrencies).map(currency =>
                    buildCurrencyLongOption({ currency, areSatsDisplayed }),
                ),
            },
            {
                label: translationString('TR_BASE_CURRENCY_VALUABLES'),
                options: typedObjectKeys(valuablesBaseCurrencies).map(currency =>
                    buildCurrencyLongOption({ currency, areSatsDisplayed }),
                ),
            },
        ],
        [translationString, areSatsDisplayed],
    );

    const renderCurrencySelect = ({
        field: { onChange, value: selectedOption },
    }: CallbackParams) => (
        <Select
            options={options}
            value={buildCurrencyShortOption({
                currency: selectedOption.value,
                areSatsDisplayed,
            })}
            isClearable={false}
            isSearchable
            size="small"
            isClean
            data-testid={currencyInputName}
            onChange={async (selected: BaseCurrencyOption) => {
                // propagate changes to FormState
                onChange(selected);

                // Get (fresh) fiat rates for newly selected currency
                const updateFiatRatesResult = await dispatch(
                    updateFiatRatesThunk({
                        tickers: [
                            {
                                symbol: account.symbol,
                                tokenAddress: token?.contract as TokenAddress,
                            },
                        ],
                        baseCurrencyCode: selected.value as BaseCurrencyCode,
                        rateType: 'current',
                        fetchAttemptTimestamp: Date.now() as Timestamp,
                    }),
                );

                if (updateFiatRatesResult.meta.requestStatus === 'fulfilled') {
                    // not type-safe and should be addressed in the future
                    const fiatRates =
                        updateFiatRatesResult.payload as PromiseSettledResult<FiatRatesResult>[];

                    const successfulResult = fiatRates.find(
                        (result): result is PromiseFulfilledResult<FiatRatesResult> =>
                            result.status === 'fulfilled',
                    );

                    if (successfulResult?.value?.rate) {
                        recalculate(successfulResult.value.rate);
                    }
                }
            }}
        />
    );

    return (
        <NumberInput
            labelHoverRight={labelHoverRight}
            labelRight={labelRight}
            labelLeft={labelLeft}
            locale={locale}
            control={control}
            hasError={hasError}
            onChange={handleChange}
            name={baseCurrencyInputName}
            data-testid={baseCurrencyInputName}
            defaultValue={baseCurrencyValue}
            maxLength={formInputsMaxLength.fiat}
            rules={rules}
            bottomText={bottomText || null}
            rightContent={
                <Controller
                    control={control}
                    name={currencyInputName}
                    defaultValue={currencyValue}
                    render={renderCurrencySelect}
                />
            }
        />
    );
};
