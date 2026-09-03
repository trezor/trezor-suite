import { useMemo, useState } from 'react';
import { useFormState } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useDispatch } from '@suite-common/redux-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    TRON_STAKING_RESERVE,
    composeTronFreezeFeeLevelsThunk,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { asAmountSubunit, subunitsToUnits, toFiatCurrency } from '@suite-common/wallet-utils';
import { Banner, Button, Column, Row, Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useSelector } from 'src/hooks/suite';
import {
    validateDecimals,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';

import { TronCurrencySwitchButton } from '../TronCurrencySwitchButton';
import { useTronStakeContext } from '../TronStakeContext';

export const TronFreezeAmount = () => {
    const dispatch = useDispatch();
    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();
    const { account, form, actions, amountInput } = useTronStakeContext();
    const { control, setValue } = form.methods;
    const { errors } = useFormState({ control });
    const isDisabled = !!actions.pendingTxid;

    const [isMaxActive, setIsMaxActive] = useState(false);

    const {
        currency,
        setCurrency,
        onCryptoAmountChange,
        onFiatAmountChange,
        currentRate,
        baseCurrencyCode,
    } = amountInput;

    const availableBalance = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(account.availableBalance)),
        symbol: account.symbol,
    }).toString();

    const stakingLimits = getStakingLimitsByNetworkSymbol(account.symbol);
    const minStakingAmount = stakingLimits?.MIN_AMOUNT_FOR_STAKING;

    const networkDisplaySymbol = getNetworkDisplaySymbol(account.symbol);

    const amount = form.methods.watch('amount');
    const resourceType = form.methods.watch('resourceType');

    const maxFreezeAmount = useMemo(async () => {
        const availableBalanceUnits = subunitsToUnits({
            value: asAmountSubunit(new BigNumber(account.availableBalance)),
            symbol: account.symbol,
        }).toString();

        const levels = await dispatch(
            composeTronFreezeFeeLevelsThunk({
                account,
                amount: availableBalanceUnits,
                resourceType,
            }),
        )
            .unwrap()
            .catch(() => undefined);

        const feeInSun = levels?.normal?.type === 'final' ? levels.normal.fee : '0';
        const maxInSun = BigNumber.max(new BigNumber(account.availableBalance).minus(feeInSun), 0);

        return subunitsToUnits({
            value: asAmountSubunit(maxInSun),
            symbol: account.symbol,
        }).toString();
    }, [account, resourceType, dispatch]);

    const cryptoInputRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            min: validateMin(translationString),
            minStakingAmount: (value: string) => {
                if (value && minStakingAmount?.isGreaterThan(value)) {
                    return translationString('TR_EARN_STAKING_DASHBOARD_MINIMUM_STAKE', {
                        amount: minStakingAmount.toString(),
                        displaySymbol: networkDisplaySymbol,
                    });
                }
            },
            decimals: validateDecimals(translationString, {
                decimals: getNetwork(account.symbol).decimals,
            }),
            reserveOrBalance: async (value: string) => {
                const reserveOrBalanceResult = validateReserveOrBalance(translationString, {
                    account,
                })(value);

                if (reserveOrBalanceResult) {
                    return reserveOrBalanceResult;
                }

                const maxFreezeAmountInUnits = await maxFreezeAmount;

                if (
                    maxFreezeAmountInUnits &&
                    new BigNumber(value).isGreaterThan(maxFreezeAmountInUnits)
                ) {
                    return translationString('AMOUNT_NOT_ENOUGH_CURRENCY_FEE', {
                        networkDisplaySymbol,
                    });
                }
            },
        },
    };

    const fiatInputRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            min: validateMin(translationString),
            minStakingAmount: (value: string) => {
                if (!currentRate?.rate) return true;
                if (!minStakingAmount) return true;

                const minStakingAmountFiat = toFiatCurrency({
                    amount: minStakingAmount.toString(),
                    rate: currentRate.rate,
                })?.toFixed(2, BigNumber.ROUND_FLOOR);

                if (!minStakingAmountFiat) return true;

                if (value && new BigNumber(minStakingAmountFiat).isGreaterThan(value)) {
                    return translationString('TR_EARN_STAKING_DASHBOARD_MINIMUM_STAKE', {
                        amount: minStakingAmountFiat,
                        displaySymbol: baseCurrencyCode.toUpperCase(),
                    });
                }
            },
            decimals: validateDecimals(translationString, { decimals: 2 }),
            balance: async (value: string) => {
                if (!currentRate?.rate) return true;

                const maxFreezeAmountInUnits = await maxFreezeAmount;

                const maxFreezeAmountInFiat = toFiatCurrency({
                    amount: maxFreezeAmountInUnits,
                    rate: currentRate.rate,
                })?.toFixed(2, BigNumber.ROUND_FLOOR);

                if (
                    maxFreezeAmountInFiat &&
                    new BigNumber(value).isGreaterThan(maxFreezeAmountInFiat)
                ) {
                    return translationString('AMOUNT_NOT_ENOUGH_CURRENCY_FEE', {
                        networkDisplaySymbol,
                    });
                }
            },
        },
    };

    const handleCryptoAmountChange = (value: string) => {
        setIsMaxActive(false);
        onCryptoAmountChange(value);
    };

    const handleFiatAmountChange = (value: string) => {
        setIsMaxActive(false);
        onFiatAmountChange(value);
    };

    const handleSetMax = async () => {
        form.methods.clearErrors(['amount', 'fiatAmount']);
        setIsMaxActive(true);

        const maxFreezeAmountInUnits = await maxFreezeAmount;
        const maxAmount = BigNumber.max(
            new BigNumber(maxFreezeAmountInUnits).minus(TRON_STAKING_RESERVE),
            0,
        ).toString();

        form.methods.setValue('amount', maxAmount, { shouldValidate: true });

        if (currentRate?.rate) {
            const fiatValue = toFiatCurrency({
                amount: maxAmount,
                rate: currentRate.rate,
            })?.toFixed(2, BigNumber.ROUND_FLOOR);

            setValue('fiatAmount', fiatValue ?? '', { shouldDirty: true, shouldValidate: true });
        }
    };

    const hasError = !!errors.amount || !!errors.fiatAmount;
    const errorMessage = errors.amount?.message ?? errors.fiatAmount?.message;

    const amountBn = new BigNumber(amount || '0');

    const showLeftReserveBanner = isMaxActive && amountBn.isGreaterThan(0);

    const showRecommendedReserveBanner =
        !isMaxActive &&
        !hasError &&
        !!minStakingAmount &&
        amountBn.isGreaterThanOrEqualTo(minStakingAmount) &&
        new BigNumber(availableBalance).minus(amountBn).isLessThan(TRON_STAKING_RESERVE);

    const numberInputProps = {
        name: currency === 'crypto' ? 'amount' : 'fiatAmount',
        locale,
        control,
        rules: currency === 'crypto' ? cryptoInputRules : fiatInputRules,
        maxLength: currency === 'crypto' ? formInputsMaxLength.amount : formInputsMaxLength.fiat,
        isDisabled,
        hasError,
        onChange: currency === 'crypto' ? handleCryptoAmountChange : handleFiatAmountChange,
        rightContent: (
            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                {currency === 'crypto' ? networkDisplaySymbol : baseCurrencyCode.toUpperCase()}
            </Text>
        ),
    } as const;

    return (
        <Column gap={8}>
            <Row justifyContent="space-between" alignItems="center" gap={8}>
                <Text typographyStyle="body-md">
                    <Translation id="AMOUNT" />
                </Text>

                <TronCurrencySwitchButton
                    rate={currentRate}
                    currency={currency}
                    setCurrency={setCurrency}
                    fiatCurrencySymbol={baseCurrencyCode.toUpperCase()}
                    cryptoCurrencySymbol={networkDisplaySymbol}
                />
            </Row>

            <NumberInput {...numberInputProps} />

            <Row justifyContent="space-between" alignItems="center" gap={8}>
                <Row alignItems="center" gap={8}>
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation id="TR_STAKE_AVAILABLE" />
                        {': '}
                        <FormattedCryptoAmount value={availableBalance} symbol={account.symbol} />
                    </Text>
                    <Button
                        type="button"
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={handleSetMax}
                        isDisabled={isDisabled}
                    >
                        <Translation id="TR_FRACTION_BUTTONS_MAX" />
                    </Button>
                </Row>
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    <BaseCurrencyValue
                        amount={availableBalance}
                        symbol={account.symbol}
                        showApproximationIndicator
                    />
                </Text>
            </Row>

            {!!errorMessage && (
                <Banner intent="warning" description={<Text>{errorMessage}</Text>} />
            )}

            {showLeftReserveBanner && (
                <Banner
                    intent="info"
                    description={
                        <Translation
                            id="TR_EARN_TRON_RESERVE_LEFT_FOR_VOTING"
                            values={{
                                amount: TRON_STAKING_RESERVE.toString(),
                                networkDisplaySymbol,
                            }}
                        />
                    }
                />
            )}

            {showRecommendedReserveBanner && (
                <Banner
                    intent="info"
                    description={
                        <Translation
                            id="TR_EARN_TRON_RESERVE_RECOMMENDED_FOR_VOTING"
                            values={{
                                amount: TRON_STAKING_RESERVE.toString(),
                                networkDisplaySymbol,
                            }}
                        />
                    }
                />
            )}
        </Column>
    );
};
