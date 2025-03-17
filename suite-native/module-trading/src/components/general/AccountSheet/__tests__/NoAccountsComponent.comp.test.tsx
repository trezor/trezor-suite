import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { NoAccountsComponent } from '../NoAccountsComponent';

describe('NoAccountsComponent', () => {
    const renderNoAccountsComponent = ({ isConnected }: { isConnected: boolean }) =>
        renderWithStoreProviderAsync(<NoAccountsComponent isBottomRounded />, {
            preloadedState: {
                device: {
                    selectedDevice: {
                        remember: true,
                        connected: isConnected,
                    },
                },
            },
        });

    it('should render for not connected device', async () => {
        const { queryByText } = await renderNoAccountsComponent({ isConnected: false });

        expect(queryByText('You need to connect your device to add new account.')).toBeDefined();
    });

    it('should render for no account but connected device', async () => {
        const { queryByText } = await renderNoAccountsComponent({ isConnected: true });

        expect(
            queryByText("It seems that you don't have any account matching selected asset."),
        ).toBeDefined();
    });
});
