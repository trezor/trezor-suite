import styled from 'styled-components';
import { Icon, Banner, Column, Text } from '@trezor/components';
import { getInputState } from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { formInputsMaxLength } from '@suite-common/validators';
import { NumberInput, Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';
import {
    validateDecimals,
    validateLimitsBigNum,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import { FIAT_INPUT, CRYPTO_INPUT } from 'src/types/wallet/stakeForms';
import { MIN_ETH_FOR_WITHDRAWALS } from 'src/constants/suite/ethStaking';
import { spacings, spacingsPx } from '@trezor/theme';

const IconWrapper = styled.div`
    transform: rotate(90deg);
    margin-bottom: ${spacingsPx.xl};
`;

export const Inputs = () => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();

    const {
        control,
        account,
        network,
        formState: { errors },
        amountLimits,
        onCryptoAmountChange,
        onFiatAmountChange,
        localCurrency,
        isAmountForWithdrawalWarningShown,
        isAdviceForWithdrawalWarningShown,
        currentRate,
    } = useStakeEthFormContext();

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
            reserveOrBalance: validateReserveOrBalance(translationString, {
                account,
            }),
            limits: validateLimitsBigNum(translationString, {
                amountLimits,
                formatter: CryptoAmountFormatter,
            }),
        },
    };

    return (
        <Column>
            <NumberInput
                name={CRYPTO_INPUT}
                control={control}
                rules={cryptoInputRules}
                maxLength={formInputsMaxLength.amount}
                innerAddon={<Text variant="tertiary">{account.symbol.toUpperCase()}</Text>}
                bottomText={errors[CRYPTO_INPUT]?.message ?? null}
                inputState={getInputState(cryptoError || fiatError)}
                onChange={value => {
                    onCryptoAmountChange(value);
                }}
            />

            {currentRate?.rate && (
                <>
                    <IconWrapper>
                        <Icon name="transfer" size={16} />
                    </IconWrapper>

                    <NumberInput
                        name={FIAT_INPUT}
                        control={control}
                        rules={fiatInputRules}
                        maxLength={formInputsMaxLength.fiat}
                        innerAddon={<Text variant="tertiary">{localCurrency.toUpperCase()}</Text>}
                        bottomText={errors[FIAT_INPUT]?.message ?? null}
                        inputState={getInputState(fiatError || cryptoError)}
                        onChange={value => {
                            onFiatAmountChange(value);
                        }}
                    />
                </>
            )}

            {isAmountForWithdrawalWarningShown && (
                <Banner variant="info" margin={{ top: spacings.md }}>
                    <Translation
                        id="TR_STAKE_LEFT_AMOUNT_FOR_WITHDRAWAL"
                        values={{
                            amount: MIN_ETH_FOR_WITHDRAWALS.toString(),
                            symbol: account.symbol.toUpperCase(),
                        }}
                    />
                </Banner>
            )}
            {isAdviceForWithdrawalWarningShown && (
                <Banner variant="info" margin={{ top: spacings.md }}>
                    <Translation
                        id="TR_STAKE_RECOMMENDED_AMOUNT_FOR_WITHDRAWALS"
                        values={{
                            amount: MIN_ETH_FOR_WITHDRAWALS.toString(),
                            symbol: account.symbol.toUpperCase(),
                        }}
                    />
                </Banner>
            )}
        </Column>
    );
};
