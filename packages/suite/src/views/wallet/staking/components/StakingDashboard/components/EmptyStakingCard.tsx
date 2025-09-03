import { useMemo } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { Context } from '@suite-common/message-system';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery, selectPoolStatsApyData } from '@suite-common/wallet-core';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
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
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { openModal } from 'src/actions/suite/modalActions';
import { DashboardSection } from 'src/components/dashboard';
import { Translation } from 'src/components/suite';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useDevice, useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

import { DiscoveryWarning } from './DiscoveryWarning';

export const EmptyStakingCard = () => {
    const { isBelowLaptop } = useLayoutSize();
    const dispatch = useDispatch();
    const { CryptoAmountFormatter } = useFormatters();
    const account = useSelector(selectSelectedAccount);
    const { device } = useDevice();

    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(account?.symbol);
    const isDeviceConnected = device?.connected && device?.available;
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const isCardano = account?.networkType === 'cardano';

    const apy = useSelector(state => selectPoolStatsApyData(state, account?.symbol));
    const stakingData = getStakingDataForNetwork(account);

    const accountBalance = account?.formattedBalance ?? '0';
    const stakingBalance = stakingData?.depositedBalance ?? '0';

    const isAccountEmpty = new BigNumber(accountBalance).eq(0);

    const potentialRewards = useMemo(() => {
        const totalBalance = new BigNumber(stakingBalance).plus(accountBalance).toString();
        const amount = new BigNumber(totalBalance).multipliedBy(apy / 100);

        return CryptoAmountFormatter.format(amount.toString(), {
            symbol: account?.symbol,
            isBalance: true,
            withSymbol: false,
            maxDisplayedDecimals: 8,
            isEllipsisAppended: false,
        });
    }, [accountBalance, stakingBalance, apy, account, CryptoAmountFormatter]);

    const displaySymbol = account?.symbol ? getNetworkDisplaySymbol(account.symbol) : '';

    const stakingFeatures = useMemo(
        () => [
            {
                id: 0,
                icon: 'piggyBank' as const,
                title: <Translation id="TR_STAKING_CARD_KEEP_EARNING_TITLE" />,
                text: (
                    <Translation
                        id="TR_STAKING_CARD_KEEP_EARNING_TEXT"
                        values={{
                            t: text => (
                                <Tooltip
                                    dashed
                                    isInline
                                    content={<Translation id="TR_STAKE_APY_DESC" />}
                                >
                                    <abbr>{text}</abbr>
                                </Tooltip>
                            ),
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
                title: (
                    <Translation
                        id={isCardano ? 'TR_STAKE_GET_MORE' : 'TR_STAKING_CARD_RESTAKE_TITLE'}
                    />
                ),
                text: (
                    <Translation
                        id={
                            isCardano
                                ? 'TR_STAKE_CLAIM_REWARDS_TO_GROW'
                                : 'TR_STAKING_CARD_RESTAKE_TEXT'
                        }
                    />
                ),
            },
        ],
        [isCardano, displaySymbol],
    );

    const openStakeInANutshellModal = () => {
        if (!isStakingDisabled) {
            dispatch(openModal({ type: 'stake-in-a-nutshell' }));

            analytics.report({
                type: EventType.StakingStake,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: account?.symbol,
                },
            });
        }
    };

    return (
        <DashboardSection
            data-testid="@wallet/staking/empty-card"
            heading={<Translation id="TR_STAKE_STAKE_TOKEN" values={{ symbol: displaySymbol }} />}
        >
            {!isDeviceConnected && <ConnectDeviceGenericPromo />}
            {isDiscoveryRunning && <DiscoveryWarning />}
            <Card>
                <Column gap={spacings.xxxl}>
                    <Column gap={spacings.xs}>
                        <H3>
                            <Translation
                                id="TR_STAKING_CARD_TITLE"
                                values={{ apy, displaySymbol }}
                            />
                        </H3>
                        <Paragraph variant="tertiary" maxWidth={700}>
                            {isAccountEmpty ? (
                                <Translation
                                    id="TR_STAKING_CARD_TEXT_EMPTY"
                                    values={{ displaySymbol }}
                                />
                            ) : (
                                <Translation
                                    id="TR_STAKING_CARD_TEXT"
                                    values={{ potentialRewards, displaySymbol }}
                                />
                            )}
                        </Paragraph>
                    </Column>

                    <Grid columns={isBelowLaptop ? 1 : 3} gap={spacings.xl}>
                        {stakingFeatures.map(feature => (
                            <Row key={feature.id} gap={spacings.md} alignItems="flex-start">
                                <Column>
                                    <IconCircle name={feature.icon} variant="primary" size={44} />
                                </Column>
                                <Column gap={spacings.xxs}>
                                    <H4>{feature.title}</H4>
                                    <Paragraph variant="tertiary">{feature.text}</Paragraph>
                                </Column>
                            </Row>
                        ))}
                    </Grid>

                    <Tooltip content={stakingMessageContent}>
                        <Button
                            onClick={openStakeInANutshellModal}
                            isDisabled={isStakingDisabled}
                            icon={isStakingDisabled ? 'info' : undefined}
                        >
                            <Translation id="TR_STAKING_CARD_START_STAKING" />
                        </Button>
                    </Tooltip>
                </Column>
            </Card>
            <ContextMessage context={Context.getLegal('gateway')} />
        </DashboardSection>
    );
};
