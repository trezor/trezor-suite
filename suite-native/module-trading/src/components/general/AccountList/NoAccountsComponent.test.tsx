import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { NoAccountsComponent } from './NoAccountsComponent';

const btcSymbol = asNetworkSymbol('btc');

describe('NoAccountsComponent', () => {
    const renderNoAccountsComponent = async ({
        isConnected,
        id,
        onActivateAccount = jest.fn(),
    }: {
        isConnected: boolean;
        id?: string;
        onActivateAccount?: () => void;
    }) =>
        await renderWithStoreProvider(
            <NoAccountsComponent symbol={btcSymbol} onActivateAccount={onActivateAccount} />,
            {
                preloadedState: {
                    device: {
                        selectedDevice: {
                            remember: true,
                            connected: isConnected,
                            id,
                        },
                    },
                },
            },
        );

    it('renders the connected-device state and activates the configured network', async () => {
        const onActivateAccount = jest.fn();
        const { getByText } = await renderNoAccountsComponent({
            isConnected: true,
            onActivateAccount,
        });

        expect(
            getByText(getTranslation('moduleTrading.accountScreen.accountEmpty.title')),
        ).toBeTruthy();
        expect(
            getByText(
                getTranslation(
                    'moduleTrading.accountScreen.accountEmpty.networkNotEnabled.noAccountDescription',
                ),
            ),
        ).toBeTruthy();

        await fireEvent.press(
            getByText(
                getTranslation('moduleTrading.accountScreen.accountEmpty.activate', {
                    network: 'Bitcoin',
                }),
            ),
        );

        expect(onActivateAccount).toHaveBeenCalledTimes(1);
    });

    it('renders the view-only explanation without activation', async () => {
        const { getByText, queryByText } = await renderNoAccountsComponent({ isConnected: false });

        expect(
            getByText(
                getTranslation('moduleTrading.accountScreen.accountEmpty.viewOnly.description'),
            ),
        ).toBeTruthy();
        expect(
            queryByText(
                getTranslation('moduleTrading.accountScreen.accountEmpty.activate', {
                    network: 'Bitcoin',
                }),
            ),
        ).toBeNull();
    });

    it('renders the Portfolio Tracker explanation without activation', async () => {
        const { getByText, queryByText } = await renderNoAccountsComponent({
            isConnected: false,
            id: 'hiddenDeviceWithImportedAccounts',
        });

        expect(
            getByText(
                getTranslation(
                    'moduleTrading.accountScreen.accountEmpty.portfolioTracker.description',
                ),
            ),
        ).toBeTruthy();
        expect(
            queryByText(
                getTranslation('moduleTrading.accountScreen.accountEmpty.activate', {
                    network: 'Bitcoin',
                }),
            ),
        ).toBeNull();
    });
});
