import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type StakingDeviceRootState,
    type StakingPositionEntry,
    selectDeviceStakingPositionEntriesBySymbol,
    selectHasStakingAccountWarning,
} from '@suite-common/earn-staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { CompoundRoundedIcon } from '@suite-native/atoms';
import { type IconName, type IconSize } from '@suite-native/icons';
import { type Color } from '@trezor/theme';

type CompoundIcon = {
    name: IconName;
    color?: Color;
    size?: IconSize;
};

const BASE_ICON: CompoundIcon = {
    name: 'piggyBank',
    color: 'contentSecondary',
    size: 'small',
};

const WARNING_ICON: CompoundIcon = {
    name: 'warning',
    color: 'contentWarning',
    size: 'small',
};

const hasOutdatedProvider = ({ position }: StakingPositionEntry) =>
    position.warnings.some(warning => warning.code === 'outdated-provider');

type StakingBadgeProps = {
    networkSymbol: NetworkSymbol;
    accountKey?: AccountKey;
};

export const StakingBadge = ({ networkSymbol, accountKey }: StakingBadgeProps) => {
    // The badge of an account warns about that account; the badge of a network about any of its accounts.
    const shouldShowWarningIcon = useSelector((state: StakingDeviceRootState) =>
        accountKey === undefined
            ? selectDeviceStakingPositionEntriesBySymbol(state, networkSymbol).some(
                  hasOutdatedProvider,
              )
            : selectHasStakingAccountWarning(state, accountKey, 'outdated-provider'),
    );

    const compoundIcons = useMemo<CompoundIcon[]>(
        () => [BASE_ICON, ...(shouldShowWarningIcon ? [WARNING_ICON] : [])],
        [shouldShowWarningIcon],
    );

    return <CompoundRoundedIcon containerSize={22} compoundIcons={compoundIcons} />;
};
