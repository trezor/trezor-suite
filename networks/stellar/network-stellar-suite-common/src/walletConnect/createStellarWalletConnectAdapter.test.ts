import type {
    WalletConnectAccount,
    WalletConnectCallDevice,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';
import type { StellarNetworkSymbol } from '@trezor/network-stellar/constants';

import {
    type StellarWalletConnectAdapterDeps,
    createStellarWalletConnectAdapter,
} from './createStellarWalletConnectAdapter';

const SOURCE = 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH';

const mockTransaction = {
    source: SOURCE,
    addSignature: jest.fn(),
    toEnvelope: () => ({ toXdr: () => 'q80=' }),
};
const mockParseTransactionFromXDR = jest.fn((_xdr: string, _isTestnet: boolean) => mockTransaction);

jest.mock('@trezor/network-stellar/runtime', () => ({
    __esModule: true,
    default: () => Promise.resolve({ parseTransactionFromXDR: mockParseTransactionFromXDR }),
}));

const mockCallDevice = (result: unknown) =>
    // The popup result depends on the method, a fixed result cannot follow it.
    jest.fn(() =>
        Promise.resolve(result),
    ) as unknown as jest.MockedFunction<WalletConnectCallDevice>;

const createAccount = (
    overrides: Partial<WalletConnectAccount<StellarNetworkSymbol>> = {},
): WalletConnectAccount<StellarNetworkSymbol> => ({
    symbol: 'xlm',
    descriptor: SOURCE,
    path: "m/44'/148'/0'",
    visible: true,
    identity: 'identity',
    ...overrides,
});

const createDeps = () => {
    const connect = { pushTransaction: jest.fn() };
    const deps: StellarWalletConnectAdapterDeps = { getTrezorConnect: () => connect };

    return { connect, deps };
};

const createContext = (
    method: string,
    chainId: string,
    overrides: Partial<WalletConnectRequestContext<StellarNetworkSymbol>> = {},
): WalletConnectRequestContext<StellarNetworkSymbol> => ({
    request: { method, params: { xdr: 'unsigned-xdr' }, chainId },
    accounts: [createAccount()],
    sessionSymbol: undefined,
    callDevice: mockCallDevice({
        success: true,
        payload: { publicKey: 'key', signature: 'abcd' },
    }),
    resolveNonce: () => Promise.reject(new Error('Nonce is not expected.')),
    isMevProtectionEnabled: false,
    ...overrides,
});

describe('createStellarWalletConnectAdapter', () => {
    beforeEach(() => {
        mockTransaction.addSignature.mockClear();
        mockParseTransactionFromXDR.mockClear();
    });

    it('advertises the stellar namespace', () => {
        const adapter = createStellarWalletConnectAdapter(createDeps().deps);

        expect(adapter.namespaceId).toBe('stellar');
        expect(adapter.getChainIds('xlm')).toEqual(['stellar:pubnet']);
        expect(adapter.getChainIds('txlm')).toEqual(['stellar:testnet']);
        expect(adapter.getAccountAddress(createAccount())).toBe(SOURCE);
    });

    it('signs the XDR of the source account on the requested chain', async () => {
        const adapter = createStellarWalletConnectAdapter(createDeps().deps);
        const context = createContext('stellar_signXDR', 'stellar:testnet');

        const result = await adapter.handleRequest(context);

        expect(mockParseTransactionFromXDR).toHaveBeenCalledWith('unsigned-xdr', true);
        expect(context.callDevice).toHaveBeenCalledWith('stellarSignTransaction', {
            xdrBase64: 'unsigned-xdr',
            testnet: true,
            path: "m/44'/148'/0'",
        });
        expect(mockTransaction.addSignature).toHaveBeenCalledWith(SOURCE, 'q80=');
        expect(result).toEqual({ signedXDR: 'q80=' });
    });

    it('submits the signed XDR', async () => {
        const { connect, deps } = createDeps();
        const adapter = createStellarWalletConnectAdapter(deps);
        connect.pushTransaction.mockResolvedValue({ success: true, payload: { txid: 'txid' } });

        const result = await adapter.handleRequest(
            createContext('stellar_signAndSubmitXDR', 'stellar:pubnet'),
        );

        expect(connect.pushTransaction).toHaveBeenCalledWith({ coin: 'xlm', tx: 'abcd' });
        expect(result).toEqual({ status: 'success' });
    });

    it('rejects an unknown chain', async () => {
        const adapter = createStellarWalletConnectAdapter(createDeps().deps);
        const context = createContext('stellar_signXDR', 'stellar:futurenet');

        await expect(adapter.handleRequest(context)).rejects.toThrow(
            'Unsupported Stellar chain: stellar:futurenet',
        );
        expect(context.callDevice).not.toHaveBeenCalled();
    });

    it('does not sign for a hidden source account', async () => {
        const adapter = createStellarWalletConnectAdapter(createDeps().deps);
        const context = createContext('stellar_signXDR', 'stellar:pubnet', {
            accounts: [createAccount({ visible: false })],
        });

        await expect(adapter.handleRequest(context)).rejects.toThrow('Account not found');
        expect(context.callDevice).not.toHaveBeenCalled();
    });
});
