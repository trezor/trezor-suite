import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useFormatters } from '@suite-common/formatters';
import { formInputsMaxLength } from '@suite-common/validators';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type StakeFormState } from '@suite-common/wallet-types';
import { getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-utils';
import { Banner, Column, Text } from '@trezor/components';
import { InputWithOptions } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useSupplyFormContext } from 'src/hooks/earn/useSupplyForm';
import { useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/earn/earnFormFields';
import { validateStakingMax } from 'src/utils/suite/staking';
import {
    validateCryptoLimits,
    validateDecimals,
    validateFiatLimits,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import { type FormPercentButtonValue } from 'src/views/wallet/trading/common/TradingForm/tradingFormInputsUtils';

export const StakeInputs = () => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const locale = useSelector(selectLanguage);
    const analytics = useAnalytics();

    const {
        control,
        account,
        network,
        formState: { errors },
        amountLimits,
        getValues,
        onCryptoAmountChange,
        onFiatAmountChange,
        baseCurrencyCode,
        isAmountForWithdrawalWarningShown,
        isLessAmountForWithdrawalWarningShown,
        showAdviceBanner,
        currentRate,
        setRatioAmount,
        setMax,
        setCurrency,
    } = useSupplyFormContext();

    const stakingLimits = getStakingLimitsByNetworkSymbol(account.symbol);

    if (!stakingLimits) {
        return null;
    }

    const cryptoError = errors.cryptoInput;
    const fiatError = errors.fiatInput;

    const { outputs } = getValues();
    const amount = outputs?.[0]?.amount;

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
            max: validateStakingMax(translationString, {
                maxAmount: stakingLimits.MAX_AMOUNT_FOR_STAKING,
            }),
            decimals: validateDecimals(translationString, { decimals: network.decimals }),
            reserveOrBalance: validateReserveOrBalance(translationString, {
                account,
            }),
            limits: validateCryptoLimits(translationString, {
                amountLimits,
                formatter: CryptoAmountFormatter,
            }),
        },
    };

    const shouldShowAmountForWithdrawalWarning =
        isLessAmountForWithdrawalWarningShown || isAmountForWithdrawalWarningShown;

    const networkDisplaySymbol = getNetworkDisplaySymbol(account.symbol);

    const isFractionButtonDisabled = (divisor: number) => {
        if (!account.formattedBalance || !network.decimals) return false;

        return new BigNumber(account.formattedBalance)
            .dividedBy(divisor)
            .decimalPlaces(network.decimals)
            .lte(stakingLimits.MIN_AMOUNT_FOR_STAKING);
    };

    const balance = new BigNumber(account.formattedBalance || '0');
    const maxCrypto = new BigNumber(amountLimits?.maxCrypto ?? '0');

    const isBalanceBelowMinStake = balance.lt(
        stakingLimits.MIN_AMOUNT_FOR_STAKING.plus(stakingLimits.MIN_BALANCE_FOR_FEE_BUFFER),
    );

    const missingAmount =
        balance.gte(stakingLimits.MIN_AMOUNT_FOR_STAKING) &&
        maxCrypto.lte(stakingLimits.MIN_AMOUNT_FOR_STAKING)
            ? stakingLimits.MIN_AMOUNT_FOR_STAKING.minus(amountLimits?.maxCrypto ?? '0')
            : null;

    const tooltip = (
        <Translation
            id="TR_STAKE_MIN_AMOUNT_TOOLTIP"
            values={{
                amount: stakingLimits.MIN_AMOUNT_FOR_STAKING.toString(),
                networkDisplaySymbol,
            }}
        />
    );

    const maxTooltip = missingAmount && (
        <Translation
            id="TR_STAKING_VALIDATION_ERROR_NOT_ENOUGH_FOR_FEES_CRYPTO"
            values={{
                missingAmount: CryptoAmountFormatter.format(missingAmount.toString(), {
                    isBalance: true,
                    symbol: account.symbol,
                    maxDisplayedDecimals: network.decimals,
                }),
            }}
        />
    );

    const reportButtonClickEvent = (value: FormPercentButtonValue) =>
        analytics.report({
            type: events.appFormPercentButtonsEvent.name,
            payload: { type: 'staking', value },
        });

    return (
        <Column gap={12} alignItems="center">
            <InputWithOptions<StakeFormState>
                data-testid="@staking/form"
                onCurrencyChange={setCurrency}
                cryptoInputProps={{
                    name: CRYPTO_INPUT,
                    locale,
                    labelLeft: <Translation id="AMOUNT" />,
                    control,
                    rules: cryptoInputRules,
                    maxLength: formInputsMaxLength.amount,
                    rightContent: (
                        <Text intent="neutral" priority="secondary">
                            {networkDisplaySymbol}
                        </Text>
                    ),
                    bottomText: errors[CRYPTO_INPUT]?.message ?? null,
                    hasError: !!(cryptoError || fiatError),
                    onChange: onCryptoAmountChange,
                }}
                fiatInputProps={
                    currentRate?.rate
                        ? {
                              name: FIAT_INPUT,
                              locale,
                              labelLeft: <Translation id="AMOUNT" />,
                              control,
                              rules: fiatInputRules,
                              maxLength: formInputsMaxLength.fiat,
                              rightContent: (
                                  <Text intent="neutral" priority="secondary">
                                      {baseCurrencyCode.toUpperCase()}
                                  </Text>
                              ),
                              bottomText: errors[FIAT_INPUT]?.message ?? null,
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
                        amount={amount}
                        symbol={account.symbol}
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
                        tooltip: isFractionButtonDisabled(10) && tooltip,
                        isDisabled: isFractionButtonDisabled(10),
                        onClick: () => {
                            reportButtonClickEvent('10%');
                            setRatioAmount(10);
                        },
                    },
                    {
                        id: 'TR_FRACTION_BUTTONS_25_PERCENT',
                        children: <Translation id="TR_FRACTION_BUTTONS_25_PERCENT" />,
                        tooltip: isFractionButtonDisabled(4) && tooltip,
                        isDisabled: isFractionButtonDisabled(4),
                        onClick: () => {
                            reportButtonClickEvent('25%');
                            setRatioAmount(4);
                        },
                    },
                    {
                        id: 'TR_FRACTION_BUTTONS_50_PERCENT',
                        children: <Translation id="TR_FRACTION_BUTTONS_50_PERCENT" />,
                        tooltip: isFractionButtonDisabled(2) && tooltip,
                        isDisabled: isFractionButtonDisabled(2),
                        onClick: () => {
                            reportButtonClickEvent('50%');
                            setRatioAmount(2);
                        },
                    },
                    {
                        id: 'TR_FRACTION_BUTTONS_MAX',
                        children: <Translation id="TR_FRACTION_BUTTONS_MAX" />,
                        tooltip: maxTooltip || (isBalanceBelowMinStake && tooltip),
                        isDisabled: isBalanceBelowMinStake || !!missingAmount,
                        onClick: () => {
                            reportButtonClickEvent('max');
                            setMax();
                        },
                    },
                ]}
            />
            {shouldShowAmountForWithdrawalWarning && (
                <Banner
                    data-testid="@staking/form/withdrawal-warning"
                    intent="info"
                    width="100%"
                    description={
                        <Translation
                            id={
                                isLessAmountForWithdrawalWarningShown
                                    ? 'TR_STAKE_LEFT_SMALL_AMOUNT_FOR_WITHDRAWAL'
                                    : 'TR_STAKE_LEFT_AMOUNT_FOR_WITHDRAWAL'
                            }
                            values={{
                                amount: stakingLimits.MIN_FOR_WITHDRAWALS.toString(),
                                networkDisplaySymbol,
                            }}
                        />
                    }
                />
            )}
            {showAdviceBanner && !isAmountForWithdrawalWarningShown && (
                <Banner
                    data-testid="@staking/form/withdrawal-warning"
                    intent="info"
                    width="100%"
                    description={
                        <Translation
                            id="TR_STAKE_RECOMMENDED_AMOUNT_FOR_WITHDRAWALS"
                            values={{
                                amount: stakingLimits.MIN_FOR_WITHDRAWALS.toString(),
                                networkDisplaySymbol,
                            }}
                        />
                    }
                />
            )}
        </Column>
    );
};
