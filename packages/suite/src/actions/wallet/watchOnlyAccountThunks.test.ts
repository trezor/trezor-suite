import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type NetworksRootState } from '@suite-common/networks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { WATCH_ONLY_ACCOUNT_TYPE, asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type AccountInfo } from '@trezor/blockchain-link-types';
import TrezorConnect from '@trezor/connect';
import { mock } from '@trezor/dependency-injection';

import { addWatchOnlyAccountThunk, removeWatchOnlyAccountThunk } from './watchOnlyAccountThunks';

const ethSymbol = asNetworkSymbol('eth');

const createStore = () => {
    const services: DesktopAnalyticsDep = {
        analytics: mockDesktopAnalytics(mock<DesktopAnalyticsDep['analytics']['report']>()),
    };
    const { store } = createTestCompositionRoot<
        { services: DesktopAnalyticsDep },
        AccountsRootState & NetworksRootState
    >({
        preloadedState: { wallet: { accounts: [] }, networks: null },
        services: () => services,
    }).services;

    return { store, report: jest.mocked(services.analytics.report) };
};

describe('watch-only account analytics', () => {
    afterEach(() => jest.restoreAllMocks());

    it('reports only the network of an added account', async () => {
        const payload: AccountInfo = {
            descriptor: '0xAbCd',
            balance: '5',
            availableBalance: '5',
            empty: false,
            history: { total: 1, unconfirmed: 0 },
        };
        // spyOn types the mock by the last (bundled) overload.
        jest.spyOn(TrezorConnect, 'getAccountInfo').mockImplementation((() =>
            Promise.resolve({
                success: true,
                payload,
            })) as unknown as typeof TrezorConnect.getAccountInfo);
        const { store, report } = createStore();

        await store.dispatch(
            addWatchOnlyAccountThunk({
                address: '0xAbCd',
                symbol: ethSymbol,
                device: mockSuiteDevice({ state: { staticSessionId: 'wallet@device:0' } }),
            }),
        );

        expect(report).toHaveBeenCalledWith({
            type: 'accounts/watch-account-added',
            payload: { symbol: 'eth' },
        });
    });

    it('reports only the network of a removed account', async () => {
        const { store, report } = createStore();

        await store.dispatch(
            removeWatchOnlyAccountThunk({
                account: mockWalletAccount({
                    symbol: ethSymbol,
                    accountType: WATCH_ONLY_ACCOUNT_TYPE,
                }),
            }),
        );

        expect(report).toHaveBeenCalledWith({
            type: 'accounts/watch-account-removed',
            payload: { symbol: 'eth' },
        });
    });
});
