import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';
import {
    createStoreFromPreloadedState,
    fireEvent,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';

import { AssetDetailHiddenBanner } from './AssetDetailHiddenBanner';

const DEVICE_STATE = 'aliceWallet@device:0';
const ETH = asNetworkSymbol('eth');
const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

const mockRouteParams: AssetsStackParamList[AssetsStackRoutes.AssetDetail] = {
    networkSymbol: ETH,
    tokenContract: USDC_CONTRACT,
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: mockRouteParams }),
}));

const ethereumAccount: Account = mockWalletAccount({
    symbol: ETH,
    deviceState: DEVICE_STATE,
    tokens: [
        mockAccountToken({
            contract: USDC_CONTRACT,
            symbol: 'USDC',
            decimals: 6,
            balance: '720',
        }),
    ],
});

const createPreloadedState = ({
    knownContracts,
    hiddenContracts = [],
}: {
    knownContracts: TokenAddress[] | undefined;
    hiddenContracts?: TokenAddress[];
}) => ({
    device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
    wallet: { accounts: [ethereumAccount] },
    tokenDefinitions: {
        [ETH]: { coin: { data: knownContracts, hide: hiddenContracts, show: [] } },
    },
});

describe('AssetDetailHiddenBanner', () => {
    it('renders nothing for an asset that is shown', async () => {
        await renderWithStoreProvider(<AssetDetailHiddenBanner />, {
            preloadedState: createPreloadedState({ knownContracts: [USDC_CONTRACT] }),
        });

        expect(screen.queryByTestId('@asset-detail/suspicious-token-banner')).toBeNull();
        expect(screen.queryByTestId('@asset-detail/hidden-token-banner')).toBeNull();
    });

    it('warns about an unrecognized token', async () => {
        await renderWithStoreProvider(<AssetDetailHiddenBanner />, {
            preloadedState: createPreloadedState({ knownContracts: [] }),
        });

        expect(screen.getByTestId('@asset-detail/suspicious-token-banner')).toBeTruthy();
        expect(
            screen.getByText(
                getTranslation('moduleAssets.assetDetailScreen.hiddenBanner.suspiciousTitle'),
            ),
        ).toBeTruthy();
        expect(
            screen.queryByText(getTranslation('moduleAccountManagement.tokenSettings.showToken')),
        ).toBeNull();
    });

    it('does not warn about a token the user hid before the coin definitions load', async () => {
        await renderWithStoreProvider(<AssetDetailHiddenBanner />, {
            preloadedState: createPreloadedState({
                knownContracts: undefined,
                hiddenContracts: [USDC_CONTRACT],
            }),
        });

        expect(screen.queryByTestId('@asset-detail/suspicious-token-banner')).toBeNull();
        expect(screen.queryByTestId('@asset-detail/hidden-token-banner')).toBeNull();
    });

    it('shows a token the user hid when asked to', async () => {
        const store = createStoreFromPreloadedState(
            createPreloadedState({
                knownContracts: [USDC_CONTRACT],
                hiddenContracts: [USDC_CONTRACT],
            }),
        );
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        await renderWithStoreProvider(<AssetDetailHiddenBanner />, { services: { store } });

        expect(screen.getByTestId('@asset-detail/hidden-token-banner')).toBeTruthy();

        fireEvent.press(
            screen.getByText(getTranslation('moduleAccountManagement.tokenSettings.showToken')),
        );

        expect(dispatchSpy).toHaveBeenCalledWith(
            tokenDefinitionsActions.setTokenStatus({
                symbol: ETH,
                contractAddress: USDC_CONTRACT,
                status: TokenManagementAction.SHOW,
                type: DefinitionType.COIN,
            }),
        );
    });
});
