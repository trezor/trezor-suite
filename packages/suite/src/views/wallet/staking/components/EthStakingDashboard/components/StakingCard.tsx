import styled from 'styled-components';
import { Button, Card, Icon, variables } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { MIN_ETH_AMOUNT_FOR_STAKING } from 'src/constants/suite/ethStaking';
import { InfoBox, ProgressBar } from './styled';
import { ProgressLabels } from './ProgressLabels';
import { ProgressLabelData } from './ProgressLabels/types';
import { useStakeAndRewards } from 'src/hooks/wallet/useStakeAndRewards';

const StyledCard = styled(Card)`
    padding: 16px;
`;

const EnteringAmountInfo = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 4px;
    flex-wrap: wrap;
    padding: 10px 8px;
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
    // TODO: Replace with real data
    const daysToAddToPool = 35;

    const { symbol } = useSelector(selectSelectedAccount) ?? {};
    const mappedSymbol = symbol ? mapTestnetSymbol(symbol) : '';

    const dispatch = useDispatch();
    const openStakeModal = () => {
        dispatch(openModal({ type: 'stake' }));
    };
    const openUnstakeModal = () => {
        dispatch(openModal({ type: 'unstake' }));
    };

    const progressLabelsData: ProgressLabelData[] = [
        {
            id: 0,
            progressState: 'done',
            children: <Translation id="TR_TX_CONFIRMED" />,
        },
        {
            id: 1,
            progressState: 'active',
            children: (
                <div>
                    <Translation id="TR_STAKE_ADDING_TO_POOL" />
                    <DaysToAddToPool>
                        ~
                        <Translation
                            id="TR_STAKE_DAYS_TO"
                            values={{
                                days: daysToAddToPool,
                            }}
                        />
                    </DaysToAddToPool>
                </div>
            ),
        },
        {
            id: 2,
            progressState: 'stale',
            children: <Translation id="TR_STAKE_STAKED_AND_EARNING" />,
        },
    ];

    return (
        <StyledCard>
            <InfoBox>
                <EnteringAmountInfo>
                    <Translation
                        id="TR_STAKE_ETH_AT_THE_DOOR"
                        values={{ symbol: symbol?.toUpperCase() }}
                    />

                    <EnteringAmountsWrapper>
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
                    </EnteringAmountsWrapper>
                </EnteringAmountInfo>

                <ProgressLabels labels={progressLabelsData} />
            </InfoBox>

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
