import { useSelector } from 'react-redux';

import {
    type StakingPositionEntry,
    selectDeviceStakingPositionEntries,
} from '@suite-common/earn-staking';

import { EarnPositionsList } from '../EarnPositionsList';
import { StakingPositionCard } from './StakingPositionCard';

export const StakingPositions = () => {
    const positionEntries = useSelector(selectDeviceStakingPositionEntries);

    const render = ({ position, descriptor, accountKey }: StakingPositionEntry) => (
        <StakingPositionCard
            key={`${accountKey}-${descriptor.id}`}
            position={position}
            descriptor={descriptor}
            accountKey={accountKey}
        />
    );

    if (positionEntries.length === 0) {
        return null;
    }

    return (
        <EarnPositionsList
            translationId="TR_EARN_STAKING"
            items={positionEntries}
            render={render}
        />
    );
};
