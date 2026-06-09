import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { NoAccountsComponent } from '../NoAccountsComponent';

describe('NoAccountsComponent', () => {
    const renderNoAccountsComponent = ({
        isConnected,
        id,
    }: {
        isConnected: boolean;
        id?: string;
    }) =>
        renderWithStoreProvider(<NoAccountsComponent isBottomRounded />, {
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

    it('should render for not connected device', () => {
        const { queryByText } = renderNoAccountsComponent({ isConnected: false });

        expect(
            queryByText(
                getTranslation('moduleTrading.accountScreen.accountEmpty.viewOnly.description'),
            ),
        ).toBeTruthy();
    });

    it('should render for no account but connected device', () => {
        const { queryByText } = renderNoAccountsComponent({ isConnected: true });

        expect(
            queryByText(
                getTranslation(
                    'moduleTrading.accountScreen.accountEmpty.networkNotEnabled.description',
                ),
            ),
        ).toBeTruthy();
    });

    it('should render for portfolio tracker', () => {
        const { queryByText } = renderNoAccountsComponent({
            isConnected: false,
            id: 'hiddenDeviceWithImportedAccounts',
        });

        expect(
            queryByText(
                getTranslation(
                    'moduleTrading.accountScreen.accountEmpty.portfolioTracker.description',
                ),
            ),
        ).toBeTruthy();
    });
});
