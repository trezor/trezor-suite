import styled from 'styled-components';
import { Button, Divider, Paragraph, Warning } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { FeesInfo } from 'src/components/wallet/FeesInfo';
import { useSelector, useValidatorsQueue } from 'src/hooks/suite';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { selectSelectedAccountEverstakeStakingPool } from 'src/reducers/wallet/selectedAccountReducer';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { Options } from './Options';

const GreyP = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
`;

const DividerWrapper = styled.div`
    & > div {
        background: ${({ theme }) => theme.borderOnElevation1};
        width: calc(100% + 64px);
        margin-left: -${spacingsPx.xxl};
        margin-bottom: ${spacingsPx.lg};
    }
`;

const StyledWarning = styled(Warning)`
    justify-content: flex-start;
`;

const WarningsWrapper = styled.div`
    margin-top: ${spacingsPx.sm};
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

const UpToDaysWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding: ${spacingsPx.lg} 0 ${spacingsPx.md};
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation1};
`;

export const UnstakeEthForm = () => {
    const {
        validatorsQueue: { validatorWithdrawTime },
    } = useValidatorsQueue();
    const unstakingPeriod = Math.round(validatorWithdrawTime / 60 / 60 / 24);

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

    const { canClaim = false, claimableAmount = '0' } =
        useSelector(selectSelectedAccountEverstakeStakingPool) ?? {};

    return (
        <form onSubmit={handleSubmit(signTx)}>
            <Options symbol={symbol} />

            <DividerWrapper>
                <Divider />
            </DividerWrapper>

            <FeesInfo
                transactionInfo={transactionInfo}
                symbol={symbol}
                helperText={<Translation id="TR_STAKE_PAID_FROM_BALANCE" />}
            />

            <WarningsWrapper>
                {errors[CRYPTO_INPUT] && (
                    <StyledWarning variant="critical">
                        {errors[CRYPTO_INPUT]?.message}
                    </StyledWarning>
                )}

                {canClaim && (
                    <StyledWarning variant="info">
                        <Translation
                            id="TR_STAKE_CAN_CLAIM_WARNING"
                            values={{
                                amount: claimableAmount,
                                symbol: symbol.toUpperCase(),
                                br: <br />,
                            }}
                        />
                    </StyledWarning>
                )}
            </WarningsWrapper>

            <UpToDaysWrapper>
                {!Number.isNaN(unstakingPeriod) && (
                    <>
                        <GreyP>
                            <Translation id="TR_STAKE_UNSTAKING_PERIOD" />
                        </GreyP>
                        <Translation
                            id="TR_UP_TO_DAYS"
                            values={{
                                days: unstakingPeriod,
                            }}
                        />
                    </>
                )}
            </UpToDaysWrapper>

            <Button
                type="submit"
                isFullWidth
                isDisabled={!(formIsValid && hasValues) || isSubmitting}
                isLoading={isComposing || isSubmitting}
                onClick={handleSubmit(signTx)}
            >
                <Translation id="TR_STAKE_UNSTAKE" />
            </Button>
        </form>
    );
};
