import { useState } from 'react';

import { openModal } from '@suite/modal';
import type { Network, NetworkSymbol } from '@suite-common/wallet-config';
import { changeCoinVisibility } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CoinList } from 'src/components/suite/CoinList/CoinList';
import { useDispatch } from 'src/hooks/suite';

import { CoinGroupHeader } from './CoinGroupHeader';
import { type CoinListProps } from '../CoinList/CoinList';

type CoinGroupProps = {
    networks: Network[];
    enabledNetworks?: NetworkSymbol[];
};

export const CoinGroup = ({ networks, enabledNetworks }: CoinGroupProps) => {
    const [settingsMode, setSettingsMode] = useState(false);

    const dispatch = useDispatch();

    const isAtLeastOneActive = networks.some(({ symbol }) => enabledNetworks?.includes(symbol));

    const onToggle: CoinListProps['onToggle'] = (symbol, shouldBeVisible) =>
        dispatch(changeCoinVisibility({ symbol, shouldBeVisible }));
    const onSettings = (symbol: NetworkSymbol) => {
        setSettingsMode(false);
        dispatch(
            openModal({
                type: 'advanced-coin-settings',
                symbol,
            }),
        );
    };
    const toggleSettingsMode = () => setSettingsMode(value => !value);

    return (
        <Column gap={spacings.sm}>
            <CoinGroupHeader
                isAtLeastOneActive={isAtLeastOneActive}
                settingsMode={settingsMode}
                toggleSettingsMode={toggleSettingsMode}
            />
            <CoinList
                networks={networks}
                enabledNetworks={enabledNetworks}
                settingsMode={settingsMode}
                onToggle={settingsMode ? onSettings : onToggle}
                onSettings={settingsMode ? undefined : onSettings}
            />
        </Column>
    );
};
