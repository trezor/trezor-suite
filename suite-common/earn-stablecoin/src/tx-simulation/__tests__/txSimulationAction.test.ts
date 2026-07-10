import { composeStablecoinYieldTxSimulationAction } from '../txSimulationAction';

const sourceOrigin = 'trezor-suite-native://stablecoin-yield';
const account = {
    key: 'eth-account-key',
    networkType: 'ethereum',
    symbol: 'eth',
    descriptor: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
    path: "m/44'/60'/0'/0/0",
} as const;

describe('composeStablecoinYieldTxSimulationAction', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('keeps EIP-1559 fee fields for claim simulation transactions', () => {
        const result = composeStablecoinYieldTxSimulationAction(
            {
                flow: 'claim',
                account,
                unsignedTx: {
                    to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
                    data: '0x71ee95c0',
                    chainId: 1,
                    gasLimit: '21000',
                    maxFeePerGas: '2000000000',
                    maxPriorityFeePerGas: '1000000000',
                    nonce: '7',
                },
            },
            sourceOrigin,
        );

        expect(result?.action.payload.transaction).toEqual({
            to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
            value: '0x0',
            data: '0x71ee95c0',
            chainId: 1,
            gasLimit: '21000',
            maxFeePerGas: '2000000000',
            maxPriorityFeePerGas: '1000000000',
            nonce: '7',
        });
    });

    it('keeps legacy gas price for claim simulation transactions', () => {
        const result = composeStablecoinYieldTxSimulationAction(
            {
                flow: 'claim',
                account,
                unsignedTx: {
                    to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
                    data: '0x71ee95c0',
                    chainId: 1,
                    gasLimit: '21000',
                    gasPrice: '1000000000',
                    nonce: '7',
                },
            },
            sourceOrigin,
        );

        expect(result?.action.payload.transaction).toEqual({
            to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
            value: '0x0',
            data: '0x71ee95c0',
            chainId: 1,
            gasLimit: '21000',
            gasPrice: '1000000000',
            nonce: '7',
        });
    });

    it('rejects mixed claim fee fields', () => {
        expect(
            composeStablecoinYieldTxSimulationAction(
                {
                    flow: 'claim',
                    account,
                    unsignedTx: {
                        to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
                        data: '0x71ee95c0',
                        chainId: 1,
                        gasLimit: '21000',
                        gasPrice: '1000000000',
                        maxFeePerGas: '2000000000',
                        maxPriorityFeePerGas: '1000000000',
                        nonce: '7',
                    },
                },
                sourceOrigin,
            ),
        ).toBeNull();
    });

    it('rejects incomplete claim fee fields', () => {
        expect(
            composeStablecoinYieldTxSimulationAction(
                {
                    flow: 'claim',
                    account,
                    unsignedTx: {
                        to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
                        data: '0x71ee95c0',
                        chainId: 1,
                        gasLimit: '21000',
                        maxFeePerGas: '2000000000',
                        nonce: '7',
                    },
                },
                sourceOrigin,
            ),
        ).toBeNull();
    });

    const WETH_MAINNET = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

    const wethUnsignedTx = (overrides: Record<string, unknown> = {}) =>
        JSON.stringify({
            from: account.descriptor,
            to: WETH_MAINNET,
            data: '0xd0e30db0',
            value: '0x2386f26fc10000',
            chainId: 1,
            gasLimit: '0xea60',
            maxFeePerGas: '0x77359400',
            maxPriorityFeePerGas: '0x3b9aca00',
            nonce: '0x7',
            ...overrides,
        });

    it('accepts a wrap transaction targeting the canonical WETH contract', () => {
        const result = composeStablecoinYieldTxSimulationAction(
            { flow: 'wrap', account, unsignedTx: wethUnsignedTx() },
            sourceOrigin,
        );

        expect(result?.action.payload.transaction.to).toBe(WETH_MAINNET);
    });

    it('rejects a wrap transaction targeting a different contract', () => {
        expect(
            composeStablecoinYieldTxSimulationAction(
                {
                    flow: 'wrap',
                    account,
                    unsignedTx: wethUnsignedTx({
                        to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
                    }),
                },
                sourceOrigin,
            ),
        ).toBeNull();
    });

    it('rejects a wrap transaction with a mismatched chainId', () => {
        expect(
            composeStablecoinYieldTxSimulationAction(
                { flow: 'wrap', account, unsignedTx: wethUnsignedTx({ chainId: 137 }) },
                sourceOrigin,
            ),
        ).toBeNull();
    });

    it('rejects a wrap transaction without a value', () => {
        expect(
            composeStablecoinYieldTxSimulationAction(
                { flow: 'wrap', account, unsignedTx: wethUnsignedTx({ value: '0x0' }) },
                sourceOrigin,
            ),
        ).toBeNull();
    });

    it('accepts an unwrap transaction calling withdraw without a value', () => {
        const result = composeStablecoinYieldTxSimulationAction(
            {
                flow: 'unwrap',
                account,
                unsignedTx: wethUnsignedTx({
                    data: `0x2e1a7d4d${'de0b6b3a7640000'.padStart(64, '0')}`,
                    value: '0x0',
                }),
            },
            sourceOrigin,
        );

        expect(result?.action.payload.transaction.to).toBe(WETH_MAINNET);
    });

    it('rejects an unwrap transaction carrying a value', () => {
        expect(
            composeStablecoinYieldTxSimulationAction(
                {
                    flow: 'unwrap',
                    account,
                    unsignedTx: wethUnsignedTx({
                        data: `0x2e1a7d4d${'de0b6b3a7640000'.padStart(64, '0')}`,
                    }),
                },
                sourceOrigin,
            ),
        ).toBeNull();
    });

    it('rejects an unwrap transaction withdrawing a zero amount', () => {
        expect(
            composeStablecoinYieldTxSimulationAction(
                {
                    flow: 'unwrap',
                    account,
                    unsignedTx: wethUnsignedTx({
                        data: `0x2e1a7d4d${'0'.repeat(64)}`,
                        value: '0x0',
                    }),
                },
                sourceOrigin,
            ),
        ).toBeNull();
    });
});
