import {
    asNetworkSymbol,
    getNetworkOptional,
    isNetworkSymbol,
    unregisterLegacyNetwork,
} from '@suite-common/wallet-config';
import {
    type ExplorerConfig,
    type ExplorerItem,
    blockchainInitialState,
    explorerInitialState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import {
    type Blockchain,
    type BlockchainNetworks,
    type CustomEvmNetworkDefinition,
} from '@suite-common/wallet-types';

import { storageLoad } from 'src/actions/suite/storageLifecycleActions';
import { blockchainReducer, explorerReducer, walletSettingsReducer } from 'src/reducers/wallet';

import { loadStoragePayload } from './loadStoragePayload';
import { createInMemoryDbMock } from '../../mocks/createInMemoryDbMock';

const symbol = asNetworkSymbol('evm4242');
const definition: CustomEvmNetworkDefinition = {
    symbol,
    chainId: 4242,
    name: 'Custom Chain',
    displaySymbol: 'CST',
    currencyName: 'Custom Token',
    rpcUrls: ['https://rpc.custom.example'],
    explorerUrl: 'https://explorer.custom.example',
    testnet: false,
};
// A stored definition must never be able to shadow a bundled network.
const bundledLookalike: CustomEvmNetworkDefinition = {
    ...definition,
    symbol: asNetworkSymbol('eth'),
    name: 'Fake Ethereum',
};

// The registry types are closed over the bundled symbols, so a custom symbol is read through an open view.
const asOpenBlockchain = (state: BlockchainNetworks): Record<string, Blockchain | undefined> =>
    state;
const asOpenExplorer = (state: ExplorerConfig): Record<string, ExplorerItem | undefined> => state;

const createDb = () => createInMemoryDbMock({ dispatch: jest.fn(), reloadApp: jest.fn() });

describe(loadStoragePayload.name, () => {
    afterEach(() => {
        if (isNetworkSymbol(symbol)) {
            unregisterLegacyNetwork(symbol);
        }
    });

    it('registers stored custom networks before computing the supported ones', async () => {
        const db = createDb();
        await db.addItem(
            'walletSettings',
            {
                ...initialWalletSettingsState,
                enabledNetworks: [symbol],
                customEvmNetworks: [definition, bundledLookalike],
            },
            'wallet',
            true,
        );

        const payload = await loadStoragePayload(db);

        expect(payload.supportedNetworks).toContain(symbol);
        expect(getNetworkOptional(symbol)?.chainId).toBe(4242);
        expect(getNetworkOptional('eth')?.name).not.toBe('Fake Ethereum');
        expect(payload.walletSettings?.customEvmNetworks).toEqual([definition]);

        await db.removeDatabase();
    });

    it('keeps the enabled flag and seeds the per-network state of custom networks', async () => {
        const db = createDb();
        await db.addItem(
            'walletSettings',
            {
                ...initialWalletSettingsState,
                enabledNetworks: [symbol],
                customEvmNetworks: [definition],
            },
            'wallet',
            true,
        );
        await db.addItem(
            'backendSettings',
            { selected: 'evm-rpc', urls: { 'evm-rpc': ['https://my.rpc.example'] } },
            symbol,
            true,
        );
        const action = storageLoad(await loadStoragePayload(db));

        const settings = walletSettingsReducer(initialWalletSettingsState, action);
        const blockchain = asOpenBlockchain(blockchainReducer(blockchainInitialState, action));
        const explorer = asOpenExplorer(explorerReducer(explorerInitialState, action));

        expect(settings.enabledNetworks).toEqual([symbol]);
        expect(settings.customEvmNetworks).toEqual([definition]);
        expect(blockchain[symbol]?.backends).toEqual({
            selected: 'evm-rpc',
            urls: { 'evm-rpc': ['https://my.rpc.example'] },
        });
        expect(explorer[symbol]?.default.base).toBe('https://explorer.custom.example');

        await db.removeDatabase();
    });

    it('drops a stored custom network that fails to register instead of failing to load', async () => {
        const db = createDb();
        const malformed = {
            ...definition,
            symbol: asNetworkSymbol('evm4343'),
            explorerUrl: undefined,
        } as unknown as CustomEvmNetworkDefinition;
        await db.addItem(
            'walletSettings',
            { ...initialWalletSettingsState, customEvmNetworks: [malformed, definition] },
            'wallet',
            true,
        );
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        const payload = await loadStoragePayload(db);

        expect(payload.walletSettings?.customEvmNetworks).toEqual([definition]);
        expect(isNetworkSymbol('evm4343')).toBe(false);

        await db.removeDatabase();
    });

    it('loads a storage written before custom networks existed', async () => {
        const db = createDb();
        const { customEvmNetworks: _, ...legacySettings } = initialWalletSettingsState;
        await db.addItem(
            'walletSettings',
            legacySettings as typeof initialWalletSettingsState,
            'wallet',
            true,
        );

        const payload = await loadStoragePayload(db);

        expect(payload.walletSettings?.customEvmNetworks).toEqual([]);

        await db.removeDatabase();
    });
});
