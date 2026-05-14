import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { DeviceRootState } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isCardanoStakedWithFiveBinaries } from '@suite-common/wallet-utils';
import { CompoundRoundedIcon } from '@suite-native/atoms';
import { type IconName, type IconSize } from '@suite-native/icons';
import { selectFirstCardanoAccountStakedWithFiveBinaries } from '@suite-native/staking';
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

type StakingBadgeProps = {
    networkSymbol: NetworkSymbol;
    account?: Account;
};

export const StakingBadge = ({ networkSymbol, account }: StakingBadgeProps) => {
    const firstAccountStakedWithFiveBinaries = useSelector(
        (state: AccountsRootState & DeviceRootState) =>
            selectFirstCardanoAccountStakedWithFiveBinaries(state),
    );

    const shouldShowWarningIcon = useMemo(() => {
        if (networkSymbol !== 'ada') return false;

        if (account) return isCardanoStakedWithFiveBinaries(account);

        return !!firstAccountStakedWithFiveBinaries;
    }, [firstAccountStakedWithFiveBinaries, networkSymbol, account]);

    const compoundIcons = useMemo<CompoundIcon[]>(
        () => [BASE_ICON, ...(shouldShowWarningIcon ? [WARNING_ICON] : [])],
        [shouldShowWarningIcon],
    );

    return <CompoundRoundedIcon containerSize={22} compoundIcons={compoundIcons} />;
};
