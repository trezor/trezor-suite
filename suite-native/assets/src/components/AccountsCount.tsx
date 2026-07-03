import { memo } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccountsByNetworkSymbol } from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';

import { type AssetsRootState } from '../types';

type AccountsCountProps = { symbol: NetworkSymbol };

export const AccountsCount = memo(({ symbol }: AccountsCountProps) => {
    const accountsCount = useSelector(
        (state: AssetsRootState) =>
            selectVisibleDeviceAccountsByNetworkSymbol(state, symbol).length,
    );

    return (
        <Text variant="body-sm" color="contentSecondary">
            {accountsCount}
        </Text>
    );
});

AccountsCount.displayName = 'AccountsCount';
