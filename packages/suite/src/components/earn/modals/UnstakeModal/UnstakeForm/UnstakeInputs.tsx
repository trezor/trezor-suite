import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useFormatters } from '@suite-common/formatters';
import { formInputsMaxLength } from '@suite-common/validators';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Column, type FractionButtonProps, Text } from '@trezor/components';
import { InputWithOptions } from '@trezor/product-components';

import { type WithdrawalFormState } from 'src/components/earn/forms/SupplyFormContext';
import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useWithdrawalFormContext } from 'src/hooks/earn/useWithdrawalForm';
import { useSelector } from 'src/hooks/suite';
import { FIAT_INPUT, OUTPUT_AMOUNT } from 'src/types/earn/earnFormFields';
import {
    validateCryptoLimits,
    validateDecimals,
    validateFiatLimits,
    validateMin,
} from 'src/utils/suite/validation';

export const UnstakeInputs = () => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();

    const locale = useSelector(selectLanguage);

    const {
        account,
        control,
        network,
        formState: { errors },
        amountLimits,
        getValues,
        onCryptoAmountChange,
        onFiatAmountChange,
        baseCurrencyCode,
        currentRate,
        setRatioAmount,
        setCurrency,
    } = useWithdrawalFormContext();

    const {
        autocompoundBalance = '0',
        depositedBalance = '0',
        restakedReward = '0',
    } = getStakingDataForNetwork(account) ?? {};

    const isRewardsVisible = restakedReward != '';
    const isRewardsDisabled = restakedReward === '0';

    const { symbol } = account;
    const networkDisplaySymbol = getNetworkDisplaySymbol(symbol);

    const { outputs } = getValues();
    const amount = outputs?.[0]?.amount;

    const cryptoError = errors.cryptoInput;
    const fiatError = errors.fiatInput;

    const fiatInputRules = {
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: 2 }),
            limits: validateFiatLimits(translationString, {
                amountLimits,
                localCurrency: baseCurrencyCode,
                formatter: CryptoAmountFormatter,
                decimals: network.decimals,
                rate: currentRate?.rate,
            }),
        },
    };

    const cryptoInputRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: network.decimals }),
            limits: validateCryptoLimits(translationString, {
                amountLimits,
                formatter: CryptoAmountFormatter,
            }),
        },
    };

    const labelLeft = <Translation id="AMOUNT" />;

    return (
        <Column gap={12} alignItems="center">
            <InputWithOptions<WithdrawalFormState>
                data-testid="@staking/form"
                onCurrencyChange={setCurrency}
                cryptoInputProps={{
                    name: OUTPUT_AMOUNT,
                    locale,
                    labelLeft,
                    control,
                    rules: cryptoInputRules,
                    maxLength: formInputsMaxLength.amount,
                    rightContent: (
                        <Text intent="neutral" priority="secondary">
                            {networkDisplaySymbol}
                        </Text>
                    ),
                    hasError: !!(cryptoError || fiatError),
                    onChange: onCryptoAmountChange,
                }}
                fiatInputProps={
                    currentRate?.rate
                        ? {
                              name: FIAT_INPUT,
                              locale,
                              labelLeft,
                              control,
                              rules: fiatInputRules,
                              maxLength: formInputsMaxLength.fiat,
                              rightContent: (
                                  <Text intent="neutral" priority="secondary">
                                      {baseCurrencyCode.toUpperCase()}
                                  </Text>
                              ),
                              hasError: !!(fiatError || cryptoError),
                              onChange: onFiatAmountChange,
                          }
                        : undefined
                }
                switchTranslation={{
                    fiat: (
                        <Translation
                            id="TR_TRADING_ENTER_AMOUNT_IN"
                            values={{ currency: baseCurrencyCode.toUpperCase() }}
                        />
                    ),
                    crypto: (
                        <Translation
                            id="TR_TRADING_ENTER_AMOUNT_IN"
                            values={{ currency: networkDisplaySymbol }}
                        />
                    ),
                }}
                fiatValue={
                    <BaseCurrencyValue
                        amount={amount ?? ''}
                        symbol={symbol}
                        showApproximationIndicator
                    >
                        {({ value }) =>
                            value ? (
                                <Text
                                    typographyStyle="body-xs"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    {value}
                                </Text>
                            ) : null
                        }
                    </BaseCurrencyValue>
                }
                options={[
                    {
                        id: 'TR_FRACTION_BUTTONS_10_PERCENT',
                        children: <Translation id="TR_FRACTION_BUTTONS_10_PERCENT" />,
                        onClick: () => setRatioAmount(10),
                    },
                    {
                        id: 'TR_FRACTION_BUTTONS_25_PERCENT',
                        children: <Translation id="TR_FRACTION_BUTTONS_25_PERCENT" />,
                        onClick: () => setRatioAmount(4),
                    },
                    {
                        id: 'TR_FRACTION_BUTTONS_50_PERCENT',
                        children: <Translation id="TR_FRACTION_BUTTONS_50_PERCENT" />,
                        onClick: () => setRatioAmount(2),
                    },
                    {
                        id: 'TR_FRACTION_BUTTONS_MAX',
                        children: <Translation id="TR_FRACTION_BUTTONS_MAX" />,
                        tooltip: (
                            <Column alignItems="flex-end">
                                <FormattedCryptoAmount
                                    value={autocompoundBalance}
                                    symbol={symbol}
                                />
                                <Text typographyStyle="body-sm">
                                    <BaseCurrencyValue
                                        amount={depositedBalance}
                                        symbol={symbol}
                                        fiatAmountFormatterOptions={{ roundingMode: 'floor' }}
                                    >
                                        {({ value }) => value && <span>{value}</span>}
                                    </BaseCurrencyValue>
                                    {isRewardsVisible && (
                                        <>
                                            {' + '}
                                            <Text intent="brand">
                                                <BaseCurrencyValue
                                                    amount={restakedReward}
                                                    symbol={symbol}
                                                />
                                            </Text>
                                        </>
                                    )}
                                </Text>
                            </Column>
                        ),
                        onClick: () => onCryptoAmountChange(autocompoundBalance),
                    },
                    ...(isRewardsVisible
                        ? [
                              {
                                  id: 'TR_FRACTION_BUTTONS_REWARDS',
                                  children: <Translation id="TR_FRACTION_BUTTONS_REWARDS" />,
                                  tooltip: isRewardsDisabled ? (
                                      <Translation id="TR_STAKE_NO_REWARDS" />
                                  ) : (
                                      <Column alignItems="flex-end">
                                          <FormattedCryptoAmount
                                              value={restakedReward}
                                              symbol={symbol}
                                          />
                                          <Text intent="brand">
                                              <BaseCurrencyValue
                                                  amount={restakedReward}
                                                  symbol={symbol}
                                              />
                                          </Text>
                                      </Column>
                                  ),
                                  isSubtle: true,
                                  variant: 'primary',
                                  isDisabled: isRewardsDisabled,
                                  onClick: () => onCryptoAmountChange(restakedReward),
                              } as FractionButtonProps,
                          ]
                        : []),
                ]}
            />
        </Column>
    );
};
