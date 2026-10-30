import '@suite-common/test-utils/globalOverrides';

import { type Reducer } from '@reduxjs/toolkit';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { initialState as selectedAccountInitialState } from '@suite/account';
import { type GotoThunkDeps, routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
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

import { AssetDetailMenu } from './AssetDetailMenu';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const networkIcon = mockNetworkIcon();

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');
const XRP = asNetworkSymbol('xrp');
const ADA = asNetworkSymbol('ada');

const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const HOSKY_POLICY_ID = 'a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235';
const HOSKY_ON_ADA = `${HOSKY_POLICY_ID}484f534b59` as TokenAddress;
const HOSKY_FINGERPRINT = 'asset17q7r59zlc3dgw0venc80pdv566q6yguw03f0d9';

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
    ],
});

const UNKNOWN_TOKEN = '0x1111111111111111111111111111111111111111' as TokenAddress;

const unrecognizedTokenAccount = mockWalletAccount({
    symbol: ETH,
    formattedBalance: '2',
    tokens: [mockAccountToken({ contract: UNKNOWN_TOKEN, balance: '5' })],
});

const bitcoinAccount = mockWalletAccount({ symbol: BTC, formattedBalance: '0.1' });
const rippleAccount = mockWalletAccount({ symbol: XRP, formattedBalance: '50' });
const cardanoAccount = mockWalletAccount({
    symbol: ADA,
    formattedBalance: '100',
    tokens: [
        mockAccountToken({
            name: 'HOSKY Token',
            symbol: 'HOSKY',
            contract: HOSKY_ON_ADA,
            balance: '1000000',
            policyId: HOSKY_POLICY_ID,
            fingerprint: HOSKY_FINGERPRINT,
        }),
    ],
});

const getInitialState = (accounts: Account[]): AppState => ({
    ...mockInitialAppState,
    networks: mockNetworksState([BTC, ETH, XRP, ADA]),
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    tokenDefinitions: {
        [ETH]: {
            coin: { data: [USDC_ON_ETH], error: false, isLoading: false, hide: [], show: [] },
        },
        [ADA]: {
            coin: { data: [HOSKY_POLICY_ID], error: false, isLoading: false, hide: [], show: [] },
        },
    },
    wallet: {
        ...mockInitialAppState.wallet,
        selectedAccount: selectedAccountInitialState,
        accounts,
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: [BTC, ETH, XRP, ADA],
        },
    },
});

const renderMenu = (accounts: Account[], symbol: NetworkSymbol, contractAddress?: TokenAddress) => {
    const initialState = getInitialState(accounts);
    const reducer: Reducer<AppState> = (state = initialState, action) => ({
        ...state,
        router: routerReducer(state.router, action),
        tokenDefinitions: tokenDefinitionsReducer(state.tokenDefinitions, action),
    });
    const { services } = createTestCompositionRoot<GotoThunkDeps, AppState>({
        preloadedState: initialState,
        reducer,
        services: () => ({ suiteRouterHistory: mockSuiteRouterHistory() }),
    });
    const assetKey = selectWalletAssetKey(services.store.getState(), symbol, contractAddress);

    if (assetKey === undefined) {
        throw new Error('The asset is not in the wallet.');
    }

    renderWithProviders(
        { ...services, networks: { networkIcon } },
        <AssetDetailMenu assetKey={assetKey} />,
    );

    return services;
};

const openMenu = async () => {
    await userEvent.click(screen.getByTestId('@asset-detail/menu'));
    await screen.findByTestId('@asset-detail/menu/accounts');
};

