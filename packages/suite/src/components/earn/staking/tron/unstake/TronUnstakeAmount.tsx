import { useFormState, useWatch } from 'react-hook-form';

import { AssetSymbol } from '@suite/assets';
import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { getNetwork } from '@suite-common/wallet-config';
import { AMOUNT_MAX_LENGTH } from '@suite-common/wallet-core';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { Banner, Button, Column, Row, Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { EarnAmountInputHeading } from '#src/components/earn/common/EarnAmountInputHeading';
import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useSelector } from '#src/hooks/suite/useSelector';
import { validateDecimals, validateMin } from '#src/utils/suite/validation';

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

    return (
        <Column gap={8}>
            <EarnAmountInputHeading
                label={<Translation id="AMOUNT" />}
                gap={8}
                currencySwitch={
                    <TronCurrencySwitchButton
                        rate={currentRate}
                        currency={currency}
                        setCurrency={setCurrency}
                        fiatCurrencySymbol={baseCurrencyCode.toUpperCase()}
                        networkSymbol={account.symbol}
                    />
                }
            />
            <NumberInput
                name={currency === 'crypto' ? 'amount' : 'fiatAmount'}
                locale={locale}
                control={control}
                rules={currency === 'crypto' ? cryptoInputRules : fiatInputRules}
                maxLength={AMOUNT_MAX_LENGTH}
                isDisabled={isDisabled}
                hasError={hasError}
                onChange={currency === 'crypto' ? onCryptoAmountChange : onFiatAmountChange}
                rightContent={
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        {currency === 'crypto' ? (
                            <AssetSymbol networkSymbol={account.symbol} />
                        ) : (
                            baseCurrencyCode.toUpperCase()
                        )}
                    </Text>
                }
                data-testid="@staking/tron-unstake/amount-input"
            />

            <Row justifyContent="space-between" alignItems="center" gap={8}>
                <Row alignItems="center" gap={8}>
                    <Text
                        typographyStyle="body-md"
                        intent="neutral"
                        priority="secondary"
                        data-testid="@staking/tron-unstake/staked-balance"
                    >
                        <Translation id="TR_EARN_TRON_STAKED" />{' '}
                        <FormattedCryptoAmount
                            value={stakedBalance}
                            networkSymbol={account.symbol}
                            data-testid="@staking/tron-unstake/staked-balance/amount"
                        />
                    </Text>
                    <Button
                        type="button"
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={() => onCryptoAmountChange(stakedBalance)}
                        isDisabled={isDisabled}
                        data-testid="@staking/tron-unstake/max-button"
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
                <Banner
                    intent="warning"
                    description={<Text>{errorMessage}</Text>}
                    data-testid="@staking/tron-unstake/amount-error"
                />
            )}
        </Column>
    );
};
