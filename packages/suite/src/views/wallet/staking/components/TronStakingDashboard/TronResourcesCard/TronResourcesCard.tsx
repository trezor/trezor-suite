import { useState } from 'react';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { type Account, type TronResourceType } from '@suite-common/wallet-types';
import { getTronResources } from '@suite-common/wallet-utils';
import { Button, Card, Column, Icon, Row, Text } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';

import { TronResourceModal } from '../TronResourceModal';
import { TronResourceRow } from './TronResourceRow';

interface TronResourcesCardProps {
    account: Account;
}

export const TronResourcesCard = ({ account }: TronResourcesCardProps) => {
    const dispatch = useDispatch();
    const [openResource, setOpenResource] = useState<TronResourceType | null>(null);
    const resources = getTronResources(account);

    const bandwidthAvailable =
        (resources?.availableStakedBandwidth ?? 0) + (resources?.availableFreeBandwidth ?? 0);
    const bandwidthTotal =
        (resources?.totalStakedBandwidth ?? 0) + (resources?.totalFreeBandwidth ?? 0);
    const energyAvailable = resources?.availableEnergy ?? 0;
    const energyTotal = resources?.totalEnergy ?? 0;

    const goToFreeze = () =>
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

    return (
        <Card
            paddingType="normal"
            header={
                <Row gap={8} alignItems="center">
                    <Icon name="lightning" size={20} />
                    <Text typographyStyle="body-md-strong">
                        <Translation id="TR_EARN_TRON_RESOURCES" />
                    </Text>
                </Row>
            }
            footer={
                <Button intent="neutral" priority="secondary" onClick={goToFreeze}>
                    <Translation id="TR_EARN_TRON_GET_MORE" />
                </Button>
            }
        >
            <Column gap={16} alignItems="stretch">
                <TronResourceRow
                    label="TR_TRON_BANDWIDTH"
                    tooltip="TR_TRON_BANDWIDTH_TOOLTIP"
                    available={bandwidthAvailable}
                    total={bandwidthTotal}
                    onClick={() => setOpenResource('bandwidth')}
                />
                <TronResourceRow
                    label="TR_TRON_ENERGY"
                    tooltip="TR_TRON_ENERGY_TOOLTIP"
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
    );
};
