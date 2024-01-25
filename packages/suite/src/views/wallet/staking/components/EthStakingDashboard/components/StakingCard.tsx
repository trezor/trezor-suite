import { useEffect, useMemo, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Button, Card, Icon, variables } from '@trezor/components';
import { selectAccountStakeTransactions } from '@suite-common/wallet-core';
import { isPending } from '@suite-common/wallet-utils';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { MIN_ETH_AMOUNT_FOR_STAKING } from 'src/constants/suite/ethStaking';
import { useStakeAndRewards } from 'src/hooks/wallet/useStakeAndRewards';
import { InfoBox, ProgressBar } from './styled';
import { ProgressLabels } from './ProgressLabels';
import { ProgressLabelData } from './ProgressLabels/types';
import { useValidatorsQueue } from '../useValidatorsQueue';

const StyledCard = styled(Card)`
    padding: 16px;
`;

const EnteringAmountInfo = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
    padding: 2px 8px 10px 8px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const EnteringAmountsWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const EnteringFiatValueWrapper = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const DaysToAddToPool = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const AmountsWrapper = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    & > div {
        flex: 1 0 300px;
    }

    & > div:nth-child(2) {
        flex: 1 0 25%;
    }
`;

const AmountHeading = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledFormattedCryptoAmount = styled(FormattedCryptoAmount)<{ $isRewards?: boolean }>`
    display: block;
    margin-top: 8px;
    font-size: ${variables.FONT_SIZE.H2};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ $isRewards = false, theme }) => ($isRewards ? theme.TYPE_GREEN : '')};
`;

const StyledFiatValue = styled(FiatValue)`
    display: block;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const ProgressBarWrapper = styled.div`
    margin-top: 36px;
`;

const Info = styled.div`
    margin: 16px 0 0 6px;
    display: flex;
    gap: 4px;
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const NoMarginInfo = styled(Info)`
    margin: 0;
`;

const SmMarginInfo = styled(Info)`
    margin: 0 0 2px 6px;
`;

const ButtonsWrapper = styled.div`
    margin-top: 66px;
    display: flex;
    gap: 8px;
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

