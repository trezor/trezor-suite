import React from 'react';
import styled from 'styled-components';
import { P, variables } from '@trezor/components';

import { CoinsList } from '@suite-components';
import { Network } from '@wallet-types';
import { TrezorDevice } from '@suite-types';

const Title = styled(P)`
    margin-right: 9px;
    padding: 14px 0%;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

type Props = {
    networks: Network[];
    testnetNetworks: Network[];
    selectedNetworks: Network['symbol'][];
    unavailableCapabilities: TrezorDevice['unavailableCapabilities'];
    handleNetworkSelection: (symbol?: Network['symbol']) => void;
};

const EnableNetwork = ({
    networks,
    testnetNetworks,
    selectedNetworks,
    handleNetworkSelection,
    unavailableCapabilities,
}: Props) => (
    <>
        <Title>inactive</Title>
        <CoinsList
            onToggleFn={handleNetworkSelection}
            networks={networks}
            selectedNetworks={selectedNetworks}
            unavailableCapabilities={unavailableCapabilities}
        />
        <Title>testnet</Title>
        <CoinsList
            onToggleFn={handleNetworkSelection}
            networks={testnetNetworks}
            selectedNetworks={selectedNetworks}
            unavailableCapabilities={unavailableCapabilities}
        />
    </>
);

export default EnableNetwork;
