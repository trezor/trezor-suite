import '@suite-common/test-utils/globalOverrides';

import { initialMetadataState } from '@suite/metadata';
import { mockNetworkIcon, mockNetworksState } from '@suite-common/networks/mocks';
import { QueryClient, QueryClientProvider, desktopQueryKeys } from '@suite-common/react-query';
import { ReceiveTokenMetadataProvider } from '@suite-common/receive';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type RankedTokenStructure } from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import {
    type TradingAssetOption,
    createAssetNativeTokenOption,
    createAssetTokenOption,
} from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type CurrentRate, type Timestamp, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { GlobalReceiveAccountListItem } from './GlobalReceiveAccountListItem';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../../../../mocks/mockInitialAppState';

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;
const ETH = asNetworkSymbol('eth');
const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

/** The tokens Receive lists, which name the ones the account does not hold yet. */
const rankedTokenDefinitions: RankedTokenStructure = [
    { assetPlatformId: 'ethereum', address: USDC, symbol: 'usdc', name: 'USD Coin', marketCap: 0 },
];

const networkIcon = mockNetworkIcon();

// In dollars, the dollar rate is the rate itself.
const mockRate = (rate: number) =>
    ({
        rate,
        usdRate: rate,
        lastTickerTimestamp: 1700000000000 as Timestamp,
        lastSuccessfulFetchTimestamp: 1700000000000 as Timestamp,
        isLoading: false,
        error: null,
    }) as CurrentRate;

/** One ether at $2,000 and 250 USDT at $1 each: $2,250 in all. */
const ethAccount = mockWalletAccount({
    symbol: ETH,
    descriptor: asAccountDescriptor('0xdescriptor'),
    deviceState: DEVICE_STATE,
    balance: '1000000000000000000',
    formattedBalance: '1',
    tokens: [
        mockAccountToken({
            name: 'Tether USD',
            symbol: 'USDT',
            contract: USDT,
            decimals: 6,
            balance: '250',
        }),
    ],
});

const state: MockSuiteState = {
    ...mockInitialAppState,
    metadata: initialMetadataState,
    networks: mockNetworksState([ETH]),
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [ethAccount],
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: [ETH],
            localCurrency: 'usd',
        },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: {
                [getFiatRateKey(ETH, 'usd')]: mockRate(2000),
                [getFiatRateKey(ETH, 'usd', USDT)]: mockRate(1),
            },
        },
    },
};

const renderListItem = (asset?: TradingAssetOption) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState: state });
    const queryClient = new QueryClient();
    queryClient.setQueryData(desktopQueryKeys.rankedTokenDefinitions(), rankedTokenDefinitions);

    // The receive modal provides the metadata of the tokens it lists to the account list.
    return renderWithProviders(
        { ...services, networks: { networkIcon } },
        <QueryClientProvider client={queryClient}>
            <ReceiveTokenMetadataProvider>
                <GlobalReceiveAccountListItem
                    account={ethAccount}
                    asset={asset}
                    iconSize={24}
                    onClick={() => {}}
                    variant="card"
                />
            </ReceiveTokenMetadataProvider>
        </QueryClientProvider>,
    );
};

describe('an account in the receive list', () => {
    it('shows what the account holds of the token being received', () => {
        const usdt = createAssetTokenOption(ETH, {
            contract: USDT,
            symbol: 'USDT',
            name: 'Tether USD',
        });

        const { container } = renderListItem(usdt);

        expect(container).toHaveTextContent('250.00 USDT');
        expect(container).toHaveTextContent('$250');
        expect(container).not.toHaveTextContent('$2,250');
    });

    it('shows no token at all for an account that holds none of it yet', () => {
        const usdc = createAssetTokenOption(ETH, {
            contract: USDC,
            symbol: 'USDC',
            name: 'USD Coin',
        });

        const { container } = renderListItem(usdc);

        expect(container).toHaveTextContent('0 USDC');
        expect(container).not.toHaveTextContent('$2,250');
    });

    it('shows the coin alone when the coin itself is being received', () => {
        const { container } = renderListItem(createAssetNativeTokenOption(ETH));

        expect(container).toHaveTextContent('1.00 ETH');
        expect(container).toHaveTextContent('$2,000');
        expect(container).not.toHaveTextContent('$2,250');
    });

    it('sums up the whole account when no asset is being received', () => {
        const { container } = renderListItem();

        expect(container).toHaveTextContent('$2,250');
    });
});
