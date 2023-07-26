import React, { useState } from 'react';
import styled from 'styled-components';

import { useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { CoinsGroupHeader } from './CoinsGroupHeader';
import { CoinsList } from './CoinsList';
import type { Network } from 'src/types/wallet';

const CoinsGroupWrapper = styled.div`
    width: 100%;
`;

interface CoinsGroupProps {
    networks: Network[];
    selectedNetworks?: Network['symbol'][];
    className?: string;
    onToggle: (symbol: Network['symbol'], toggled: boolean) => void;
}

export const CoinsGroup = ({
    onToggle,
    networks,
    selectedNetworks,
    className,
}: CoinsGroupProps) => {
    const dispatch = useDispatch();

    const [settingsMode, setSettingsMode] = useState(false);

    const isAtLeastOneActive = networks.some(({ symbol }) => selectedNetworks?.includes(symbol));

    const onSettings = (symbol: Network['symbol']) => {
        setSettingsMode(false);
        dispatch(
            openModal({
                type: 'advanced-coin-settings',
                coin: symbol,
            }),
        );
    };
    const toggleSettingsMode = () => setSettingsMode(value => !value);

    return (
        <CoinsGroupWrapper className={className}>
            <CoinsGroupHeader
                isAtLeastOneActive={isAtLeastOneActive}
                settingsMode={settingsMode}
                toggleSettingsMode={toggleSettingsMode}
            />
            <CoinsList
                networks={networks}
                selectedNetworks={selectedNetworks}
                settingsMode={settingsMode}
                onToggle={settingsMode ? onSettings : onToggle}
                onSettings={settingsMode ? undefined : onSettings}
            />
        </CoinsGroupWrapper>
    );
};
