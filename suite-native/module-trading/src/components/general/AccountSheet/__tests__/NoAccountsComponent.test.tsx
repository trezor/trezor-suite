import { renderWithStore, waitFor } from '@suite-native/test-utils';

import { NoAccountsComponent } from '../NoAccountsComponent';

describe('NoAccountsComponent', () => {
    const renderNoAccountsComponent = async ({ isConnected }: { isConnected: boolean }) => {
        const result = renderWithStore(<NoAccountsComponent isBottomRounded />, {
            preloadedState: {
                device: {
                    selectedDevice: {
                        remember: true,
                        connected: isConnected,
                    },
                },
            },
        });
        await waitFor(() => expect(result.getByText('No account found')).toBeDefined());

        return result;
    };

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
