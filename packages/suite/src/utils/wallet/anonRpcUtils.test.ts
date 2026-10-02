import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { CustomBackend } from '@suite-common/wallet-types';

import { getAnonRpcSettings } from './anonRpcUtils';

const ETH_EVM_RPC: CustomBackend = {
    symbol: asNetworkSymbol('eth'),
    type: 'evm-rpc',
    urls: ['https://eth-rpc.example', 'https://eth-rpc-2.example'],
};

describe(getAnonRpcSettings.name, () => {
    it('routes a custom Ethereum EVM RPC backend through tor-js', () => {
        expect(getAnonRpcSettings({ backend: ETH_EVM_RPC, isAnonRpcEnabled: true })).toEqual({
            specifier: '0x700dA3193D35fA54Cd3fBf29B66f2a2A0385659e',
            bootstrapRpcUrl: 'https://eth-rpc.example',
            config: {
                gateways: ['170.64.236.147:12298:uEiBHwUMNRTetrbqScahm81Di57Xv2OphNrx-CurJGOq3ww'],
            },
        });
    });

    it('connects directly while the experimental feature is off', () => {
        expect(
            getAnonRpcSettings({ backend: ETH_EVM_RPC, isAnonRpcEnabled: false }),
        ).toBeUndefined();
    });

    it.each<[string, CustomBackend]>([
        ['a blockbook backend', { ...ETH_EVM_RPC, type: 'blockbook' }],
        ['another EVM chain', { ...ETH_EVM_RPC, symbol: asNetworkSymbol('base') }],
        ['an EVM RPC backend without a URL', { ...ETH_EVM_RPC, urls: [] }],
    ])('leaves %s alone', (_, backend) => {
        expect(getAnonRpcSettings({ backend, isAnonRpcEnabled: true })).toBeUndefined();
    });
});
