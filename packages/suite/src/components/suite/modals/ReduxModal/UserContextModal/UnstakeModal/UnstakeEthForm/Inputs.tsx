import { Text, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { formInputsMaxLength } from '@suite-common/validators';
import { useFormatters } from '@suite-common/formatters';
import {
    getInputState,
    getNonComposeErrorMessage,
    getStakingDataForNetwork,
} from '@suite-common/wallet-utils';
import { InputWithOptions } from '@trezor/product-components';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { UnstakeFormState } from '@suite-common/wallet-core';

import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from 'src/types/wallet/stakeForms';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { validateDecimals, validateCryptoLimits, validateMin } from 'src/utils/suite/validation';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

export const Inputs = () => {
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
        localCurrency,
        currentRate,
        setRatioAmount,
    } = useUnstakeEthFormContext();

    const {
        autocompoundBalance = '0',
        depositedBalance = '0',
        restakedReward = '0',
    } = getStakingDataForNetwork(account) ?? {};

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
        <Column gap={spacings.sm} alignItems="center">
            <InputWithOptions<UnstakeFormState>
                cryptoInputProps={{
                    name: OUTPUT_AMOUNT,
                    locale,
                    labelLeft,
                    control,
                    rules: cryptoInputRules,
                    maxLength: formInputsMaxLength.amount,
                    innerAddon: <Text variant="tertiary">{networkDisplaySymbol}</Text>,
                    bottomText: getNonComposeErrorMessage(errors[CRYPTO_INPUT]),
                    inputState: getInputState(cryptoError || fiatError),
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
                              innerAddon: (
                                  <Text variant="tertiary">{localCurrency.toUpperCase()}</Text>
                              ),
                              bottomText: getNonComposeErrorMessage(errors[FIAT_INPUT]),
                              inputState: getInputState(fiatError || cryptoError),
                              onChange: onFiatAmountChange,
                          }
                        : undefined
                }
                switchTranslation={{
                    fiat: (
                        <Translation
                            id="TR_COINMARKET_ENTER_AMOUNT_IN"
                            values={{ currency: localCurrency.toUpperCase() }}
                        />
                    ),
                    crypto: (
                        <Translation
                            id="TR_COINMARKET_ENTER_AMOUNT_IN"
                            values={{ currency: networkDisplaySymbol }}
                        />
                    ),
                }}
                fiatValue={
                    <FiatValue amount={amount} symbol={symbol} showApproximationIndicator>
                        {({ value }) =>
                            value ? (
                                <Text typographyStyle="label" variant="tertiary">
                                    {value}
                                </Text>
                            ) : null
                        }
                    </FiatValue>
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
                                <Text typographyStyle="hint">
                                    <FiatValue amount={depositedBalance} symbol={symbol}>
                                        {({ value }) => value && <span>{value} + </span>}
                                    </FiatValue>
                                    <Text variant="primary">
                                        <FiatValue amount={restakedReward} symbol={symbol} />
                                    </Text>
                                </Text>
                            </Column>
                        ),
                        onClick: () => onCryptoAmountChange(autocompoundBalance),
                    },
                    {
                        id: 'TR_FRACTION_BUTTONS_REWARDS',
                        children: <Translation id="TR_FRACTION_BUTTONS_REWARDS" />,
                        tooltip: isRewardsDisabled ? (
                            <Translation id="TR_STAKE_NO_REWARDS" />
                        ) : (
                            <Column alignItems="flex-end">
                                <FormattedCryptoAmount value={restakedReward} symbol={symbol} />
                                <Text variant="primary">
                                    <FiatValue amount={restakedReward} symbol={symbol} />
                                </Text>
                            </Column>
                        ),
                        isSubtle: true,
                        variant: 'primary',
                        isDisabled: isRewardsDisabled,
                        onClick: () => onCryptoAmountChange(restakedReward),
                    },
                ]}
            />
        </Column>
    );
};
