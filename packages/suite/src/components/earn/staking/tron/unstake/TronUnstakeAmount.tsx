import { useFormState, useWatch } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useSelector } from '@suite-common/redux-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { Banner, Button, Column, Row, Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { validateDecimals, validateMin } from 'src/utils/suite/validation';

import { TronCurrencySwitchButton } from '../TronCurrencySwitchButton';
import { useTronStakeContext } from '../TronStakeContext';
import { getStakedBalance } from './unstakeUtils';

export const TronUnstakeAmount = () => {
    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();
    const { account, form, actions, amountInput } = useTronStakeContext();
    const { control } = form.methods;
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

    const resourceType = useWatch({ control, name: 'resourceType' });
    const stakedBalance = getStakedBalance(account, resourceType);

    const networkDisplaySymbol = getNetworkDisplaySymbol(account.symbol);

    const cryptoInputRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, {
                decimals: getNetwork(account.symbol).decimals,
            }),
            staked: (value: string) =>
                new BigNumber(value || 0).lte(stakedBalance) ||
                translationString('TR_EARN_TRON_UNSTAKE_AMOUNT_EXCEEDS_STAKED'),
        },
    };

    const fiatInputRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: 2 }),
            staked: (value: string) => {
                if (!currentRate?.rate) return true;

                const stakedFiat = toFiatCurrency({
                    amount: stakedBalance,
                    rate: currentRate.rate,
                })?.toFixed(2, BigNumber.ROUND_FLOOR);

                return (
                    !stakedFiat ||
                    new BigNumber(value || 0).lte(stakedFiat) ||
                    translationString('TR_EARN_TRON_UNSTAKE_AMOUNT_EXCEEDS_STAKED')
                );
            },
        },
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
                        <Translation id="TR_EARN_TRON_STAKED" />{' '}
                        <FormattedCryptoAmount value={stakedBalance} symbol={account.symbol} />
                    </Text>
                    <Button
                        type="button"
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={() => onCryptoAmountChange(stakedBalance)}
                        isDisabled={isDisabled}
                    >
                        <Translation id="TR_FRACTION_BUTTONS_MAX" />
                    </Button>
                </Row>
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    <BaseCurrencyValue
                        amount={stakedBalance}
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
