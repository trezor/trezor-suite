import {
    type DesktopSuiteSyncRootState,
    initialSuiteSyncDesktopState,
    prepareSuiteSyncReducer,
} from '@suite/suite-sync';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WithServices } from '@trezor/redux-utils';

import { resetCustomServersThunk } from 'src/actions/suite/suiteThunks';
import { walletReducers } from 'src/reducers/wallet';
import { type Db, type DbDep } from 'src/storage/createDb';

import { createInMemoryDbMock } from '../../../mocks/createInMemoryDbMock';

type State = DesktopSuiteSyncRootState & {
    networks: ReturnType<typeof mockNetworksState>;
    wallet: ReturnType<typeof walletReducers>;
};

const suiteSyncReducer = prepareSuiteSyncReducer(undefined);

const btc = asNetworkSymbol('btc');
const ltc = asNetworkSymbol('ltc');
const regtest = asNetworkSymbol('regtest');
const customRelayUrl = 'wss://relay.example';
const customBackend: State['wallet']['blockchain']['btc']['backends'] = {
    selected: 'electrum',
    urls: { electrum: ['unreachable.example:50001:t'] },
};

const getInitialState = (): State => {
    const wallet = walletReducers(undefined, { type: 'test-init' });

    return {
        networks: mockNetworksState([btc, ltc, regtest]),
        wallet: {
            ...wallet,
            settings: { ...wallet.settings, enabledNetworks: [btc] },
            blockchain: {
                ...wallet.blockchain,
                btc: { ...wallet.blockchain.btc, backends: customBackend },
                // custom backend of a disabled network
                ltc: { ...wallet.blockchain.ltc, backends: customBackend },
            },
        },
        suiteSync: {
            ...initialSuiteSyncDesktopState,
            settings: {
                ...initialSuiteSyncDesktopState.settings,
                suiteSyncRelayUrl: customRelayUrl,
            },
        },
    };
};

const setup = (db: Db) => {
    const preloadedState = getInitialState();
    const { store } = createTestCompositionRoot<WithServices<DbDep>, State>({
        reducer: (state = preloadedState, action) => ({
            ...state,
            wallet: walletReducers(state.wallet, action),
            suiteSync: suiteSyncReducer(state.suiteSync, action),
        }),
        preloadedState,
        services: () => ({ db }),
    }).services;

    return { store };
};

describe('resetCustomServersThunk', () => {
    const setupWithStoredSettings = async () => {
        const db = createInMemoryDbMock({ dispatch: jest.fn(), reloadApp: jest.fn() });
        await db.addItem('backendSettings', customBackend, btc, true);
        await db.addItem('backendSettings', customBackend, ltc, true);
        await db.addItem(
            'suiteSyncSettings',
            { ...getInitialState().suiteSync.settings },
            'suiteSyncSettings',
            true,
        );

        return { db, ...setup(db) };
    };

    it('resets the custom backends of all networks and the relay, and persists them', async () => {
        const { db, store } = await setupWithStoredSettings();

        await store.dispatch(resetCustomServersThunk());

        const { blockchain } = store.getState().wallet;
        expect(blockchain.btc.backends.selected).toBeUndefined();
        expect(blockchain.ltc.backends.selected).toBeUndefined();
        expect(store.getState().suiteSync.settings.suiteSyncRelayUrl).toBeNull();
        expect((await db.getItemByPK('backendSettings', btc))?.selected).toBeUndefined();
        expect((await db.getItemByPK('backendSettings', ltc))?.selected).toBeUndefined();
        expect(
            (await db.getItemByPK('suiteSyncSettings', 'suiteSyncSettings'))?.suiteSyncRelayUrl,
        ).toBeNull();
    });

    it('keeps the backend regtest ships with', async () => {
        const { store } = await setupWithStoredSettings();

        await store.dispatch(resetCustomServersThunk());

        expect(store.getState().wallet.blockchain.regtest.backends.selected).toBe('blockbook');
    });
});
