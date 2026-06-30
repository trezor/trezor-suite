import { useFormState } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { formInputsMaxLength } from '@suite-common/validators';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    asAmountSubunit,
    getStakingLimitsByNetworkSymbol,
    subunitsToUnits,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
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
    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();
    const { account, form, actions, amountInput } = useTronStakeContext();
    const { control, getValues, setValue } = form.methods;
    const { errors } = useFormState({ control });
    const isDisabled = !!actions.pendingTxid;

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
            reserveOrBalance: validateReserveOrBalance(translationString, { account }),
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
            balance: (value: string) => {
                if (!currentRate?.rate) return true;

                const availableFiat = toFiatCurrency({
                    amount: availableBalance,
                    rate: currentRate.rate,
                })?.toFixed(2, BigNumber.ROUND_FLOOR);

                return (
                    !availableFiat ||
                    new BigNumber(value || 0).lte(availableFiat) ||
                    translationString('AMOUNT_IS_NOT_ENOUGH')
                );
            },
        },
    };

    const handleSetMax = async () => {
        form.methods.clearErrors(['amount', 'fiatAmount']);

        await actions.setMax();

        if (currentRate?.rate) {
            const maxAmount = getValues('amount');

            const fiatValue = toFiatCurrency({
                amount: maxAmount,
                rate: currentRate.rate,
            })?.toFixed(2, BigNumber.ROUND_FLOOR);

            setValue('fiatAmount', fiatValue ?? '', { shouldDirty: true });
        }
    };

    const hasError = !!errors.amount || !!errors.fiatAmount;
    const errorMessage = errors.amount?.message ?? errors.fiatAmount?.message;

    const numberInputProps = {
        name: currency === 'crypto' ? 'amount' : 'fiatAmount',
        locale,
        control,
        rules: currency === 'crypto' ? cryptoInputRules : fiatInputRules,
        maxLength: currency === 'crypto' ? formInputsMaxLength.amount : formInputsMaxLength.fiat,
        isDisabled,
        hasError,
        onChange: currency === 'crypto' ? onCryptoAmountChange : onFiatAmountChange,
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
        </Column>
    );
};
