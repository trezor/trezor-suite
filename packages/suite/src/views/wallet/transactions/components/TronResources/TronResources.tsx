import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Card, Row } from '@trezor/components';

import { Resource } from './Resource';

type TronResourcesProps = {
    account: Account;
};

export const TronResources = ({ account }: TronResourcesProps) => {
    if (account.networkType !== 'tron') return null;

    const { tronResources } = account.misc;

    if (!tronResources) return null;

    const {
        availableStakedBandwidth,
        availableFreeBandwidth,
        totalStakedBandwidth,
        totalFreeBandwidth,
        availableEnergy,
        totalEnergy,
    } = tronResources;

    const availableBandwidth = availableStakedBandwidth + availableFreeBandwidth;
    const totalBandwidth = totalStakedBandwidth + totalFreeBandwidth;

    return (
        <Card>
            <Row gap={48} flexWrap="wrap">
                <Resource
                    label={<Translation id="TR_TRON_BANDWIDTH" />}
                    tooltip={<Translation id="TR_TRON_BANDWIDTH_TOOLTIP" />}
                    available={availableBandwidth}
                    total={totalBandwidth}
                />
                <Resource
                    label={<Translation id="TR_TRON_ENERGY" />}
                    tooltip={<Translation id="TR_TRON_ENERGY_TOOLTIP" />}
                    available={availableEnergy}
                    total={totalEnergy}
                />
            </Row>
        </Card>
    );
};
