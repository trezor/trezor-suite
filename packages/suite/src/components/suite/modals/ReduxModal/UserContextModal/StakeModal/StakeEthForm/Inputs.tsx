import styled from 'styled-components';
import { Icon, Warning } from '@trezor/components';
import { getInputState } from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { formInputsMaxLength } from '@suite-common/validators';
import { NumberInput, Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';
import {
    validateDecimals,
    validateInteger,
    validateLimitsBigNum,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import { FIAT_INPUT, CRYPTO_INPUT } from 'src/types/wallet/stakeForms';
import { MIN_ETH_FOR_WITHDRAWALS } from 'src/constants/suite/ethStaking';
import { spacingsPx } from '@trezor/theme';

const VStack = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const StyledIcon = styled(Icon)`
    transform: rotate(90deg);
    margin-bottom: 26px;
`;

const InputAddon = styled.span`
    text-transform: uppercase;
    color: ${({ theme }) => theme.textSubdued};
`;

const StyledWarning = styled(Warning)`
    margin-top: ${spacingsPx.sm};
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
            integer: validateInteger(translationString, { except: true }),
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
        <VStack>
            <NumberInput
                name={CRYPTO_INPUT}
                control={control}
                rules={cryptoInputRules}
                maxLength={formInputsMaxLength.amount}
                innerAddon={<InputAddon>{account.symbol}</InputAddon>}
                bottomText={errors[CRYPTO_INPUT]?.message ?? null}
                inputState={getInputState(cryptoError || fiatError)}
                onChange={value => {
                    onCryptoAmountChange(value);
                }}
            />

            {currentRate && (
                <>
                    {/* TODO: Add new transfer icon. Export from Figma isn't handled as is it should by the strokes to fills online converter */}
                    <StyledIcon icon="TRANSFER" size={16} />

                    <NumberInput
                        name={FIAT_INPUT}
                        control={control}
                        rules={fiatInputRules}
                        maxLength={formInputsMaxLength.fiat}
                        innerAddon={<InputAddon>{localCurrency}</InputAddon>}
                        bottomText={errors[FIAT_INPUT]?.message ?? null}
                        inputState={getInputState(fiatError || cryptoError)}
                        onChange={value => {
                            onFiatAmountChange(value);
                        }}
                    />
                </>
            )}

            {isAmountForWithdrawalWarningShown && (
                <StyledWarning variant="info">
                    <Translation
                        id="TR_STAKE_LEFT_AMOUNT_FOR_WITHDRAWAL"
                        values={{ amount: MIN_ETH_FOR_WITHDRAWALS.toString() }}
                    />
                </StyledWarning>
            )}
            {isAdviceForWithdrawalWarningShown && (
                <StyledWarning variant="info">
                    <Translation
                        id="TR_STAKE_RECOMMENDED_AMOUNT_FOR_WITHDRAWALS"
                        values={{ amount: MIN_ETH_FOR_WITHDRAWALS.toString() }}
                    />
                </StyledWarning>
            )}
        </VStack>
    );
};
