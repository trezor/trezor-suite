import React from 'react';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { TrezorDevice } from '@suite-types';
import { Translation } from '@suite-components';
import CoinsCount from './CoinsCount';
import CoinsList from './CoinsList';

const CoinsGroupWrapper = styled.div`
    width: 100%;
`;
interface Props {
    onToggleFn: (symbol: Network['symbol'], visible: boolean) => void;
    networks: Network[];
    enabledNetworks: Network['symbol'][];
    testnet: boolean;
    unavailableCapabilities: TrezorDevice['unavailableCapabilities'];
}

const CoinsGroup = ({
    onToggleFn,
    networks,
    enabledNetworks,
    testnet,
    unavailableCapabilities,
}: Props) => (
    <CoinsGroupWrapper>
        <CoinsCount
            networks={networks}
            enabledNetworks={enabledNetworks}
            label={
                testnet ? (
                    <Translation id="TR_TESTNET_COINS" />
                ) : (
                    <Translation id="TR_ONBOARDING_STEP_COINS" />
                )
            }
        />
        <CoinsList
            onToggleFn={onToggleFn}
            networks={networks}
            selectedNetworks={enabledNetworks}
            unavailableCapabilities={unavailableCapabilities}
        />
    </CoinsGroupWrapper>
);

export default CoinsGroup;
