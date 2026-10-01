import {
    type NetworkModuleRepository,
    asNetworkSymbol,
    createNetworkModuleRepository,
} from '@suite-common/networks';
import { getMockNetworkMetadata } from '@suite-common/networks/mocks';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import {
    type SuiteCommonNetworkModule,
    type WalletConnectAdapter,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import {
    getNamespaces,
    getProposalNetworks,
    getWalletConnectAdapterByMethod,
    getWalletConnectNamespaceId,
    toWalletConnectAccount,
} from './walletConnectNetworks';

const createTestModule = (
    supportedNetworks: readonly string[],
    walletConnectAdapter?: WalletConnectAdapter<string>,
): SuiteCommonNetworkModule =>
    createNetworkModule(supportedNetworks, {
        addressValidator: { isAddressValid: () => true, getAddressType: () => undefined },
        getNetworkConfig: symbol => getMockNetworkMetadata(symbol),
        walletConnectAdapter,
    });

const evmAdapter: WalletConnectAdapter<string> = {
    namespaceId: 'eip155',
    methods: ['personal_sign'],
    events: ['chainChanged', 'accountsChanged'],
    getChainIds: symbol => ({ eth: ['eip155:1'], pol: ['eip155:137'] })[symbol] ?? [],
    getAccountAddress: account => account.descriptor,
    handleRequest: () => Promise.resolve('evm'),
};

const solanaAdapter: WalletConnectAdapter<string> = {
    namespaceId: 'solana',
    methods: ['solana_signTransaction'],
    events: ['accountsChanged'],
    getChainIds: symbol =>
        symbol === 'sol' ? ['solana:mainnet', 'solana:legacy'] : ['solana:devnet'],
    getAccountAddress: account => account.descriptor,
    handleRequest: () => Promise.resolve('solana'),
};

const utxoAdapter: WalletConnectAdapter<string> = {
    namespaceId: 'bip122',
    methods: ['sendTransfer'],
    events: ['accountsChanged'],
    getChainIds: symbol => (symbol === 'btc' ? ['bip122:btc'] : []),
    getAccountAddress: account => account.addresses?.used[0]?.address,
    handleRequest: () => Promise.resolve('utxo'),
};

const networkModuleRepository: NetworkModuleRepository = createNetworkModuleRepository({
    networkModules: {
        bitcoin: createTestModule(['btc', 'test'], utxoAdapter),
        ethereum: createTestModule(['eth', 'pol'], evmAdapter),
        ripple: createTestModule(['xrp']),
        cardano: createTestModule(['ada']),
        solana: createTestModule(['sol', 'dsol'], solanaAdapter),
        stellar: createTestModule(['xlm']),
        tron: createTestModule(['trx']),
    },
});

const createAccount = (symbol: string, descriptor: string, overrides: Partial<Account> = {}) =>
    mockWalletAccount({
        symbol: asNetworkSymbol(symbol),
        descriptor: asAccountDescriptor(descriptor),
        ...overrides,
    });

const btcAddresses = {
    used: [
        {
            address: 'bc1-first',
            path: "m/84'/0'/0'/0/0",
            transfers: 1,
            balance: '0',
            sent: '0',
            received: '0',
        },
    ],
    unused: [],
    change: [],
};

describe('toWalletConnectAccount', () => {
    it('keeps only what network modules read', () => {
        const account = createAccount('btc', 'zpub', { addresses: btcAddresses, utxo: [] });

        expect(toWalletConnectAccount(account)).toEqual({
            symbol: 'btc',
            descriptor: 'zpub',
            path: account.path,
            visible: true,
            addresses: btcAddresses,
            utxo: [],
            unlockPath: undefined,
            identity: account.deviceState,
        });
    });
});

describe('getNamespaces', () => {
    it('offers the visible accounts in the namespace of their module', () => {
        const accounts = [
            createAccount('eth', '0xa'),
            createAccount('pol', '0xa'),
            createAccount('eth', '0xhidden', { visible: false }),
            createAccount('sol', 'solA'),
            createAccount('btc', 'zpub', { addresses: btcAddresses }),
            createAccount('test', 'tpub', { addresses: btcAddresses }),
            createAccount('xrp', 'rA'),
        ];

        expect(getNamespaces({ accounts, networkModuleRepository })).toEqual({
            bip122: {
                chains: ['bip122:btc'],
                accounts: ['bip122:btc:bc1-first'],
                methods: ['sendTransfer'],
                events: ['accountsChanged'],
            },
            eip155: {
                chains: ['eip155:1', 'eip155:137'],
                accounts: ['eip155:1:0xa', 'eip155:137:0xa'],
                methods: ['personal_sign'],
                events: ['chainChanged', 'accountsChanged'],
            },
            solana: {
                chains: ['solana:mainnet', 'solana:legacy'],
                accounts: ['solana:mainnet:solA', 'solana:legacy:solA'],
                methods: ['solana_signTransaction'],
                events: ['accountsChanged'],
            },
        });
    });

    it('offers an account once when it is listed twice', () => {
        const accounts = [createAccount('eth', '0xa'), createAccount('eth', '0xa')];

        expect(getNamespaces({ accounts, networkModuleRepository }).eip155?.accounts).toEqual([
            'eip155:1:0xa',
        ]);
    });

    it('leaves out accounts without an address to offer', () => {
        const accounts = [createAccount('btc', 'zpub')];

        expect(getNamespaces({ accounts, networkModuleRepository })).toEqual({});
    });
});

describe('getProposalNetworks', () => {
    it('resolves the requested chains to networks', () => {
        const accounts = [createAccount('eth', '0xa')];

        const networks = getProposalNetworks({
            accounts,
            networkModuleRepository,
            proposal: {
                requiredNamespaces: { eip155: { chains: ['eip155:1'], methods: [], events: [] } },
                optionalNamespaces: {
                    eip155: {
                        chains: ['eip155:1', 'eip155:137', 'eip155:5'],
                        methods: [],
                        events: [],
                    },
                    solana: {
                        chains: ['solana:mainnet', 'solana:legacy'],
                        methods: [],
                        events: [],
                    },
                    cosmos: { chains: ['cosmos:hub'], methods: [], events: [] },
                },
            },
        });

        expect(networks).toEqual([
            {
                namespaceId: 'eip155:1',
                symbol: 'eth',
                name: 'Ethereum',
                status: 'active',
                required: true,
            },
            {
                namespaceId: 'eip155:137',
                symbol: 'pol',
                name: 'Polygon PoS',
                status: 'inactive',
                required: false,
            },
            {
                namespaceId: 'eip155:5',
                symbol: undefined,
                name: 'Unknown (eip155:5)',
                status: 'unsupported',
                required: false,
            },
            {
                namespaceId: 'solana:mainnet',
                symbol: 'sol',
                name: 'Solana',
                status: 'inactive',
                required: false,
            },
        ]);
    });

    it('does not fail without optional namespaces', () => {
        expect(
            getProposalNetworks({
                accounts: [],
                networkModuleRepository,
                proposal: { requiredNamespaces: {} },
            }),
        ).toEqual([]);
    });
});

describe('getWalletConnectAdapterByMethod', () => {
    it('finds the module that owns the method', () => {
        const adapter = getWalletConnectAdapterByMethod({
            method: 'solana_signTransaction',
            networkModuleRepository,
        });

        expect(adapter?.namespaceId).toBe('solana');
        expect(
            getWalletConnectAdapterByMethod({ method: 'signPsbt', networkModuleRepository }),
        ).toBeUndefined();
    });
});

describe('getWalletConnectNamespaceId', () => {
    it.each([
        ['pol', 'eip155'],
        ['dsol', 'solana'],
        ['xrp', undefined],
        ['unknown', undefined],
    ])('returns the namespace of %s', (symbol, namespaceId) => {
        expect(
            getWalletConnectNamespaceId({
                symbol: asNetworkSymbol(symbol),
                networkModuleRepository,
            }),
        ).toBe(namespaceId);
    });
});
