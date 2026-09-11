import { networks } from '@suite-common/legacy-network-config';
import { asProtocol } from '@trezor/network-module-suite-common-types';

import type { GetNetworkConfig } from './createGetNetworkConfig';
import { createGetNetworkConfigs } from './createGetNetworkConfigs';

it('combines legacy metadata with all modularized configuration fields', () => {
    const protocols = [asProtocol('bitcoin')];
    const getNetworkConfig: GetNetworkConfig = () => ({ color: '#123456', protocols });
    const getNetworkConfigs = createGetNetworkConfigs({ getNetworkConfig });

    expect(getNetworkConfigs().find(network => network.symbol === 'btc')).toEqual({
        symbol: 'btc',
        name: networks.btc.name,
        displaySymbol: networks.btc.displaySymbol,
        networkType: networks.btc.networkType,
        decimals: networks.btc.decimals,
        testnet: networks.btc.testnet,
        explorer: networks.btc.explorer,
        color: '#123456',
        protocols,
    });
});
