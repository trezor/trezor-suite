import { useSelector } from 'react-redux';

import {
    type StakingDeviceRootState,
    type StakingPositionEntry,
    selectDeviceActiveStakingPositionEntriesBySymbol,
    selectHasStakingAccountWarning,
    selectIsStakingAccountDelegatedOutside,
} from '@suite-common/earn-staking';
import { hasStakingPositionWarning } from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { CompoundRoundedIcon } from '@suite-native/atoms';
import { type IconName, type IconSize } from '@suite-native/icons';
import { type Color } from '@trezor/theme';

import { ExternalPoolBadge } from './ExternalPoolBadge';
import { TronUnassignedVotesBadge } from './TronUnassignedVotesBadge';

type CompoundIcon = {
    name: IconName;
    color?: Color;
    size?: IconSize;
};

const STAKING_ICONS: CompoundIcon[] = [
    { name: 'piggyBank', color: 'contentSecondary', size: 'small' },
];
const STAKING_WARNING_ICONS: CompoundIcon[] = [
    ...STAKING_ICONS,
    { name: 'warning', color: 'contentWarning', size: 'small' },
];

const hasOutdatedProvider = ({ position }: StakingPositionEntry) =>
    hasStakingPositionWarning(position, 'outdated-provider');

type StakingBadgeProps = {
    networkSymbol: NetworkSymbol;
    accountKey?: AccountKey;
};

export const StakingBadge = ({ networkSymbol, accountKey }: StakingBadgeProps) => {
    // The badge of an account warns about that account; the badge of a network about any of its accounts.
    const hasWarning = useSelector((state: StakingDeviceRootState) =>
        accountKey === undefined
            ? selectDeviceActiveStakingPositionEntriesBySymbol(state, networkSymbol).some(
                  hasOutdatedProvider,
              )
            : selectHasStakingAccountWarning(state, accountKey, 'outdated-provider'),
    );

    const isDelegatedOutside = useSelector(
        (state: StakingDeviceRootState) =>
            networkSymbol === 'ada' &&
            accountKey !== undefined &&
            selectIsStakingAccountDelegatedOutside(state, accountKey),
    );

    const stakingIcon = (
        <CompoundRoundedIcon
            containerSize={22}
            compoundIcons={hasWarning ? STAKING_WARNING_ICONS : STAKING_ICONS}
        />
    );

    if (hasWarning || accountKey === undefined) return stakingIcon;
    if (isDelegatedOutside) return <ExternalPoolBadge showStakingIcon />;
    if (networkSymbol === 'trx') {
        return (
            <TronUnassignedVotesBadge
                accountKey={accountKey}
                fallback={stakingIcon}
                showStakingIcon
            />
        );
    }

    return stakingIcon;
};
