import BigNumber from 'bignumber.js';
import styled, { useTheme } from 'styled-components';
import { Button, Card, Icon, variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { selectAccountStakeTransactions } from '@suite-common/wallet-core';
import { isPending } from '@suite-common/wallet-utils';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import {
    selectSelectedAccount,
    selectSelectedAccountEverstakeStakingPool,
} from 'src/reducers/wallet/selectedAccountReducer';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { MIN_ETH_AMOUNT_FOR_STAKING } from 'src/constants/suite/ethStaking';
import { InfoBox, ProgressBar } from './styled';
import { ProgressLabels } from './ProgressLabels/ProgressLabels';
import { useProgressLabelsData } from '../hooks/useProgressLabelsData';
import { useIsTxStatusShown } from '../hooks/useIsTxStatusShown';

const StyledCard = styled(Card)`
    padding: ${spacingsPx.md};
`;

const EnteringAmountInfo = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${spacingsPx.xxs};
    flex-wrap: wrap;
    padding: ${spacingsPx.xxxs} ${spacingsPx.xs} ${spacingsPx.sm} ${spacingsPx.xs};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const EnteringAmountsWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const EnteringFiatValueWrapper = styled.span`
    color: ${({ theme }) => theme.textSubdued};
`;

const AmountsWrapper = styled.div<{ $isUnstakePending: boolean }>`
    display: flex;
    gap: ${spacingsPx.sm} ${spacingsPx.xs};
    flex-wrap: wrap;
    justify-content: ${({ $isUnstakePending }) =>
        $isUnstakePending ? 'space-between' : 'flex-start'};

    & > div {
        flex: ${({ $isUnstakePending }) => ($isUnstakePending ? '' : '1 0 300px')};
    }
`;

const AmountHeading = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.textSubdued};
`;

const StyledFormattedCryptoAmount = styled(FormattedCryptoAmount)<{ $isRewards?: boolean }>`
    display: block;
    margin-top: ${spacingsPx.xs};
    font-size: ${variables.FONT_SIZE.H2};
    color: ${({ $isRewards = false, theme }) => ($isRewards ? theme.textPrimaryDefault : '')};
`;

const StyledFiatValue = styled(FiatValue)`
    display: block;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.textSubdued};
`;

const ProgressBarWrapper = styled.div`
    margin-top: ${spacingsPx.xxxl};
`;

const Info = styled.div`
    margin: ${spacingsPx.md} 0 0 ${spacingsPx.xs};
    display: flex;
    gap: ${spacingsPx.xxs};
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.textSubdued};
`;

const NoMarginInfo = styled(Info)`
    margin: 0;
`;

const SmMarginInfo = styled(Info)`
    margin: 0 0 ${spacingsPx.xxxs} ${spacingsPx.xs};
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
    isValidatorsQueueLoading: boolean;
    daysToAddToPool: number;
    daysToUnstake: number;
}

