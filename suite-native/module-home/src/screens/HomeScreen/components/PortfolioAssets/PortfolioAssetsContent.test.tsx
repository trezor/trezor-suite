import { Text } from 'react-native';

import { mockNetworksState } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { type StaticSessionId } from '@trezor/device-utils';

import { PortfolioAssetsContent } from './PortfolioAssetsContent';

type MockPortfolioAssetListItemProps = {
    assetKey: WalletAssetKey;
};

jest.mock('./PortfolioAssetsHeader', () => ({
    PortfolioAssetsHeader: () => null,
}));

jest.mock('./PortfolioAssetListItem', () => ({
    PortfolioAssetListItem: ({ assetKey }: MockPortfolioAssetListItemProps) => (
        <Text>{assetKey}</Text>
    ),
}));

const DEVICE_STATE = 'aliceWallet@device:0' as StaticSessionId;
const ETH = asNetworkSymbol('eth');
const ASSET_ROW = /^aliceWallet@device:0\//;

const getTokenContract = (index: number) =>
    `0x${index.toString(16).padStart(40, '0')}` as TokenAddress;

// The account's coin is one row, so `assetCount - 1` tokens make up the rest.
const createPreloadedState = (assetCount: number) => {
    const tokenContracts = Array.from({ length: Math.max(assetCount - 1, 0) }, (_, index) =>
        getTokenContract(index + 1),
    );

    return {
        device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
        wallet: {
            accounts:
                assetCount === 0
                    ? []
                    : [
                          mockWalletAccount({
                              symbol: ETH,
                              deviceState: DEVICE_STATE,
                              formattedBalance: '1',
                              tokens: tokenContracts.map(contract =>
                                  mockAccountToken({ contract, balance: '1' }),
                              ),
                          }),
                      ],
            settings: { enabledNetworks: [ETH], areHomeAssetSmallBalancesShown: true },
            fiat: { current: {}, lastWeek: {} },
        },
        tokenDefinitions: { [ETH]: { coin: { data: tokenContracts, hide: [], show: [] } } },
        networks: mockNetworksState([ETH]),
    };
};

const renderPortfolioAssetsContent = async (assetCount: number) =>
    await renderWithStoreProvider(<PortfolioAssetsContent />, {
        preloadedState: createPreloadedState(assetCount),
    });

describe('PortfolioAssetsContent', () => {
    it('hides the assets section header when there are no assets', async () => {
        await renderPortfolioAssetsContent(0);

        expect(screen.queryByText(getTranslation('moduleHome.assets.title'))).toBeNull();
        expect(screen.queryByTestId('@home/portfolio-assets/view-options-button')).toBeNull();
        expect(screen.queryByTestId('@home/portfolio-assets/show-more')).toBeNull();
    });

    it.each([7, 8])('renders all %i assets without the show more button', async count => {
        await renderPortfolioAssetsContent(count);

        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(count);
        expect(screen.getByText(getTranslation('moduleHome.assets.title'))).toBeTruthy();
        expect(screen.queryByTestId('@home/portfolio-assets/show-more')).toBeNull();
    });

    it('folds more than 8 assets and toggles between show more and show less', async () => {
        await renderPortfolioAssetsContent(9);

        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(8);

        fireEvent.press(screen.getByText(getTranslation('moduleHome.assets.showMore')));

        expect(await screen.findByText(getTranslation('moduleHome.assets.showLess'))).toBeTruthy();
        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(9);

        fireEvent.press(screen.getByText(getTranslation('moduleHome.assets.showLess')));

        expect(await screen.findByText(getTranslation('moduleHome.assets.showMore'))).toBeTruthy();
        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(8);
    });
});
