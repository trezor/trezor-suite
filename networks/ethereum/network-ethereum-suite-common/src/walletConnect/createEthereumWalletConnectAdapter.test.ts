import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import type {
    WalletConnectAccount,
    WalletConnectCallDevice,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';

import {
    type EthereumWalletConnectAdapterDeps,
    createEthereumWalletConnectAdapter,
} from './createEthereumWalletConnectAdapter';

const ADDRESS = '0xAbCd000000000000000000000000000000000001';

const mockCallDevice = (result: unknown) =>
    // The popup result depends on the method, a fixed result cannot follow it.
    jest.fn(() =>
        Promise.resolve(result),
    ) as unknown as jest.MockedFunction<WalletConnectCallDevice>;

const createAccount = (
    overrides: Partial<WalletConnectAccount<EthereumNetworkSymbol>> = {},
): WalletConnectAccount<EthereumNetworkSymbol> => ({
    symbol: 'eth',
    descriptor: ADDRESS,
    path: "m/44'/60'/0'/0/0",
    visible: true,
    identity: 'identity',
    ...overrides,
});

const createDeps = () => {
    const connect = {
        blockchainEstimateFee: jest.fn(),
        pushTransaction: jest.fn(),
    };
    const deps: EthereumWalletConnectAdapterDeps = { getTrezorConnect: () => connect };

    return { connect, deps };
};

const createContext = (
    method: string,
    params: unknown,
    overrides: Partial<WalletConnectRequestContext<EthereumNetworkSymbol>> = {},
): WalletConnectRequestContext<EthereumNetworkSymbol> => ({
    request: { method, params, chainId: 'eip155:1' },
    accounts: [createAccount(), createAccount({ symbol: 'pol', path: "m/44'/60'/0'/0/1" })],
    sessionSymbol: undefined,
    callDevice: jest.fn(() => Promise.reject(new Error('Device is not expected.'))),
    resolveNonce: jest.fn(() => Promise.reject(new Error('Nonce is not expected.'))),
    isMevProtectionEnabled: false,
    ...overrides,
});

const mockSignature = (signature: string) =>
    mockCallDevice({ success: true, payload: { signature } });

describe('createEthereumWalletConnectAdapter', () => {
    it('advertises the eip155 namespace', () => {
        const adapter = createEthereumWalletConnectAdapter(createDeps().deps);

        expect(adapter.namespaceId).toBe('eip155');
        expect(adapter.events).toEqual(['chainChanged', 'accountsChanged']);
        expect(adapter.getChainIds('eth')).toEqual(['eip155:1']);
        expect(adapter.getChainIds('pol')).toEqual(['eip155:137']);
        expect(adapter.getChainIds('etc')).toEqual(['eip155:61']);
        expect(adapter.getAccountAddress(createAccount())).toBe(ADDRESS);
    });

    it.each([
        ['Hello', 'Hello', false],
        ['0x48656c6c6f', 'Hello', false],
        ['0x00ff', '0x00ff', true],
    ])('signs the personal message %s', async (message, signedMessage, hex) => {
        const adapter = createEthereumWalletConnectAdapter(createDeps().deps);
        const callDevice = mockSignature('abcd');

        const result = await adapter.handleRequest(
            createContext('personal_sign', [message, ADDRESS.toLowerCase()], { callDevice }),
        );

        expect(callDevice).toHaveBeenCalledWith('ethereumSignMessage', {
            path: "m/44'/60'/0'/0/0",
            message: signedMessage,
            hex,
        });
        expect(result).toBe('0xabcd');
    });

    it('rejects a request for an unknown account', async () => {
        const adapter = createEthereumWalletConnectAdapter(createDeps().deps);

        await expect(
            adapter.handleRequest(createContext('personal_sign', ['Hello', '0xforeign'])),
        ).rejects.toThrow('Account not found');
    });

    it('signs typed data', async () => {
        const adapter = createEthereumWalletConnectAdapter(createDeps().deps);
        const callDevice = mockSignature('0xabcd');
        const data = { types: {}, primaryType: 'Mail', domain: {}, message: {} };

        const result = await adapter.handleRequest(
            createContext('eth_signTypedData_v4', [ADDRESS, JSON.stringify(data)], {
                callDevice,
            }),
        );

        expect(callDevice).toHaveBeenCalledWith('ethereumSignTypedData', {
            path: "m/44'/60'/0'/0/0",
            data,
            metamask_v4_compat: true,
        });
        expect(result).toBe('0xabcd');
    });

    it('returns the requested chain on switch', async () => {
        const adapter = createEthereumWalletConnectAdapter(createDeps().deps);

        await expect(
            adapter.handleRequest(
                createContext('wallet_switchEthereumChain', [{ chainId: '0x89' }]),
            ),
        ).resolves.toEqual({ chainId: '0x89' });
    });

    describe('eth_sendTransaction', () => {
        const signTransaction = () =>
            mockCallDevice({ success: true, payload: { serializedTx: '0xsigned' } });

        it('fills in the fee, gas, value and nonce of the account on the requested chain', async () => {
            const { connect, deps } = createDeps();
            const adapter = createEthereumWalletConnectAdapter(deps);
            connect.blockchainEstimateFee.mockResolvedValue({
                success: true,
                payload: {
                    levels: [
                        {
                            feePerUnit: '1',
                            eip1559: {
                                medium: { maxFeePerGas: '3000', maxPriorityFeePerGas: '100' },
                            },
                        },
                    ],
                },
            });
            connect.pushTransaction.mockResolvedValue({ success: true, payload: { txid: '0xtx' } });
            const callDevice = signTransaction();
            const resolveNonce = jest.fn(() => Promise.resolve('10'));
            const context = createContext(
                'eth_sendTransaction',
                [{ from: ADDRESS, to: '0xrecipient', data: '0xa9059cbb' }],
                {
                    request: {
                        method: 'eth_sendTransaction',
                        params: [{ from: ADDRESS, to: '0xrecipient', data: '0xa9059cbb' }],
                        chainId: 'eip155:137',
                    },
                    callDevice,
                    resolveNonce,
                },
            );

            const result = await adapter.handleRequest(context);

            const polygonAccount = context.accounts[1];
            expect(connect.blockchainEstimateFee).toHaveBeenCalledWith({
                coin: 'pol',
                identity: 'identity',
                request: { blocks: [2], specific: { from: ADDRESS } },
            });
            expect(resolveNonce).toHaveBeenCalledWith(polygonAccount);
            expect(callDevice).toHaveBeenCalledWith('ethereumSignTransaction', {
                path: "m/44'/60'/0'/0/1",
                transaction: {
                    from: ADDRESS,
                    to: '0xrecipient',
                    data: '0xa9059cbb',
                    maxFeePerGas: '0xbb8',
                    maxPriorityFeePerGas: '0x64',
                    gas: '0x3d090',
                    gasLimit: '0x3d090',
                    value: '0x0',
                    nonce: '0x0a',
                    chainId: 137,
                },
            });
            expect(connect.pushTransaction).toHaveBeenCalledWith({
                tx: { hex: '0xsigned', disableAlternativeRPC: true },
                coin: 'pol',
                identity: 'identity',
            });
            expect(result).toBe('0xtx');
        });

        it('keeps the fee of the dApp and broadcasts through MEV protection', async () => {
            const { connect, deps } = createDeps();
            const adapter = createEthereumWalletConnectAdapter(deps);
            connect.pushTransaction.mockResolvedValue({ success: true, payload: { txid: '0xtx' } });
            const callDevice = signTransaction();
            const transaction = {
                from: ADDRESS,
                to: '0xrecipient',
                gas: '0x5208',
                value: '0x1',
                gasPrice: '0x3b9aca00',
            };

            await adapter.handleRequest(
                createContext('eth_sendTransaction', [transaction], {
                    callDevice,
                    resolveNonce: () => Promise.resolve('0'),
                    isMevProtectionEnabled: true,
                }),
            );

            expect(connect.blockchainEstimateFee).not.toHaveBeenCalled();
            expect(callDevice).toHaveBeenCalledWith('ethereumSignTransaction', {
                path: "m/44'/60'/0'/0/0",
                transaction: {
                    ...transaction,
                    data: '',
                    gasLimit: '0x5208',
                    nonce: '0x00',
                    chainId: 1,
                },
            });
            expect(connect.pushTransaction).toHaveBeenCalledWith(
                expect.objectContaining({ tx: '0xsigned' }),
            );
        });

        it('falls back to the legacy gas price', async () => {
            const { connect, deps } = createDeps();
            const adapter = createEthereumWalletConnectAdapter(deps);
            connect.blockchainEstimateFee.mockResolvedValue({
                success: true,
                payload: { levels: [{ feePerUnit: '1000000000' }] },
            });
            connect.pushTransaction.mockResolvedValue({ success: true, payload: { txid: '0xtx' } });
            const callDevice = signTransaction();

            await adapter.handleRequest(
                createContext('eth_sendTransaction', [{ from: ADDRESS }], {
                    callDevice,
                    resolveNonce: () => Promise.resolve('1'),
                }),
            );

            expect(callDevice).toHaveBeenCalledWith(
                'ethereumSignTransaction',
                expect.objectContaining({
                    transaction: expect.objectContaining({ gasPrice: '0x3b9aca00' }),
                }),
            );
        });

        it.each(['gas', 'value', 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas'])(
            'rejects a decimal %s',
            async field => {
                const adapter = createEthereumWalletConnectAdapter(createDeps().deps);
                const context = createContext('eth_sendTransaction', [
                    { from: ADDRESS, [field]: '21000' },
                ]);

                await expect(adapter.handleRequest(context)).rejects.toThrow(
                    `eth_sendTransaction invalid ${field}`,
                );
                expect(context.callDevice).not.toHaveBeenCalled();
            },
        );

        it('rejects a transaction without an estimated fee', async () => {
            const { connect, deps } = createDeps();
            const adapter = createEthereumWalletConnectAdapter(deps);
            connect.blockchainEstimateFee.mockResolvedValue({
                success: true,
                payload: { levels: [{}] },
            });
            const context = createContext('eth_sendTransaction', [{ from: ADDRESS }]);

            await expect(adapter.handleRequest(context)).rejects.toThrow(
                'eth_sendTransaction cannot estimate fee',
            );
            expect(context.callDevice).not.toHaveBeenCalled();
        });

        it('does not broadcast a transaction the user declined', async () => {
            const { connect, deps } = createDeps();
            const adapter = createEthereumWalletConnectAdapter(deps);
            const callDevice = jest.fn(() =>
                Promise.resolve({
                    success: false as const,
                    error: { message: 'Cancelled', code: 'Method_Cancel' as const },
                }),
            );
            jest.spyOn(console, 'error').mockImplementation(() => {});

            await expect(
                adapter.handleRequest(
                    createContext(
                        'eth_sendTransaction',
                        [{ from: ADDRESS, gasPrice: '0x1', gas: '0x5208' }],
                        { callDevice, resolveNonce: () => Promise.resolve('0') },
                    ),
                ),
            ).rejects.toThrow('eth_sendTransaction error');
            expect(connect.pushTransaction).not.toHaveBeenCalled();
        });
    });
});
