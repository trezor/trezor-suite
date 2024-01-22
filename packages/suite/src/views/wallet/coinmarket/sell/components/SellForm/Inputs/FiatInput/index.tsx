import { fiatCurrencies } from '@suite-common/suite-config';
import { NumberInput } from 'src/components/suite';
import { Select } from '@trezor/components';
import { buildOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Controller } from 'react-hook-form';
import { useCoinmarketSellFormContext } from 'src/hooks/wallet/useCoinmarketSellForm';
import { getInputState } from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { FIAT_CURRENCY_SELECT, FIAT_INPUT } from 'src/types/wallet/coinmarketSellForm';
import { useTranslation } from 'src/hooks/suite';
import { validateDecimals, validateMin } from 'src/utils/suite/validation';

const FiatInput = () => {
    const {
        formState: { errors },
        control,
        amountLimits,
        sellInfo,
        setAmountLimits,
        defaultCurrency,
        quotesRequest,
        onFiatAmountChange,
        getValues,
        account,
    } = useCoinmarketSellFormContext();

    const { translationString } = useTranslation();

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
                    if (amountLimits.maxFiat && amount > amountLimits.maxFiat) {
                        return translationString('TR_SELL_VALIDATION_ERROR_MAXIMUM_FIAT', {
                            maximum: amountLimits.maxFiat,
                            currency: amountLimits.currency,
                        });
                    }
                }
            },
        },
    };

    return (
        <NumberInput
            control={control}
            defaultValue=""
            rules={fiatInputRules}
            onChange={onFiatAmountChange}
            isDisabled={tokenData !== undefined}
            inputState={getInputState(errors.fiatInput)}
            name={FIAT_INPUT}
            maxLength={formInputsMaxLength.amount}
            bottomText={errors[FIAT_INPUT]?.message || null}
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
                            options={Object.keys(fiatCurrencies)
                                .filter(c => sellInfo?.supportedFiatCurrencies.has(c))
                                .map((currency: string) => buildOption(currency))}
                            isSearchable
                            value={value}
                            isClearable={false}
                            minValueWidth="45px"
                            isClean
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
