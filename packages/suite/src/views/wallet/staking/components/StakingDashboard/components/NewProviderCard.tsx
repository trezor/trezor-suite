import { Context } from '@suite-common/message-system';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery, selectPoolStatsApyData } from '@suite-common/wallet-core';
import { Button, Card, Column, H3, Icon, Paragraph, Row, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { openModal } from 'src/actions/suite/modalActions';
import { DashboardSection } from 'src/components/dashboard';
import { Translation } from 'src/components/suite/Translation';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

import { DiscoveryWarning } from './DiscoveryWarning';

export const NewProviderCard = () => {
    const dispatch = useDispatch();
    const account = useSelector(selectSelectedAccount);
    const { device } = useDevice();

    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(account?.symbol);
    const isDeviceConnected = device?.connected && device?.available;
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const apy = useSelector(state => selectPoolStatsApyData(state, account?.symbol));

    const displaySymbol = account?.symbol ? getNetworkDisplaySymbol(account.symbol) : '';

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
            <Card paddingType="large">
                <Row alignItems="start" gap={spacings.xs}>
                    <Icon name="warning" variant="warning" size="extraLarge" />

                    <Column gap={spacings.xxxl}>
                        <Column gap={spacings.xs}>
                            <H3>
                                <Translation id="TR_STAKING_NEW_PROVIDER_TITLE" />
                            </H3>
                            <Paragraph variant="tertiary" maxWidth={700}>
                                <Translation
                                    id="TR_STAKING_NEW_PROVIDER_TEXT"
                                    values={{ apy, displaySymbol }}
                                />
                            </Paragraph>
                        </Column>

                        <Tooltip content={stakingMessageContent}>
                            <Button
                                onClick={openStakeInANutshellModal}
                                isDisabled={isStakingDisabled}
                                icon={isStakingDisabled ? 'info' : undefined}
                                data-testid="@wallet/staking/empty-card/start-staking-button"
                            >
                                <Translation id="TR_STAKING_UPDATE_PROVIDER" />
                            </Button>
                        </Tooltip>
                    </Column>
                </Row>
            </Card>
            <ContextMessage context={Context.getLegal('gateway')} />
        </DashboardSection>
    );
};
