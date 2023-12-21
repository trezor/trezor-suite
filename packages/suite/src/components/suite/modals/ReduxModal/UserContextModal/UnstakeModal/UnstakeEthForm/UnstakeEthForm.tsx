import styled from 'styled-components';
import { Button, P, variables, Warning } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { FeesInfo } from 'src/components/wallet/FeesInfo';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { Options } from './Options';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';

const GreyP = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const MaxWidthDivider = styled.div`
    height: 1px;
    background: ${({ theme }) => theme.STROKE_GREY};
    width: calc(100% + 64px);
    margin-left: -32px;
    margin-bottom: 20px;
`;

const StyledWarning = styled(Warning)`
    margin-top: 12px;
    color: ${({ theme }) => theme.TYPE_RED};
    justify-content: flex-start;
`;

const UpToDaysWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding: 20px 0 16px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const UnstakeEthForm = () => {
    // TODO: Replace with real data
    const unstakingPeriod = 7;

    const {
        account,
        isComposing,
        formState: { isSubmitting, errors },
        handleSubmit,
        watch,
        signTx,
        composedLevels,
        selectedFee,
    } = useUnstakeEthFormContext();

    const { symbol } = account;
    const hasValues = Boolean(watch(FIAT_INPUT) || watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;
    const transactionInfo = composedLevels?.[selectedFee];

    return (
        <form onSubmit={handleSubmit(signTx)}>
            <Options symbol={symbol} />

            <MaxWidthDivider />

            <FeesInfo
                transactionInfo={transactionInfo}
                symbol={symbol}
                helperText={<Translation id="TR_STAKE_PAID_FROM_BALANCE" />}
            />

            {errors[CRYPTO_INPUT]?.type === 'compose' && (
                <StyledWarning variant="critical">
                    <Translation id="TR_NOT_ENOUGH_FUNDS_FOR_TX" />
                </StyledWarning>
            )}
            {errors[CRYPTO_INPUT]?.type === 'limits' && (
                <StyledWarning variant="critical">{errors[CRYPTO_INPUT]?.message}</StyledWarning>
            )}

            <UpToDaysWrapper>
                <GreyP weight="medium">
                    <Translation id="TR_STAKE_UNSTAKING_PERIOD" />
                </GreyP>
                <Translation
                    id="TR_UP_TO_DAYS"
                    values={{
                        days: unstakingPeriod,
                    }}
                />
            </UpToDaysWrapper>

            <Button
                type="submit"
                fullWidth
                isDisabled={!(formIsValid && hasValues) || isSubmitting}
                isLoading={isComposing || isSubmitting}
                onClick={handleSubmit(signTx)}
            >
                <Translation id="TR_STAKE_UNSTAKE" />
            </Button>
        </form>
    );
};
