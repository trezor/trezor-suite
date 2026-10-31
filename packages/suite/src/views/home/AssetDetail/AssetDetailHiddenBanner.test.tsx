import '@suite-common/test-utils/globalOverrides';

import { type Reducer } from '@reduxjs/toolkit';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { initialState as selectedAccountInitialState } from '@suite/account';
import { selectWalletAssetKey } from '@suite-common/assets';
import { mockNetworkIcon, mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { prepareTokenDefinitionsReducer } from '@suite-common/token-definitions';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';
import { extraDependencies } from 'src/support/extraDependencies';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetDetailHiddenBanner } from './AssetDetailHiddenBanner';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const networkIcon = mockNetworkIcon();

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const ETH = asNetworkSymbol('eth');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const UNKNOWN_TOKEN = '0x1111111111111111111111111111111111111111' as TokenAddress;

const SUSPICIOUS_BANNER = '@asset-detail/suspicious-token-banner';
const HIDDEN_BANNER = '@asset-detail/hidden-token-banner';

const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);

const ethereumAccount = mockWalletAccount({
    symbol: ETH,
    formattedBalance: '2',
    tokens: [
        mockAccountToken({
            name: 'USD Coin',
            symbol: 'USDC',
            contract: USDC_ON_ETH,
            balance: '2400',
        }),
        mockAccountToken({ contract: UNKNOWN_TOKEN, balance: '5' }),
    ],
});

const getInitialState = (hiddenTokens: TokenAddress[]): AppState => ({
    ...mockInitialAppState,
    networks: mockNetworksState([ETH]),
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    tokenDefinitions: {
        [ETH]: {
            coin: {
                data: [USDC_ON_ETH],
                error: false,
                isLoading: false,
                hide: hiddenTokens,
                show: [],
            },
        },
    },
    wallet: {
        ...mockInitialAppState.wallet,
        selectedAccount: selectedAccountInitialState,
        accounts: [ethereumAccount] satisfies Account[],
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: [ETH],
        },
    },
});

type RenderBannerParams = {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    hiddenTokens?: TokenAddress[];
};

const renderBanner = ({ symbol, contractAddress, hiddenTokens = [] }: RenderBannerParams) => {
    const initialState = getInitialState(hiddenTokens);
    const reducer: Reducer<AppState> = (state = initialState, action) => ({
        ...state,
        tokenDefinitions: tokenDefinitionsReducer(state.tokenDefinitions, action),
    });
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: initialState,
        reducer,
    });
    const assetKey = selectWalletAssetKey(services.store.getState(), symbol, contractAddress);

    if (assetKey === undefined) {
        throw new Error('The asset is not in the wallet.');
    }

    renderWithProviders(
        { ...services, networks: { networkIcon } },
        <AssetDetailHiddenBanner assetKey={assetKey} />,
    );

    return services;
};

describe('AssetDetailHiddenBanner', () => {
    it('says nothing about a token in the asset list', () => {
        renderBanner({ symbol: ETH, contractAddress: USDC_ON_ETH });

        expect(screen.queryByTestId(SUSPICIOUS_BANNER)).not.toBeInTheDocument();
        expect(screen.queryByTestId(HIDDEN_BANNER)).not.toBeInTheDocument();
    });

    it('says nothing about the network coin', () => {
        renderBanner({ symbol: ETH });

        expect(screen.queryByTestId(SUSPICIOUS_BANNER)).not.toBeInTheDocument();
        expect(screen.queryByTestId(HIDDEN_BANNER)).not.toBeInTheDocument();
    });

    it('warns about a token nothing vouches for, without offering to show it', () => {
        renderBanner({ symbol: ETH, contractAddress: UNKNOWN_TOKEN });

        expect(screen.getByTestId(SUSPICIOUS_BANNER)).toBeInTheDocument();
        expect(screen.queryByTestId(`${HIDDEN_BANNER}/show`)).not.toBeInTheDocument();
    });

    it('offers to show a token the user hid, and goes away once it is shown', async () => {
        const services = renderBanner({
            symbol: ETH,
            contractAddress: USDC_ON_ETH,
            hiddenTokens: [USDC_ON_ETH],
        });

        await userEvent.click(screen.getByTestId(`${HIDDEN_BANNER}/show`));

        await waitFor(() => {
            expect(screen.queryByTestId(HIDDEN_BANNER)).not.toBeInTheDocument();
        });
        expect(services.store.getState().tokenDefinitions[ETH]?.coin?.hide).toEqual([]);
    });
});
