import { BigNumber } from '@trezor/utils/src/bigNumber';
import styled, { useTheme } from 'styled-components';
import { Badge, Button, Card, IconLegacy, Row, Tooltip, variables } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';
import { selectAccountStakeTransactions } from '@suite-common/wallet-core';
import { getAccountEverstakeStakingPool, isPending } from '@suite-common/wallet-utils';
import { FiatValue, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { InfoBox, ProgressBar } from './styled';
import { ProgressLabels } from './ProgressLabels/ProgressLabels';
import { useProgressLabelsData } from '../hooks/useProgressLabelsData';
import { useIsTxStatusShown } from '../hooks/useIsTxStatusShown';
import { TrimmedCryptoAmount } from './TrimmedCryptoAmount';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

const StyledCard = styled(Card)`
    padding: ${spacingsPx.md};
`;

const AmountsWrapper = styled.div<{ $isStakeOrUnstakePending: boolean }>`
    display: flex;
    gap: ${spacingsPx.sm} ${spacingsPx.xs};
    flex-wrap: wrap;
    justify-content: ${({ $isStakeOrUnstakePending }) =>
        $isStakeOrUnstakePending ? 'space-between' : 'flex-start'};

    & > div {
        margin-right: ${({ $isStakeOrUnstakePending }) =>
            $isStakeOrUnstakePending ? '0' : 'auto'};
    }
`;

const AmountHeading = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.textSubdued};
`;

const StyledFiatValue = styled(FiatValue)`
    display: block;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.textSubdued};
`;

const ProgressBarWrapper = styled.div`
    margin-top: ${spacingsPx.xxxl};
`;

const ButtonsWrapper = styled.div`
    margin-top: 66px;
    display: flex;
    gap: ${spacingsPx.xs};
    flex-wrap: wrap;
`;

const StyledButton = styled(Button).attrs(props => ({
    ...props,
    variant: 'tertiary',
    type: 'button',
}))`
    padding: 9px 22px;
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

interface StakingCardProps {
    isValidatorsQueueLoading?: boolean;
    daysToAddToPool?: number;
    daysToUnstake?: number;
}

