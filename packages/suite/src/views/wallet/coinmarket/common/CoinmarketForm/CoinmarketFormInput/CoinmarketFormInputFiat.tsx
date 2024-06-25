import { useSelector, useTranslation } from 'src/hooks/suite';
import { CoinmarketFormInput, CoinmarketFormOption, CoinmarketFormOptionLabel } from '../../..';
import { Controller } from 'react-hook-form';
import { Select } from '@trezor/components';
import { NumberInput } from 'src/components/suite';
import { validateDecimals, validateMin } from 'src/utils/suite/validation';
import { getInputState } from '@suite-common/wallet-utils';
import { buildFiatOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { formInputsMaxLength } from '@suite-common/validators';
import { fiatCurrencies } from '@suite-common/suite-config';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { useDidUpdate } from '@trezor/react-utils';
import { FiatCurrencyOption } from 'src/types/wallet/coinmarketCommonTypes';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import { CoinmarketFormInputProps } from 'src/types/coinmarket/coinmarketForm';

const CoinmarketFormInputFiat = ({ label, className }: CoinmarketFormInputProps) => {
    const { translationString } = useTranslation();
    const account = useSelector(state => state.wallet.selectedAccount.account);
    const {
        formState: { errors },
        control,
        amountLimits,
        defaultCurrency,
        buyInfo,
        trigger,
        setAmountLimits,
        setValue,
        clearErrors,
    } = useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const fiatInput = 'fiatInput';
    const cryptoInput = 'cryptoInput';
    const currencySelect = 'currencySelect';

    const fiatInputRules = {
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: 2 }),
            minFiat: (value: string) => {
                if (value && amountLimits?.minFiat && Number(value) < amountLimits.minFiat) {
                    return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT', {
                        minimum: amountLimits.minFiat,
                        currency: amountLimits.currency,
                    });
                }
            },
            maxFiat: (value: string) => {
                if (value && amountLimits?.maxFiat && Number(value) > amountLimits.maxFiat) {
                    return translationString('TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT', {
                        maximum: amountLimits.maxFiat,
                        currency: amountLimits.currency,
                    });
                }
            },
        },
    };

    useDidUpdate(() => {
        trigger('fiatInput');
    }, [amountLimits?.maxFiat, amountLimits?.minFiat, trigger]);

    if (!account) return null;

    return (
        <CoinmarketFormInput className={className}>
            <CoinmarketFormInputLabel label={label} />
            <NumberInput
                name={fiatInput}
                onChange={() => {
                    setValue(cryptoInput, '');
                    clearErrors(cryptoInput);
                }}
                inputState={getInputState(errors.fiatInput)}
                control={control}
                rules={fiatInputRules}
                maxLength={formInputsMaxLength.amount}
                bottomText={errors[fiatInput]?.message || null}
                innerAddon={
                    <Controller
                        name={currencySelect}
                        defaultValue={defaultCurrency}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <Select
                                value={value}
                                onChange={(selected: FiatCurrencyOption) => {
                                    onChange(selected);
                                    setAmountLimits(undefined);
                                    setValue(
                                        fiatInput,
                                        buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies.get(
                                            selected.value,
                                        ),
                                    );
                                }}
                                options={Object.keys(fiatCurrencies)
                                    .filter(c => buyInfo?.supportedFiatCurrencies.has(c))
                                    .map((currency: string) => buildFiatOption(currency))}
                                formatOptionLabel={option => {
                                    return (
                                        <CoinmarketFormOption>
                                            <CoinmarketFormOptionLabel>
                                                {option.label}
                                            </CoinmarketFormOptionLabel>
                                        </CoinmarketFormOption>
                                    );
                                }}
                                data-test="@coinmarket/form/fiat-currency-select"
                                isClearable={false}
                                minValueWidth="58px"
                                isSearchable
                                isClean
                            />
                        )}
                    />
                }
                hasBottomPadding={false}
                data-test="@coinmarket/form/fiat-input"
            />
        </CoinmarketFormInput>
    );
};

export default CoinmarketFormInputFiat;
