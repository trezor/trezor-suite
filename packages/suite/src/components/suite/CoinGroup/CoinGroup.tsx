import { useState } from 'react';
import styled from 'styled-components';

import { useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { CoinList } from 'src/components/suite';
import { NetworkCompatible } from '@suite-common/wallet-config';

import { CoinGroupHeader } from './CoinGroupHeader';

const CoinGroupWrapper = styled.div`
    width: 100%;
`;

interface CoinGroupProps {
    networks: NetworkCompatible[];
    enabledNetworks?: NetworkCompatible['symbol'][];
    className?: string;
    onToggle: (symbol: NetworkCompatible['symbol'], toggled: boolean) => void;
}

export const CoinGroup = ({ onToggle, networks, enabledNetworks, className }: CoinGroupProps) => {
    const [settingsMode, setSettingsMode] = useState(false);

    const dispatch = useDispatch();

    const isAtLeastOneActive = networks.some(({ symbol }) => enabledNetworks?.includes(symbol));

    const onSettings = (symbol: NetworkCompatible['symbol']) => {
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
        <CoinGroupWrapper className={className}>
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
        </CoinGroupWrapper>
    );
};
