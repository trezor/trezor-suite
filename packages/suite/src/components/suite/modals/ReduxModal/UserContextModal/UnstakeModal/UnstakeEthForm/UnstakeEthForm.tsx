import styled from 'styled-components';
import { Button, Divider, Paragraph, Tooltip, Warning } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { useDevice, useSelector } from 'src/hooks/suite';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { Options } from './Options';
import { getUnstakingPeriodInDays } from 'src/utils/suite/stake';
import UnstakeFees from './Fees';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import { getAccountEverstakeStakingPool } from '@suite-common/wallet-utils';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

// eslint-disable-next-line local-rules/no-override-ds-component
const GreyP = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
`;

const DividerWrapper = styled.div`
    & > div {
        background: ${({ theme }) => theme.borderElevation2};
        width: calc(100% + ${spacingsPx.xxl});
        margin: 0 -${spacingsPx.md} ${spacingsPx.lg} -${spacingsPx.md};
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledWarning = styled(Warning)`
    justify-content: flex-start;
`;

const WarningsWrapper = styled.div`
    margin-bottom: ${spacingsPx.sm};
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
    border-top: 1px solid ${({ theme }) => theme.borderElevation2};
`;

export const UnstakeEthForm = () => {
    const { device, isLocked } = useDevice();
    const selectedAccount = useSelector(selectSelectedAccount);
    const { isUnstakingDisabled, unstakingMessageContent } = useMessageSystemStaking();

    const {
        account,
        isComposing,
        formState: { isSubmitting, errors },
        handleSubmit,
        watch,
        signTx,
    } = useUnstakeEthFormContext();

    const { symbol } = account;

    const { validatorWithdrawTime } = useSelector(state =>
        selectValidatorsQueueData(state, account?.symbol),
    );
    const unstakingPeriod = getUnstakingPeriodInDays(validatorWithdrawTime);
    const hasValues = Boolean(watch(FIAT_INPUT) || watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;

    const { canClaim = false, claimableAmount = '0' } =
        getAccountEverstakeStakingPool(selectedAccount) ?? {};
    const isDisabled =
        !(formIsValid && hasValues) || isSubmitting || isLocked() || !device?.available;

    const inputError = errors[CRYPTO_INPUT] || errors[FIAT_INPUT];
    const showError = inputError && inputError.type === 'compose';

    return (
        <form onSubmit={handleSubmit(signTx)}>
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

            <Options symbol={symbol} />

            <WarningsWrapper>
                {showError && (
                    <StyledWarning variant="destructive">{inputError?.message}</StyledWarning>
                )}
            </WarningsWrapper>

            <DividerWrapper>
                <Divider />
            </DividerWrapper>

            <UnstakeFees />

            <UpToDaysWrapper>
                <GreyP>
                    <Translation id="TR_STAKE_UNSTAKING_PERIOD" />
                </GreyP>
                <Translation
                    id="TR_UP_TO_DAYS"
                    values={{
                        count: unstakingPeriod,
                    }}
                />
            </UpToDaysWrapper>
            <Tooltip content={unstakingMessageContent}>
                <Button
                    type="submit"
                    isFullWidth
                    isDisabled={isDisabled || isUnstakingDisabled}
                    isLoading={isComposing || isSubmitting}
                    onClick={handleSubmit(signTx)}
                    icon={isUnstakingDisabled ? 'info' : undefined}
                >
                    <Translation id="TR_STAKE_UNSTAKE" />
                </Button>
            </Tooltip>
        </form>
    );
};
