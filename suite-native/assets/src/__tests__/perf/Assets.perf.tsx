import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { accountsActions, selectAccounts } from '@suite-common/wallet-core';
import {
    TestStore,
    act,
    initStore,
    measureRendersWithStoreProvider,
    screen,
} from '@suite-native/test-utils';

import { connectedDeviceBeforeDiscoveryState } from './fixtures/connectedDeviceBeforeDiscoveryState';
import { createAccountActions } from './fixtures/mockedDiscoveryFixtures';
import { AssetItem } from '../../components/AssetItem';
import { Assets } from '../../components/Assets';

// The test should not rely on the fiat services, so we mock it to avoid the delay.
jest.mock('@suite-common/fiat-services', () => ({
    fetchCurrentFiatRates: jest.fn().mockResolvedValue({}),
}));

describe('@suite-native/assets - components:', () => {
    it('Assets.tsx - while discovery', async () => {
        const store: TestStore = await initStore(connectedDeviceBeforeDiscoveryState);

        const revertScenarioStoreChanges = () => {
            const accounts = selectAccounts(store.getState());
            store.dispatch(accountsActions.removeAccount(accounts));
        };

        // Simulating discovery by creating account by account.
        const scenario = async () => {
            for (const [networkSymbol, createAccountAction] of Object.entries(
                createAccountActions,
            )) {
                act(() => {
                    store.dispatch(createAccountAction);
                });

                const { name: networkName } = getNetwork(networkSymbol as NetworkSymbol);
                await screen.findByText(networkName);
            }
        };

        await measureRendersWithStoreProvider(<Assets />, {
            store,
            scenario,
            afterEach: revertScenarioStoreChanges,
        });
    });

    it('AssetItem.tsx', async () => {
        const store: TestStore = await initStore(connectedDeviceBeforeDiscoveryState);
        store.dispatch(createAccountActions['eth']);

        await measureRendersWithStoreProvider(<AssetItem cryptoCurrencySymbol="eth" />, {
            store,
        });
    });
});
