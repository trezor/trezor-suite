import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { messages } from '@suite/intl';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type WithServices } from '@trezor/redux-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetSendReceive } from './AssetSendReceive';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

const mockStartSend = jest.fn();
const mockStartReceive = jest.fn();
const mockReport = jest.fn();

jest.mock('./hooks/useStartSendReceiveWithAnalytics', () => ({
    useStartSendReceiveWithAnalytics: () => ({
        startSend: mockStartSend,
        startReceive: mockStartReceive,
    }),
}));
jest.mock('./GlobalSendModal/GlobalSendModal', () => ({
    GlobalSendModal: () => <div data-testid="@test/global-send-modal" />,
}));
jest.mock('./GlobalReceiveModal/GlobalReceiveModal', () => ({
    GlobalReceiveModal: () => <div data-testid="@test/global-receive-modal" />,
}));

const ethSymbol = asNetworkSymbol('eth');
const deviceState = '1stTestnetAddress@device_id:0';
const ethKey = getWalletAssetKey({ deviceState, symbol: ethSymbol });

const ethAccount = (index: number) =>
    mockWalletAccount({
        symbol: ethSymbol,
        index,
        descriptor: asAccountDescriptor(`eth${index}`),
        balance: '1',
        formattedBalance: '1',
    });

const renderAssetSendReceive = (accounts: Account[]) => {
    const device = mockSuiteDevice({ state: { staticSessionId: deviceState } });
    const { services } = createTestCompositionRoot<WithServices<DesktopAnalyticsDep>, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            device: { ...mockInitialAppState.device, devices: [device], selectedDevice: device },
            networks: mockNetworksState([ethSymbol]),
            wallet: { ...mockInitialAppState.wallet, accounts },
        },
        services: () => ({ analytics: mockDesktopAnalytics(mockReport) }),
    });

    renderWithProviders(services, <AssetSendReceive assetKey={ethKey} />);

    return userEvent.setup();
};

const clickSend = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole('button', { name: messages.TR_NAV_SEND.defaultMessage }));

const clickReceive = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole('button', { name: messages.TR_NAV_RECEIVE.defaultMessage }));

describe('AssetSendReceive', () => {
    beforeEach(() => jest.clearAllMocks());

    it('starts sending from the only account holding the asset without a modal', async () => {
        const holding = ethAccount(0);
        const user = renderAssetSendReceive([holding]);

        await clickSend(user);

        expect(mockStartSend).toHaveBeenCalledWith({
            account: holding,
            contractAddress: undefined,
        });
        expect(screen.queryByTestId('@test/global-send-modal')).not.toBeInTheDocument();
        expect(mockReport).not.toHaveBeenCalled();
    });

    it('opens the send modal when more accounts hold the asset', async () => {
        const user = renderAssetSendReceive([ethAccount(0), ethAccount(1)]);

        await clickSend(user);

        expect(screen.getByTestId('@test/global-send-modal')).toBeInTheDocument();
        expect(mockStartSend).not.toHaveBeenCalled();
        expect(mockReport).toHaveBeenCalledWith({
            type: events.dashboardSendModalEvent.name,
            payload: { source: 'asset-header' },
        });
    });

    it('starts receiving to the only account on the network without a modal', async () => {
        const account = ethAccount(0);
        const user = renderAssetSendReceive([account]);

        await clickReceive(user);

        expect(mockStartReceive).toHaveBeenCalledWith(account);
        expect(screen.queryByTestId('@test/global-receive-modal')).not.toBeInTheDocument();
        expect(mockReport).not.toHaveBeenCalled();
    });

    it('opens the receive modal when more accounts are on the network', async () => {
        const user = renderAssetSendReceive([ethAccount(0), ethAccount(1)]);

        await clickReceive(user);

        expect(screen.getByTestId('@test/global-receive-modal')).toBeInTheDocument();
        expect(mockStartReceive).not.toHaveBeenCalled();
        expect(mockReport).toHaveBeenCalledWith({
            type: events.dashboardReceiveModalEvent.name,
            payload: { source: 'asset-header' },
        });
    });
});
