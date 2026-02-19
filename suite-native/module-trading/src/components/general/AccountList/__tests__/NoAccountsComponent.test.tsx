import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { NoAccountsComponent } from '../NoAccountsComponent';

describe('NoAccountsComponent', () => {
    const renderNoAccountsComponent = ({
        isConnected,
        id,
    }: {
        isConnected: boolean;
        id?: string;
    }) =>
        renderWithStoreProviderAsync(<NoAccountsComponent isBottomRounded />, {
            preloadedState: {
                device: {
                    selectedDevice: {
                        remember: true,
                        connected: isConnected,
                        id,
                    },
                },
            },
        });

    it('should render for not connected device', async () => {
        const { queryByText } = await renderNoAccountsComponent({ isConnected: false });

        expect(queryByText('You need to connect your device to add new account.')).toBeTruthy();
    });

    it('should render for no account but connected device', async () => {
        const { queryByText } = await renderNoAccountsComponent({ isConnected: true });

        expect(
            queryByText('It seems that you don’t have any account matching selected asset.'),
        ).toBeTruthy();
    });

    it('should render for portfolio tracker', async () => {
        const { queryByText } = await renderNoAccountsComponent({
            isConnected: false,
            id: 'hiddenDeviceWithImportedAccounts',
        });

        expect(
            queryByText('You don’t have an account for this asset imported in Portfolio Tracker.'),
        ).toBeTruthy();
    });
});
