import { useState } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useStakingAccountPosition } from '@suite-common/earn-staking';
import { type Account, type TronResourceType } from '@suite-common/wallet-types';
import { getTronResources } from '@suite-common/wallet-utils';
import { Button, Card, Column, Icon, Row, Text, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { LightningIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useTronFirmwareUpgradeModal } from '#src/hooks/earn/useTronFirmwareUpgradeModal';

import { TronResourceModal } from '../TronResourceModal';
import { TronResourceRow } from './TronResourceRow';
import { useTronStakingOperation } from '../hooks/useTronStakingOperation';

interface TronResourcesCardProps {
    account: Account;
}

export const TronResourcesCard = ({ account }: TronResourcesCardProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const [openResource, setOpenResource] = useState<TronResourceType | null>(null);
    // Resource meters are account data, not staking state.
    const resources = getTronResources(account);

    const { productId } = useStakingAccountPosition(account.key);

    const stake = useTronStakingOperation(productId, 'stake');
    const { openFirmwareModal, firmwareModal } = useTronFirmwareUpgradeModal();

    const bandwidthAvailable =
        (resources?.availableStakedBandwidth ?? 0) + (resources?.availableFreeBandwidth ?? 0);
    const bandwidthTotal =
        (resources?.totalStakedBandwidth ?? 0) + (resources?.totalFreeBandwidth ?? 0);
    const energyAvailable = resources?.availableEnergy ?? 0;
    const energyTotal = resources?.totalEnergy ?? 0;

    const goToFreeze = () => {
        if (stake.isDisabled) return;

        if (stake.isFirmwareOutdated) {
            openFirmwareModal('TR_EARN_TRON_STAKE_TITLE');

            return;
        }

        dispatch(
            gotoThunk({
                routeName: 'earn-tron-stake',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <>
            {firmwareModal}

            <Card
                paddingType="normal"
                data-testid="@staking/tron-resources-card/container"
                header={
                    <Row gap={8} alignItems="center">
                        <Icon as={LightningIcon} size={20} />
                        <Text typographyStyle="body-md-strong">
                            <Translation id="TR_EARN_TRON_RESOURCES" />
                        </Text>
                    </Row>
                }
                footer={
                    <Tooltip content={stake.message}>
                        <Button
                            intent="neutral"
                            priority="secondary"
                            onClick={goToFreeze}
                            isDisabled={stake.isDisabled}
                            data-testid="@staking/tron-resources-card/get-more-button"
                        >
                            <Translation id="TR_EARN_TRON_GET_MORE" />
                        </Button>
                    </Tooltip>
                }
            >
                <Column gap={16} alignItems="stretch">
                    <TronResourceRow
                        label="TR_TRON_BANDWIDTH"
                        tooltip="TR_TRON_BANDWIDTH_TOOLTIP"
                        data-testid="@staking/tron-resources-card/bandwidth"
                        available={bandwidthAvailable}
                        total={bandwidthTotal}
                        onClick={() => setOpenResource('bandwidth')}
                    />

                    <TronResourceRow
                        label="TR_TRON_ENERGY"
                        tooltip="TR_TRON_ENERGY_TOOLTIP"
                        data-testid="@staking/tron-resources-card/energy"
                        available={energyAvailable}
                        total={energyTotal}
                        onClick={() => setOpenResource('energy')}
                    />
                </Column>

                {openResource && (
                    <TronResourceModal
                        account={account}
                        resourceType={openResource}
                        onClose={() => setOpenResource(null)}
                    />
                )}
            </Card>
        </>
    );
};
