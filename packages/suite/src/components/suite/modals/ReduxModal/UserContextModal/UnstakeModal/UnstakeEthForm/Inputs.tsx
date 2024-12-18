import { Icon, Text, Row, FractionButton, Column, FractionButtonProps } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { formInputsMaxLength } from '@suite-common/validators';
import { useFormatters } from '@suite-common/formatters';
import {
    getInputState,
    getNonComposeErrorMessage,
    getStakingDataForNetwork,
} from '@suite-common/wallet-utils';

import { FiatValue, FormattedCryptoAmount, NumberInput, Translation } from 'src/components/suite';
import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from 'src/types/wallet/stakeForms';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { validateDecimals, validateCryptoLimits, validateMin } from 'src/utils/suite/validation';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';

export const Inputs = () => {
    const selectedAccount = useSelector(selectSelectedAccount);

    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const { symbol } = useSelector(selectSelectedAccount) ?? {};

    const {
        control,
        network,
        formState: { errors },
        amountLimits,
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
    } = getStakingDataForNetwork(selectedAccount) ?? {};

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

    const fractionButtons: FractionButtonProps[] = [
        {
            label: '10%',
            onClick: () => setRatioAmount(10),
        },
        {
            label: '25%',
            onClick: () => setRatioAmount(4),
        },
        {
            label: '50%',
            onClick: () => setRatioAmount(2),
        },
        {
            label: 'Max',
            translation: <Translation id="TR_STAKE_MAX" />,
            tooltip: (
                <Column alignItems="flex-end">
                    <FormattedCryptoAmount value={autocompoundBalance} symbol={symbol} />
                    {symbol && (
                        <Text typographyStyle="hint">
                            <FiatValue amount={depositedBalance} symbol={symbol}>
                                {({ value }) => value && <span>{value} + </span>}
                            </FiatValue>
                            <Text variant="primary">
                                <FiatValue amount={restakedReward} symbol={symbol} />
                            </Text>
                        </Text>
                    )}
                </Column>
            ),
            onClick: () => onCryptoAmountChange(autocompoundBalance),
        },
        {
            label: 'Reward',
            translation: <Translation id="TR_STAKE_ONLY_REWARDS" />,
            tooltip: (
                <Column alignItems="flex-end">
                    <FormattedCryptoAmount value={restakedReward} symbol={symbol} />
                    {symbol && (
                        <Text variant="primary">
                            <FiatValue amount={restakedReward} symbol={symbol} />
                        </Text>
                    )}
                </Column>
            ),
            variant: 'primary',
            onClick: () => {
                console.log('restakedReward', restakedReward);
                onCryptoAmountChange(restakedReward);
            },
        },
    ];

    return (
        <Column gap={spacings.sm} alignItems="center">
            <NumberInput
                name={OUTPUT_AMOUNT}
                labelLeft={
                    <Row gap={spacings.xs}>
                        {fractionButtons.map(button => (
                            <FractionButton key={button.label} {...button} />
                        ))}
                    </Row>
                }
                control={control}
                rules={cryptoInputRules}
                maxLength={formInputsMaxLength.amount}
                innerAddon={<Text variant="tertiary">{symbol?.toUpperCase()}</Text>}
                bottomText={getNonComposeErrorMessage(errors[CRYPTO_INPUT])}
                inputState={getInputState(cryptoError || fiatError)}
                onChange={value => {
                    onCryptoAmountChange(value);
                }}
            />
            {currentRate?.rate && (
                <>
                    <Icon name="arrowsDownUp" size={20} variant="tertiary" />
                    <NumberInput
                        name={FIAT_INPUT}
                        control={control}
                        rules={fiatInputRules}
                        maxLength={formInputsMaxLength.fiat}
                        innerAddon={<Text variant="tertiary">{localCurrency?.toUpperCase()}</Text>}
                        bottomText={getNonComposeErrorMessage(errors[FIAT_INPUT])}
                        inputState={getInputState(fiatError || cryptoError)}
                        onChange={value => {
                            onFiatAmountChange(value);
                        }}
                    />
                </>
            )}
        </Column>
    );
};
