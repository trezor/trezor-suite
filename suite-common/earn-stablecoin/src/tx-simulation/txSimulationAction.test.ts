import { composeStablecoinYieldTxSimulationAction } from './txSimulationAction';

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
});
