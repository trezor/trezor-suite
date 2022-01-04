import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { openModal as openModalAction } from '@suite-actions/modalActions';
import CoinsCount from './CoinsCount';
import CoinsList from './CoinsList';
import type { Network } from '@wallet-types';

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

    const onSettings = (symbol: Network['symbol']) => {
        openModal({
            type: 'advanced-coin-settings',
            coin: symbol,
        });
    };

    return (
        <CoinsGroupWrapper className={className}>
            <CoinsCount
                total={networks.length}
                active={networks.filter(n => selectedNetworks?.includes(n.symbol)).length}
                label={
                    <Translation id={testnet ? 'TR_TESTNET_COINS' : 'TR_ONBOARDING_STEP_COINS'} />
                }
            />
            <CoinsList
                networks={networks}
                selectedNetworks={selectedNetworks}
                onToggle={onToggle}
                onSettings={onSettings}
            />
        </CoinsGroupWrapper>
    );
};

export default CoinsGroup;