export const StakingCard = () => {
    const { stakeWithRewards, originalStake, rewards, totalPendingStake } = useStakeAndRewards();
    const canUnstake = MIN_ETH_AMOUNT_FOR_STAKING.lt(stakeWithRewards);

    const { symbol } = useSelector(selectSelectedAccount) ?? {};
    const mappedSymbol = symbol ? mapTestnetSymbol(symbol) : '';

    const dispatch = useDispatch();
    const openStakeModal = () => {
        dispatch(openModal({ type: 'stake' }));
    };
    const openUnstakeModal = () => {
        dispatch(openModal({ type: 'unstake' }));
    };

    const selectedAccount = useSelector(selectSelectedAccount);
    const stakeTxs = useSelector(state =>
        selectAccountStakeTransactions(state, selectedAccount?.key || ''),
    );
    const { validatorsQueue, isValidatorsQueueLoading } = useValidatorsQueue();

    const daysToAddToPool = useMemo(() => {
        const lastTx = stakeTxs[0];

        if (!lastTx?.blockTime) return 1;

        const sevenDays = 7 * 24 * 60 * 60;
        const now = Math.floor(Date.now() / 1000);
        const secondsToWait =
            lastTx.blockTime +
            validatorsQueue.validatorAddingDelay +
            validatorsQueue.validatorActivationTime +
            sevenDays -
            now;
        const daysToWait = Math.round(secondsToWait / 60 / 60 / 24);

        return daysToWait <= 0 ? 1 : daysToWait;
    }, [stakeTxs, validatorsQueue.validatorActivationTime, validatorsQueue.validatorAddingDelay]);

    const isDaysToAddToPoolShown = !Number.isNaN(daysToAddToPool) && !isValidatorsQueueLoading;

    const isStakeConfirming = stakeTxs.some(tx => isPending(tx));
    const isStakePending = totalPendingStake.gt(0);
    // Handling the edge case, when a user can witness sudden change of pending stake deposit to 0.
    // In this case they should see the "Adding to staking pool" progress label as complete and
    // the "Staked & earning rewards" label as active for a few seconds.
    const [isTxStatusShown, setIsTxStatusShown] = useState(false);
    const prevTotalDeposited = useRef(totalPendingStake);
    useEffect(() => {
        if (totalPendingStake.gt(0)) {
            prevTotalDeposited.current = totalPendingStake;
            setIsTxStatusShown(true);
            return;
        }

        const hideTxStatuses = () => {
            prevTotalDeposited.current = new BigNumber(0);
            setIsTxStatusShown(false);
        };

        if (prevTotalDeposited.current.gt(0)) {
            const timeoutId = setTimeout(() => {
                hideTxStatuses();
            }, 7000);

            return () => clearTimeout(timeoutId);
        }

        hideTxStatuses();
    }, [totalPendingStake]);

    const progressLabelsData: ProgressLabelData[] = useMemo(
        () => [
            {
                id: 0,
                progressState: (() => {
                    if (isStakeConfirming) return 'active';
                    return 'done';
                })(),
                children: <Translation id="TR_TX_CONFIRMED" />,
            },
            {
                id: 1,
                progressState: (() => {
                    if (!isStakeConfirming && isStakePending) return 'active';
                    if (!isStakeConfirming && !isStakePending) return 'done';

                    return 'stale';
                })(),
                children: (
                    <div>
                        <Translation id="TR_STAKE_ADDING_TO_POOL" />
                        {isDaysToAddToPoolShown && (
                            <DaysToAddToPool>
                                ~
                                <Translation
                                    id="TR_STAKE_DAYS_TO"
                                    values={{
                                        days: daysToAddToPool,
                                    }}
                                />
                            </DaysToAddToPool>
                        )}
                    </div>
                ),
            },
            {
                id: 2,
                progressState: (() => {
                    if (!isStakeConfirming && !isStakePending) {
                        return 'active';
                    }

                    return 'stale';
                })(),
                children: <Translation id="TR_STAKE_STAKED_AND_EARNING" />,
            },
        ],
        [daysToAddToPool, isDaysToAddToPoolShown, isStakeConfirming, isStakePending],
    );

    return (
        <StyledCard>
            {(isStakeConfirming || isTxStatusShown) && (
                <InfoBox>
                    <EnteringAmountInfo>
                        <Translation
                            id="TR_STAKE_ETH_AT_THE_DOOR"
                            values={{ symbol: symbol?.toUpperCase() }}
                        />

                        <EnteringAmountsWrapper>
                            <NoMarginInfo>
                                <Icon icon="CLOCK" size={12} />
                                <Translation id="TR_STAKE_TOTAL_PENDING" />
                            </NoMarginInfo>

                            <div>
                                <FormattedCryptoAmount
                                    value={totalPendingStake.toString()}
                                    symbol={symbol}
                                />{' '}
                                <EnteringFiatValueWrapper>
                                    (
                                    <FiatValue
                                        amount={totalPendingStake.toString()}
                                        symbol={mappedSymbol}
                                        showApproximationIndicator
                                    />
                                    )
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

            <AmountsWrapper>
                <div>
                    <AmountHeading>
                        <Icon icon="LOCK_SIMPLE" size={16} />
                        <Translation id="TR_STAKE_STAKE" />
                    </AmountHeading>

                    <StyledFormattedCryptoAmount value={originalStake.toString()} symbol={symbol} />

                    <StyledFiatValue
                        amount={originalStake.toString()}
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
                        value={rewards.toString()}
                        symbol={symbol}
                    />

                    <StyledFiatValue
                        amount={rewards.toString()}
                        symbol={mappedSymbol}
                        showApproximationIndicator
                    >
                        {({ value }) => (value ? <span>{value}</span> : null)}
                    </StyledFiatValue>
                </div>
            </AmountsWrapper>

            <ProgressBarWrapper>
                <ProgressBar $staked={originalStake.toNumber()} $rewards={rewards.toNumber()} />
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
