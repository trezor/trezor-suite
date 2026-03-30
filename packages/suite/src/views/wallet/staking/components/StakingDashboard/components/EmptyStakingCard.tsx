import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useFormatters } from '@suite-common/formatters';
import { Context } from '@suite-common/message-system';
import { getNetworkAdjustedStakingBalance } from '@suite-common/staking';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery, selectPoolStatsApy } from '@suite-common/wallet-core';
import {
    calculateRewards,
    getStakingDataForNetwork,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import {
    Button,
    Card,
    Column,
    Grid,
    H3,
    H4,
    IconCircle,
    Paragraph,
    Row,
    Tooltip,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { DashboardSection } from 'src/components/dashboard';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { formatApyValue } from 'src/views/wallet/staking/utils/formatStakeValues';

import { DiscoveryWarning } from './DiscoveryWarning';

export const EmptyStakingCard = () => {
    const { isBelowLaptop } = useLayoutSize();
    const dispatch = useDispatch();
    const { CryptoAmountFormatter } = useFormatters();
    const account = useSelector(selectSelectedAccount);

    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(account?.symbol);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isStartStakingDisabled = isStakingDisabled || !account;

    const isCardano = account?.networkType === 'cardano';

    const apy = useSelector(state => selectPoolStatsApy(state, { account }));
    const stakingData = getStakingDataForNetwork(account);

    const accountBalance = account?.formattedBalance ?? '0';
    const stakingBalance = stakingData?.depositedBalance ?? '0';

    const stakingLimits = getStakingLimitsByNetworkSymbol(account?.symbol);
    const hasEnoughBalanceForStaking =
        stakingLimits && new BigNumber(accountBalance).gte(stakingLimits.MIN_AMOUNT_FOR_STAKING);

    const potentialRewards = useMemo(() => {
        const totalBalance = new BigNumber(stakingBalance || '0').plus(accountBalance).toString();
        const amount = calculateRewards(
            getNetworkAdjustedStakingBalance(totalBalance, account),
            apy,
        );

        return CryptoAmountFormatter.format(amount.toString(), {
            symbol: account?.symbol,
            isBalance: true,
            withSymbol: false,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [accountBalance, stakingBalance, apy, account, CryptoAmountFormatter]);
    const hasPotentialRewards = new BigNumber(potentialRewards).gt(0);

    const displaySymbol = account?.symbol ? getNetworkDisplaySymbol(account.symbol) : '';

    const stakingFeatures = useMemo(
        () => [
            {
                id: 0,
                icon: 'piggyBank' as const,
                title: <Translation id="TR_STAKING_CARD_KEEP_EARNING_TITLE" />,
                text: (
                    <Translation
                        id={
                            isCardano
                                ? 'TR_STAKING_CARD_KEEP_EARNING_CARDANO_TEXT'
                                : 'TR_STAKING_CARD_KEEP_EARNING_TEXT'
                        }
                        values={{
                            t: text => (
                                <Tooltip
                                    display="inline-flex"
                                    as="span"
                                    content={<Translation id="TR_STAKE_APY_DESC" />}
                                >
                                    <abbr>{text}</abbr>
                                </Tooltip>
                            ),
                            networkDisplaySymbol: displaySymbol,
                        }}
                    />
                ),
            },
            {
                id: 1,
                icon: isCardano ? ('wallet' as const) : ('lockLaminatedOpen' as const),
                title: (
                    <Translation
                        id={isCardano ? 'TR_STAKE_USE_ANYTIME' : 'TR_STAKING_CARD_LOCK_IN_TITLE'}
                    />
                ),
                text: (
                    <Translation
                        id={
                            isCardano
                                ? 'TR_STAKE_SEND_SWAP_SPEND_ANYTIME'
                                : 'TR_STAKING_CARD_LOCK_IN_TEXT'
                        }
                        values={{ symbol: displaySymbol }}
                    />
                ),
            },
            {
                id: 2,
                icon: isCardano ? ('handCoins' as const) : ('everstakeLogo' as const),
                title: <Translation id="TR_STAKING_CARD_RESTAKE_TITLE" />,
                text: <Translation id="TR_STAKING_CARD_RESTAKE_TEXT" />,
            },
        ],
        [isCardano, displaySymbol],
    );

    const openEarnInANutshellModal = () => {
        if (!isStartStakingDisabled) {
            dispatch(
                openModal({
                    type: 'earn-in-a-nutshell',
                    flow: EarnFlow.Stake,
                    provider: EarnProvider.Everstake,
                    account,
                    analyticsStep: 'staking-dashboard',
                }),
            );
        }
    };

    return (
        <DashboardSection data-testid="@wallet/staking/empty-card">
            <Column gap={16}>
                {isDiscoveryRunning && <DiscoveryWarning />}

                <Card>
                    <Column gap={spacings.xxxl}>
                        <Column gap={spacings.xs}>
                            <H3>
                                <Translation
                                    id="TR_STAKING_CARD_TITLE"
                                    values={{ apy: formatApyValue(apy), displaySymbol }}
                                />
                            </H3>
                            <Paragraph intent="neutral" priority="secondary" maxWidth={700}>
                                {!hasEnoughBalanceForStaking || !hasPotentialRewards ? (
                                    <Translation
                                        id={
                                            isCardano
                                                ? 'TR_STAKING_CARD_TEXT_EMPTY_FUNDS_STAY'
                                                : 'TR_STAKING_CARD_TEXT_EMPTY'
                                        }
                                        values={{ displaySymbol }}
                                    />
                                ) : (
                                    <Translation
                                        id={
                                            isCardano
                                                ? 'TR_STAKING_CARD_TEXT_FUNDS_STAY'
                                                : 'TR_STAKING_CARD_TEXT_EMPTY'
                                        }
                                        values={{ potentialRewards, displaySymbol }}
                                    />
                                )}
                            </Paragraph>
                        </Column>

                        <Grid columns={isBelowLaptop ? 1 : 3} gap={spacings.xl}>
                            {stakingFeatures.map(feature => (
                                <Row key={feature.id} gap={spacings.md} alignItems="flex-start">
                                    <Column>
                                        <IconCircle name={feature.icon} intent="brand" size={40} />
                                    </Column>
                                    <Column gap={spacings.xxs}>
                                        <H4>{feature.title}</H4>
                                        <Paragraph intent="neutral" priority="secondary">
                                            {feature.text}
                                        </Paragraph>
                                    </Column>
                                </Row>
                            ))}
                        </Grid>

                        <Tooltip content={stakingMessageContent}>
                            <Button
                                onClick={openEarnInANutshellModal}
                                isDisabled={isStartStakingDisabled}
                                iconLeft={isStartStakingDisabled ? 'info' : undefined}
                                data-testid="@wallet/staking/empty-card/start-staking-button"
                                size="large"
                            >
                                <Translation id="TR_STAKING_CARD_START_STAKING" />
                            </Button>
                        </Tooltip>
                    </Column>
                </Card>
            </Column>
            <ContextMessage context={Context.getLegal('gateway')} />
        </DashboardSection>
    );
};
