import { useMemo } from 'react';

import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import { useFormatters } from '@suite-common/formatters';
import { Context } from '@suite-common/message-system';
import { getNetworkAdjustedStakingBalance } from '@suite-common/staking';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
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
import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useStakingYield } from 'src/hooks/earn/useStakingYield';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

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
    const isTron = account?.networkType === 'tron';

    const { apy } = useStakingYield({ symbol: account?.symbol, accountKey: account?.key });

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

    const stakingFeatures = useMemo(() => {
        if (isTron) {
            return [
                {
                    id: 0,
                    icon: 'lightning' as const,
                    title: <Translation id="TR_STAKING_CARD_GET_RESOURCES_TITLE" />,
                    text: <Translation id="TR_STAKING_CARD_GET_RESOURCES_TEXT" />,
                },
                {
                    id: 1,
                    icon: 'snowflake' as const,
                    title: <Translation id="TR_STAKING_CARD_FREEZE_AND_VOTE_TITLE" />,
                    text: <Translation id="TR_STAKING_CARD_FREEZE_AND_VOTE_TEXT" />,
                },
                {
                    id: 2,
                    icon: 'lockLaminatedOpen' as const,
                    title: <Translation id="TR_STAKING_CARD_UNSTAKE_ANYTIME_TITLE" />,
                    text: <Translation id="TR_STAKING_CARD_UNSTAKE_ANYTIME_TEXT" />,
                },
            ];
        }

        return [
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
        ];
    }, [isCardano, displaySymbol, isTron]);

    const cardTitle = useMemo(() => {
        if (isTron) {
            return (
                <Translation
                    id="TR_STAKING_CARD_TITLE_TRON"
                    values={{ apr: formatApyValue(apy), displaySymbol }}
                />
            );
        }

        return (
            <Translation
                id="TR_STAKING_CARD_TITLE"
                values={{ apy: formatApyValue(apy), displaySymbol }}
            />
        );
    }, [apy, displaySymbol, isTron]);

    const cardText = useMemo(() => {
        if (isTron) {
            return <Translation id="TR_STAKING_CARD_TEXT_TRON" />;
        }

        if (!hasEnoughBalanceForStaking || !hasPotentialRewards) {
            return (
                <Translation
                    id={
                        isCardano
                            ? 'TR_STAKING_CARD_TEXT_EMPTY_FUNDS_STAY'
                            : 'TR_STAKING_CARD_TEXT_EMPTY'
                    }
                    values={{ displaySymbol }}
                />
            );
        }

        return (
            <Translation
                id={isCardano ? 'TR_STAKING_CARD_TEXT_FUNDS_STAY' : 'TR_STAKING_CARD_TEXT_EMPTY'}
                values={{ potentialRewards, displaySymbol }}
            />
        );
    }, [
        hasEnoughBalanceForStaking,
        hasPotentialRewards,
        potentialRewards,
        displaySymbol,
        isCardano,
        isTron,
    ]);

    const openTronStakingFlow = () => {
        if (isStartStakingDisabled) return;

        dispatch(
            goto({
                routeName: 'earn-tron-stake',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };

    const openEarnInANutshellModal = () => {
        if (isStartStakingDisabled) return;

        dispatch(
            openModal({
                type: 'earn-in-a-nutshell',
                flow: EarnFlow.Stake,
                provider: EarnProvider.Everstake,
                account,
                analyticsStep: 'staking-dashboard',
            }),
        );
    };

    const onStartStakingClick = () => {
        if (isTron) {
            openTronStakingFlow();
        } else {
            openEarnInANutshellModal();
        }
    };

    return (
        <DashboardSection data-testid="@wallet/staking/empty-card">
            <Column gap={16}>
                {isDiscoveryRunning && <DiscoveryWarning />}

                <Card>
                    <Column gap={spacings.xxxl}>
                        <Column gap={spacings.xs}>
                            <H3>{cardTitle}</H3>

                            <Paragraph intent="neutral" priority="secondary" maxWidth={700}>
                                {cardText}
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
                                onClick={onStartStakingClick}
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