describe('AssetDetailMenu', () => {
    it('describes a token with its network, accounts and contract, and offers every action', async () => {
        renderMenu([ethereumAccount, bitcoinAccount], ETH, USDC_ON_ETH);

        await openMenu();

        expect(screen.getByTestId('@asset-detail/menu/network')).toHaveTextContent('Ethereum');
        expect(screen.getByTestId('@asset-detail/menu/accounts')).toHaveTextContent('1');
        expect(screen.getByTestId('@asset-detail/menu/contract')).toHaveTextContent(
            '0xa0b86991...3606eb48',
        );
        expect(screen.getByTestId('@asset-detail/menu/sign-verify')).toBeInTheDocument();
        expect(screen.getByTestId('@asset-detail/menu/walletconnect')).toBeInTheDocument();
        expect(screen.getByTestId('@asset-detail/menu/hide-token')).toBeInTheDocument();
        expect(screen.getByTestId('@asset-detail/menu/explorer')).toBeInTheDocument();
    });

    it('copies the whole contract when the shortened one is copied by hand', async () => {
        renderMenu([ethereumAccount], ETH, USDC_ON_ETH);
        const setData = jest.fn();

        await openMenu();
        fireEvent.copy(screen.getByTestId('@asset-detail/menu/contract'), {
            clipboardData: { setData },
        });

        expect(setData).toHaveBeenCalledWith('text/plain', USDC_ON_ETH);
    });

    it('offers a coin neither a contract nor hiding', async () => {
        renderMenu([ethereumAccount, bitcoinAccount], BTC);

        await openMenu();

        expect(screen.getByTestId('@asset-detail/menu/network')).toHaveTextContent('Bitcoin');
        expect(screen.queryByTestId('@asset-detail/menu/contract')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@asset-detail/menu/hide-token')).not.toBeInTheDocument();
        expect(screen.getByTestId('@asset-detail/menu/sign-verify')).toBeInTheDocument();
        expect(screen.getByTestId('@asset-detail/menu/walletconnect')).toBeInTheDocument();
        expect(screen.getByTestId('@asset-detail/menu/explorer')).toBeInTheDocument();
    });

    it('leaves out sign & verify and WalletConnect where the network has neither', async () => {
        renderMenu([rippleAccount], XRP);

        await openMenu();

        expect(screen.queryByTestId('@asset-detail/menu/sign-verify')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@asset-detail/menu/walletconnect')).not.toBeInTheDocument();
        expect(screen.getByTestId('@asset-detail/menu/explorer')).toBeInTheDocument();
    });

    it('describes a Cardano token by its fingerprint and policy ID', async () => {
        renderMenu([cardanoAccount], ADA, HOSKY_ON_ADA);

        await openMenu();

        expect(screen.getByTestId('@asset-detail/menu/network')).toHaveTextContent('Cardano');
        expect(screen.getByTestId('@asset-detail/menu/fingerprint')).toHaveTextContent(
            'asset17q...uw03f0d9',
        );
        expect(screen.getByTestId('@asset-detail/menu/policyId')).toHaveTextContent(
            'a0028f35...d481c235',
        );
        expect(screen.queryByTestId('@asset-detail/menu/contract')).not.toBeInTheDocument();
        expect(screen.getByTestId('@asset-detail/menu/hide-token')).toBeInTheDocument();
        expect(screen.getByTestId('@asset-detail/menu/explorer')).toBeInTheDocument();
    });

    it('hides the token in place, and shows it again', async () => {
        const services = renderMenu([ethereumAccount], ETH, USDC_ON_ETH);
        const routeBefore = services.store.getState().router.route;

        await openMenu();
        await userEvent.click(screen.getByTestId('@asset-detail/menu/hide-token'));

        await waitFor(() => {
            expect(services.store.getState().tokenDefinitions[ETH]?.coin?.hide).toEqual([
                USDC_ON_ETH,
            ]);
        });
        expect(services.store.getState().router.route).toBe(routeBefore);

        await openMenu();
        expect(screen.queryByTestId('@asset-detail/menu/hide-token')).not.toBeInTheDocument();
        await userEvent.click(screen.getByTestId('@asset-detail/menu/show-token'));

        await waitFor(() => {
            expect(services.store.getState().tokenDefinitions[ETH]?.coin?.hide).toEqual([]);
        });
    });

    it('warns before showing a token nothing vouches for', async () => {
        const services = renderMenu([unrecognizedTokenAccount], ETH, UNKNOWN_TOKEN);

        await openMenu();
        await userEvent.click(screen.getByTestId('@asset-detail/menu/show-token'));
        await userEvent.click(await screen.findByTestId('@hidden-tokens/unhide/confirm'));

        await waitFor(() => {
            expect(services.store.getState().tokenDefinitions[ETH]?.coin?.show).toEqual([
                UNKNOWN_TOKEN,
            ]);
        });
    });

    it('offers neither hiding nor showing for a coin', async () => {
        renderMenu([bitcoinAccount], BTC);

        await openMenu();

        expect(screen.queryByTestId('@asset-detail/menu/hide-token')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@asset-detail/menu/show-token')).not.toBeInTheDocument();
    });

    it('opens sign & verify on an account of the network', async () => {
        const services = renderMenu([ethereumAccount], ETH, USDC_ON_ETH);

        await openMenu();
        await userEvent.click(screen.getByTestId('@asset-detail/menu/sign-verify'));

        await waitFor(() => {
            expect(services.store.getState().router.route?.name).toBe('wallet-sign-verify');
        });
        expect(services.store.getState().router.params).toMatchObject({
            symbol: ETH,
            accountIndex: ethereumAccount.index,
            accountType: ethereumAccount.accountType,
        });
    });
});
