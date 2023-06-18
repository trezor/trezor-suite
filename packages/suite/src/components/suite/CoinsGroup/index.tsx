import React, { useState } from 'react';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { useActions } from 'src/hooks/suite';
import { openModal as openModalAction } from 'src/actions/suite/modalActions';
import CoinsGroupHeader from './CoinsGroupHeader';
import CoinsList from './CoinsList';
import type { Network } from 'src/types/wallet';

const CoinsGroupWrapper = styled.div`
    width: 100%;
`;

interface CoinsGroupProps {
    networks: Network[];
    selectedNetworks?: Network['symbol'][];
    testnet?: boolean;
    className?: string;
    onToggle: (symbol: Network['symbol'], toggled: boolean) => void;
}

const CoinsGroup = ({
    onToggle,
    networks,
    selectedNetworks,
    testnet,
    className,
}: CoinsGroupProps) => {
    const { openModal } = useActions({
        openModal: openModalAction,
    });

    const [settingsMode, setSettingsMode] = useState(false);

    const onSettings = (symbol: Network['symbol']) => {
        setSettingsMode(false);
        openModal({
            type: 'advanced-coin-settings',
            coin: symbol,
        });
    };

    return (
        <CoinsGroupWrapper className={className}>
            <CoinsGroupHeader
                total={networks.length}
                active={networks.filter(n => selectedNetworks?.includes(n.symbol)).length}
                label={
                    <Translation id={testnet ? 'TR_TESTNET_COINS' : 'TR_ONBOARDING_STEP_COINS'} />
                }
                settingsMode={settingsMode}
                toggleSettingsMode={() => setSettingsMode(value => !value)}
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

export default CoinsGroup;