export const StakingCard = ({
    isValidatorsQueueLoading,
    daysToAddToPool,
    daysToUnstake,
}: StakingCardProps) => {
    const theme = useTheme();
    const selectedAccount = useSelector(selectSelectedAccount);

    const {
        isStakingDisabled,
        isUnstakingDisabled,
        stakingMessageContent,
        unstakingMessageContent,
    } = useMessageSystemStaking();

    const {
        autocompoundBalance = '0',
        depositedBalance = '0',
        restakedReward = '0',
        totalPendingStakeBalance = '0',
        withdrawTotalAmount = '0',
        claimableAmount = '0',
    } = getAccountEverstakeStakingPool(selectedAccount) ?? {};

    const canUnstake = new BigNumber(autocompoundBalance).gt(0);
    const isStakePending = new BigNumber(totalPendingStakeBalance).gt(0);
    const isUnstakePending = new BigNumber(withdrawTotalAmount).gt(0);

    const { isTxStatusShown } = useIsTxStatusShown(
        new BigNumber(totalPendingStakeBalance),
        selectedAccount?.descriptor,
    );

    const isDaysToAddToPoolShown = daysToAddToPool !== undefined && !isValidatorsQueueLoading;
    const isPendingUnstakeShown =
        isUnstakePending && !new BigNumber(withdrawTotalAmount).eq(claimableAmount);
    const isDaysToUnstakeShown = daysToUnstake !== undefined && !isValidatorsQueueLoading;

    const stakeTxs = useSelector(state =>
        selectAccountStakeTransactions(state, selectedAccount?.key || ''),
    );
    const isStakeConfirming = stakeTxs.some(tx => isPending(tx));

    const { progressLabelsData } = useProgressLabelsData({
        daysToAddToPool,
        isDaysToAddToPoolShown,
        isStakeConfirming,
        isStakePending,
    });

    const dispatch = useDispatch();
    const openStakeModal = () => {
        if (!isStakingDisabled) {
            dispatch(openModal({ type: 'stake' }));
        }
    };
    const openUnstakeModal = () => {
        if (!isUnstakingDisabled) {
            dispatch(openModal({ type: 'unstake' }));
        }
    };

    if (!selectedAccount?.symbol) {
        return null;
    }

    return (
        <StyledCard>
            {(isStakeConfirming || isTxStatusShown) && (
                <InfoBox>
                    <ProgressLabels labels={progressLabelsData} />
                </InfoBox>
            )}

            <AmountsWrapper $isStakeOrUnstakePending={isPendingUnstakeShown || isStakePending}>
                {isStakePending && (
                    <div>
                        <AmountHeading>
                            <IconLegacy icon="SPINNER" size={16} />
                            <Translation id="TR_STAKE_TOTAL_PENDING" />
                        </AmountHeading>

                        <TrimmedCryptoAmount
                            data-testid="@account/staking/pending"
                            value={totalPendingStakeBalance}
                            symbol={selectedAccount?.symbol}
                        />

                        <StyledFiatValue
                            amount={totalPendingStakeBalance}
                            symbol={selectedAccount?.symbol}
                            showApproximationIndicator
                        >
                            {({ value }) => (value ? <span>{value}</span> : null)}
                        </StyledFiatValue>
                    </div>
                )}

                <div>
                    <AmountHeading>
                        <IconLegacy icon="LOCK_SIMPLE" size={16} />
                        <Translation id="TR_STAKE_STAKE" />
                    </AmountHeading>

                    <TrimmedCryptoAmount
                        data-testid="@account/staking/staked"
                        value={depositedBalance}
                        symbol={selectedAccount?.symbol}
                    />

                    <StyledFiatValue
                        amount={depositedBalance}
                        symbol={selectedAccount?.symbol}
                        showApproximationIndicator
                    >
                        {({ value }) => (value ? <span>{value}</span> : null)}
                    </StyledFiatValue>
                </div>

                <div>
                    <AmountHeading>
                        <IconLegacy icon="PLUS_CIRCLE" size={16} />
                        <Translation id="TR_STAKE_REWARDS" />
                        <Tooltip
                            maxWidth={250}
                            content={
                                <Translation
                                    id="TR_STAKE_ETH_REWARDS_EARN_APY"
                                    values={{ symbol: selectedAccount?.symbol?.toUpperCase() }}
                                />
                            }
                        >
                            <Badge variant="primary" size="small">
                                <Row gap={spacings.xxs} alignItems="center">
                                    <Translation id="TR_STAKE_RESTAKED_BADGE" />
                                    <IconLegacy icon="INFO" size={spacings.sm} variant="primary" />
                                </Row>
                            </Badge>
                        </Tooltip>
                    </AmountHeading>

                    <TrimmedCryptoAmount
                        data-testid="@account/staking/rewards"
                        value={restakedReward}
                        symbol={selectedAccount?.symbol}
                        isRewards
                    />

                    <StyledFiatValue
                        amount={restakedReward}
                        symbol={selectedAccount?.symbol}
                        showApproximationIndicator
                    >
                        {({ value }) => (value ? <span>{value}</span> : null)}
                    </StyledFiatValue>
                </div>

                {isPendingUnstakeShown && (
                    <div>
                        <AmountHeading>
                            <IconLegacy icon="SPINNER" size={18} color={theme.iconSubdued} />
                            <span>
                                <Translation id="TR_STAKE_UNSTAKING" />{' '}
                                {isDaysToUnstakeShown && (
                                    <>
                                        (~
                                        <Translation
                                            id="TR_STAKE_DAYS"
                                            values={{
                                                count: daysToUnstake,
                                            }}
                                        />
                                        )
                                    </>
                                )}
                            </span>
                        </AmountHeading>

                        <TrimmedCryptoAmount
                            data-testid="@account/staking/unstaking"
                            value={withdrawTotalAmount}
                            symbol={selectedAccount?.symbol}
                        />

                        <StyledFiatValue
                            amount={withdrawTotalAmount}
                            symbol={selectedAccount?.symbol}
                            showApproximationIndicator
                        >
                            {({ value }) => (value ? <span>{value}</span> : null)}
                        </StyledFiatValue>
                    </div>
                )}
            </AmountsWrapper>

            <ProgressBarWrapper>
                <ProgressBar
                    $rewards={Number(restakedReward)}
                    $unstaking={Number(withdrawTotalAmount)}
                    $total={
                        Number(depositedBalance) +
                        Number(restakedReward) +
                        Number(withdrawTotalAmount)
                    }
                    $isPendingUnstakeShown={isPendingUnstakeShown}
                />
            </ProgressBarWrapper>

            <ButtonsWrapper>
                <Tooltip content={stakingMessageContent}>
                    <StyledButton
                        onClick={openStakeModal}
                        isDisabled={isStakingDisabled}
                        icon={isStakingDisabled ? 'INFO' : undefined}
                    >
                        <Translation id="TR_STAKE_STAKE_MORE" />
                    </StyledButton>
                </Tooltip>
                <Tooltip content={unstakingMessageContent}>
                    <StyledButton
                        isDisabled={!canUnstake || isUnstakingDisabled}
                        onClick={openUnstakeModal}
                        icon={isUnstakingDisabled ? 'INFO' : undefined}
                    >
                        <Translation id="TR_STAKE_UNSTAKE_TO_CLAIM" />
                    </StyledButton>
                </Tooltip>
            </ButtonsWrapper>
        </StyledCard>
    );
};