export const StakingCard = ({
    isValidatorsQueueLoading,
    daysToAddToPool,
    daysToUnstake,
}: StakingCardProps) => {
    const theme = useTheme();
    const { symbol, key: selectedAccountKey } = useSelector(selectSelectedAccount) ?? {};
    const mappedSymbol = symbol ? mapTestnetSymbol(symbol) : '';

    const {
        autocompoundBalance = '0',
        depositedBalance = '0',
        restakedReward = '0',
        totalPendingStakeBalance = '0',
        withdrawTotalAmount = '0',
        claimableAmount = '0',
    } = useSelector(selectSelectedAccountEverstakeStakingPool) ?? {};

    const canUnstake = MIN_ETH_AMOUNT_FOR_STAKING.lt(autocompoundBalance);
    const isStakePending = new BigNumber(totalPendingStakeBalance).gt(0);
    const isUnstakePending = new BigNumber(withdrawTotalAmount).gt(0);
    const { isTxStatusShown } = useIsTxStatusShown(new BigNumber(totalPendingStakeBalance));

    const isDaysToAddToPoolShown = !Number.isNaN(daysToAddToPool) && !isValidatorsQueueLoading;
    const isPendingUnstakeShown =
        isUnstakePending && !new BigNumber(withdrawTotalAmount).eq(claimableAmount);
    const isDaysToUnstakeShown = !Number.isNaN(daysToUnstake) && !isValidatorsQueueLoading;

    const stakeTxs = useSelector(state =>
        selectAccountStakeTransactions(state, selectedAccountKey || ''),
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
        dispatch(openModal({ type: 'stake' }));
    };
    const openUnstakeModal = () => {
        dispatch(openModal({ type: 'unstake' }));
    };

    return (
        <StyledCard>
            {(isStakeConfirming || isTxStatusShown) && (
                <InfoBox>
                    <EnteringAmountInfo>
                        <Translation
                            id="TR_STAKE_WAITING_TO_BE_ADDED"
                            values={{ symbol: symbol?.toUpperCase(), br: <br /> }}
                        />

                        <EnteringAmountsWrapper>
                            <NoMarginInfo>
                                <Icon icon="CLOCK" size={12} />
                                <Translation id="TR_STAKE_TOTAL_PENDING" />
                            </NoMarginInfo>

                            <div>
                                <FormattedCryptoAmount
                                    value={totalPendingStakeBalance}
                                    symbol={symbol}
                                />{' '}
                                <EnteringFiatValueWrapper>
                                    <FiatValue
                                        amount={totalPendingStakeBalance}
                                        symbol={mappedSymbol}
                                        showApproximationIndicator
                                    >
                                        {({ value }) => value && <span>({value})</span>}
                                    </FiatValue>
                                </EnteringFiatValueWrapper>
                            </div>
                        </EnteringAmountsWrapper>
                    </EnteringAmountInfo>

                    <SmMarginInfo>
                        <Icon icon="INFO" size={12} />
                        <Translation id="TR_STAKE_LAST_STAKE_REQUEST_STATE" />
                    </SmMarginInfo>
                    <ProgressLabels labels={progressLabelsData} />
                </InfoBox>
            )}

            <AmountsWrapper $isUnstakePending={isPendingUnstakeShown}>
                <div>
                    <AmountHeading>
                        <Icon icon="LOCK_SIMPLE" size={16} />
                        <Translation id="TR_STAKE_STAKE" />
                    </AmountHeading>

                    <StyledFormattedCryptoAmount value={depositedBalance} symbol={symbol} />

                    <StyledFiatValue
                        amount={depositedBalance}
                        symbol={mappedSymbol}
                        showApproximationIndicator
                    >
                        {({ value }) => (value ? <span>{value}</span> : null)}
                    </StyledFiatValue>
                </div>

                <div>
                    <AmountHeading>
                        <Icon icon="PLUS_CIRCLE" size={16} />
                        <Translation id="TR_STAKE_REWARDS" />
                    </AmountHeading>

                    <StyledFormattedCryptoAmount
                        $isRewards
                        value={restakedReward}
                        symbol={symbol}
                    />

                    <StyledFiatValue
                        amount={restakedReward}
                        symbol={mappedSymbol}
                        showApproximationIndicator
                    >
                        {({ value }) => (value ? <span>{value}</span> : null)}
                    </StyledFiatValue>
                </div>

                {isPendingUnstakeShown && (
                    <div>
                        <AmountHeading>
                            <Icon icon="SPINNER" size={18} color={theme.iconSubdued} />
                            <span>
                                <Translation id="TR_STAKE_UNSTAKING" />{' '}
                                {isDaysToUnstakeShown && (
                                    <>
                                        (~
                                        <Translation
                                            id="TR_STAKE_DAYS"
                                            values={{
                                                days: daysToUnstake,
                                            }}
                                        />
                                        )
                                    </>
                                )}
                            </span>
                        </AmountHeading>

                        <StyledFormattedCryptoAmount value={withdrawTotalAmount} symbol={symbol} />

                        <StyledFiatValue
                            amount={withdrawTotalAmount}
                            symbol={mappedSymbol}
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

            <Info>
                <Icon icon="INFO" size={12} />
                <Translation
                    id="TR_STAKE_ETH_REWARDS_EARN_APY"
                    values={{ symbol: symbol?.toUpperCase() }}
                />
            </Info>

            <ButtonsWrapper>
                <StyledButton onClick={openStakeModal}>
                    <Translation id="TR_STAKE_STAKE_MORE" />
                </StyledButton>
                <StyledButton isDisabled={!canUnstake} onClick={openUnstakeModal}>
                    <Translation id="TR_STAKE_UNSTAKE_TO_CLAIM" />
                </StyledButton>
            </ButtonsWrapper>
        </StyledCard>
    );
};
