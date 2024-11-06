import { useState } from 'react';

import styled from 'styled-components';

import { Network, NetworkSymbol } from '@suite-common/wallet-config';

import { useDispatch } from 'src/hooks/suite';
import { changeCoinVisibility } from 'src/actions/settings/walletSettingsActions';
import { openModal } from 'src/actions/suite/modalActions';
import { CoinList } from 'src/components/suite';

import { CoinGroupHeader } from './CoinGroupHeader';
import { CoinListProps } from '../CoinList/CoinList';

const CoinGroupWrapper = styled.div`
    width: 100%;
`;

type CoinGroupProps = {
    networks: Network[];
    enabledNetworks?: NetworkSymbol[];
};

export const CoinGroup = ({ networks, enabledNetworks }: CoinGroupProps) => {
    const [settingsMode, setSettingsMode] = useState(false);

    const dispatch = useDispatch();

    const isAtLeastOneActive = networks.some(({ symbol }) => enabledNetworks?.includes(symbol));

    const onToggle: CoinListProps['onToggle'] = (symbol, shouldBeVisible) =>
        dispatch(changeCoinVisibility(symbol, shouldBeVisible));
    const onSettings = (symbol: NetworkSymbol) => {
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
        <CoinGroupWrapper>
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
