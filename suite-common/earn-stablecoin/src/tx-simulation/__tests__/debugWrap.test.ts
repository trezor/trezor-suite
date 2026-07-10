import { composeStablecoinYieldTxSimulationAction } from '../txSimulationAction';

it('debug wrap', () => {
    const result = composeStablecoinYieldTxSimulationAction(
        {
            flow: 'wrap',
            account: {
                key: 'eth-account-key',
                networkType: 'ethereum',
                symbol: 'eth',
                descriptor: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
                path: "m/44'/60'/0'/0/0",
            },
            unsignedTx: JSON.stringify({
                from: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
                to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                data: '0xd0e30db0',
                value: '0x2386f26fc10000',
                chainId: 1,
                gasLimit: '0xea60',
                maxFeePerGas: '0x77359400',
                maxPriorityFeePerGas: '0x3b9aca00',
                nonce: '0x7',
            }),
        },
        'trezor-suite-native://stablecoin-yield',
    );
    expect(result).not.toBeNull();
});
