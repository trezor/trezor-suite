import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { formatStakingAmount, useStakingAccountPosition } from '@suite-common/earn-staking';
import {
    getStakingPositionPrincipal,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { AMOUNT_MAX_LENGTH } from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Column, type FractionButtonProps, Text } from '@trezor/components';
import { InputWithOptions } from '@trezor/product-components';

import { type WithdrawalFormState } from '#src/components/earn/forms/StakeFormContext';
import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useWithdrawalFormContext } from '#src/hooks/earn/useWithdrawalForm';
import { useSelector } from '#src/hooks/suite/useSelector';
import { FIAT_INPUT, OUTPUT_AMOUNT } from '#src/types/earn/earnFormFields';
import {
    validateCryptoLimits,
    validateDecimals,
    validateFiatLimits,
    validateMin,
    validateSolanaUnstakeAmount,
    validateSolanaUnstakeFiatAmount,
} from '#src/utils/suite/validation';

const ZERO_STAKING_AMOUNT = stakingAmountSchema.parse('0');

export const UnstakeInputs = () => {
    // React Compiler: `getValues` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const { translationString } = useTranslation();
    const { CryptoAmountFormatter, BaseCurrencyAmountFormatter } = useFormatters();

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
        unstakableBalance,
    } = useWithdrawalFormContext();

    const { symbol } = account;

    const { descriptor, position, totals } = useStakingAccountPosition(account.key);

    const principal =
        position === null || descriptor === null
            ? ZERO_STAKING_AMOUNT
            : getStakingPositionPrincipal(position, descriptor.rewardsKind);
    const depositedBalance = formatStakingAmount({ amount: principal, networkSymbol: symbol });
    const rewards = formatStakingAmount({ amount: totals.rewards, networkSymbol: symbol });

    // Only rewards restaked into the balance can be unstaked on their own.
    const isRewardsVisible = descriptor?.rewardsKind === 'compounded';
    const isRewardsDisabled = !isPositiveBalance(rewards);
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
                fiatFormatter: BaseCurrencyAmountFormatter,
                decimals: network.decimals,
                rate: currentRate?.rate,
            }),
            solanaUnstakeAmount: validateSolanaUnstakeFiatAmount(translationString, {
                account,
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
            solanaUnstakeAmount: validateSolanaUnstakeAmount(translationString, { account }),
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
                    maxLength: AMOUNT_MAX_LENGTH,
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
                              maxLength: AMOUNT_MAX_LENGTH,
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
                            id="TR_ENTER_AMOUNT_IN"
                            values={{ currency: baseCurrencyCode.toUpperCase() }}
                        />
                    ),
                    crypto: (
                        <Translation
                            id="TR_ENTER_AMOUNT_IN"
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
                                    overflowWrap="anywhere"
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
                                    value={unstakableBalance}
                                    networkSymbol={symbol}
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
                                                    amount={rewards}
                                                    symbol={symbol}
                                                />
                                            </Text>
                                        </>
                                    )}
                                </Text>
                            </Column>
                        ),
                        onClick: () => onCryptoAmountChange(unstakableBalance),
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
                                              value={rewards}
                                              networkSymbol={symbol}
                                          />
                                          <Text intent="brand">
                                              <BaseCurrencyValue amount={rewards} symbol={symbol} />
                                          </Text>
                                      </Column>
                                  ),
                                  isSubtle: true,
                                  variant: 'primary',
                                  isDisabled: isRewardsDisabled,
                                  onClick: () => onCryptoAmountChange(rewards),
                              } as FractionButtonProps,
                          ]
                        : []),
                ]}
            />
        </Column>
    );
};
