import '@suite-common/test-utils/globalOverrides';

import { suiteSettingsInitialState } from '@suite/settings';
import { configureMockStore, screen } from '@suite-common/test-utils';

import { extraDependenciesDesktopMock } from 'src/support/tests/extraDependenciesDesktop.mock';
import { renderWithProviders } from 'src/support/tests/hooksHelper';

import { WatchOnlyAccounts } from '../WatchOnlyAccounts';

describe(WatchOnlyAccounts.name, () => {
    it('keeps the network import form available when no networks are enabled', () => {
        const store = configureMockStore({
            preloadedState: {
                suiteSettings: suiteSettingsInitialState,
                wallet: { accounts: [], settings: { enabledNetworks: [] } },
            },
        });
        renderWithProviders(store, extraDependenciesDesktopMock.services, <WatchOnlyAccounts />);

        expect(screen.getByTestId('@settings/debug/watch-only/network/input')).toBeEnabled();
        expect(screen.getByText('Ethereum')).toBeInTheDocument();
        expect(screen.getByTestId('@settings/debug/watch-only/identifier')).toBeEnabled();
    });
});
