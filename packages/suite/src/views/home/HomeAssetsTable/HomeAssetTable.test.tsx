import '@suite-common/test-utils/globalOverrides';

import { type MessageDescriptor, createIntl } from 'react-intl';

import { screen, within } from '@testing-library/react';

import { initialState as selectedAccountInitialState } from '@suite/account';
import { messages } from '@suite/intl';
import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import {
    Feature,
    type MessageSystemState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { mockNetworkIcon, mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockYieldVault } from '@suite-common/wallet-core/mocks';
import {
    type Account,
    type CurrentRate,
    type HomeAssetsTableGrouping,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { FirmwareType, type StaticSessionId } from '@trezor/device-utils';
import { getWrappedNativeToken } from '@trezor/network-ethereum/constants';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { HomeAssetTable } from './HomeAssetTable';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

jest.mock('@suite-common/earn-stablecoin-api', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin-api'),
    useAllYieldOpportunities: jest.fn(),
}));

const mockUseAllYieldOpportunities = jest.mocked(useAllYieldOpportunities);

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

const networkIcon = mockNetworkIcon();

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

// In dollars, the dollar rate is the rate itself.
const mockRate = (rate: number) => ({ rate, usdRate: rate }) as CurrentRate;

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

const bitcoinAccount = mockWalletAccount({ symbol: BTC, formattedBalance: '0.1' });

const YIELD_DEPOSITS_OFF_MESSAGE_ID = 'yieldDepositsOff';

/** The message system once yield deposits were switched off remotely, for every vault at once. */
const messageSystemWithYieldDepositsOff = {
    ...messageSystemInitialState,
    config: {
        version: 1,
        timestamp: '2026-01-01',
        sequence: 1,
        actions: [
            {
                message: {
                    id: YIELD_DEPOSITS_OFF_MESSAGE_ID,
                    priority: 1,
                    dismissible: false,
                    category: ['feature'],
                    content: { en: 'Yield deposits are off' },
                    feature: [{ domain: Feature.earn.yield.deposit, flag: false }],
                },
            },
        ],
        experiments: [],
    },
    validMessages: {
        banner: [],
        context: [],
        modal: [],
        feature: [YIELD_DEPOSITS_OFF_MESSAGE_ID],
    },
} as unknown as MessageSystemState;

type InitialStateParams = {
    /** What the Earn API says Ethereum staking pays, as a percentage; nothing by default. */
    ethStakingApy?: number;
    areYieldDepositsOff?: boolean;
    accounts?: Account[];
    firmwareType?: FirmwareType;
    grouping?: HomeAssetsTableGrouping;
    areSmallBalancesShown?: boolean;
};

const getInitialState = ({
    ethStakingApy,
    areYieldDepositsOff = false,
    accounts = [ethereumAccount, bitcoinAccount],
    firmwareType = FirmwareType.Universal,
    grouping = 'default',
    areSmallBalancesShown = true,
}: InitialStateParams = {}): AppState => ({
    ...mockInitialAppState,
    messageSystem: areYieldDepositsOff
        ? messageSystemWithYieldDepositsOff
        : mockInitialAppState.messageSystem,
    networks: mockNetworksState([BTC, ETH]),
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({
            state: { staticSessionId: DEVICE_STATE },
            firmwareType,
        }),
    },
    tokenDefinitions: {
        [ETH]: {
            coin: { data: [USDC_ON_ETH], error: false, isLoading: false, hide: [], show: [] },
        },
    },
    wallet: {
        ...mockInitialAppState.wallet,
        selectedAccount: selectedAccountInitialState,
        accounts,
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: [BTC, ETH],
            localCurrency: 'usd',
            homeAssetsTableGrouping: grouping,
            areHomeAssetSmallBalancesShown: areSmallBalancesShown,
        },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: {
                [getFiatRateKey(ETH, 'usd')]: mockRate(3000),
                [getFiatRateKey(BTC, 'usd')]: mockRate(100000),
                [getFiatRateKey(ETH, 'usd', USDC_ON_ETH)]: mockRate(1),
            },
        },
        stake: {
            ...mockInitialAppState.wallet.stake,
            data: {
                ...mockInitialAppState.wallet.stake.data,
                data: {
                    ...mockInitialAppState.wallet.stake.data.data,
                    eth:
                        ethStakingApy === undefined
                            ? undefined
                            : {
                                  stats: { apy: ethStakingApy, nextRewardPayout: 0 },
                                  validators: {},
                              },
                },
            },
        },
    },
});

type MockVaultParams = {
    id: string;
    token: Pick<YieldDtoV2['token'], 'address' | 'symbol' | 'decimals'>;
    /** As a percentage, the way the badge shows it. */
    apy: number;
};

/** An open vault on Ethereum that takes the token and pays `apy`. */
const mockVault = ({ id, token, apy }: MockVaultParams): YieldDtoV2 => {
    const vault = mockYieldVault();

    return mockYieldVault({
        id,
        token: { ...vault.token, ...token },
        rewardRate: { ...vault.rewardRate, total: apy / 100 },
    });
};

const wethVault = mockVault({ id: 'weth-vault', token: getWrappedNativeToken('eth'), apy: 4 });
const usdcVault = mockVault({
    id: 'usdc-vault',
    token: { address: USDC_ON_ETH, symbol: 'USDC', decimals: 6 },
    apy: 4.5,
});

const vaultsQuery = (vaults?: YieldDtoV2[]) =>
    ({ data: vaults }) as ReturnType<typeof useAllYieldOpportunities>;

const intl = createIntl({ locale: 'en' });
const upToApyMessage: MessageDescriptor = messages.TR_EARN_YIELD_BADGE_UP_TO_RATE;

/** What the badge says for a rate, as the user reads it. */
const upToApy = (apy: string) => intl.formatMessage(upToApyMessage, { apy });

const renderTable = (state: AppState) => {
    const { services } = createTestCompositionRoot<void, AppState>({ preloadedState: state });

    renderWithProviders({ ...services, networks: { networkIcon } }, <HomeAssetTable />);

    return services;
};

/** The badge in the row of a coin (`eth/coin`) or a token (`eth/<contract>`), if it has one. */
const badgeIn = (row: string) =>
    within(screen.getByTestId(`@dashboard/home-asset-item/${row}`)).queryByTestId(
        '@earn/yield-badge',
    );

describe('the home-asset table', () => {
    beforeEach(() => {
        mockUseAllYieldOpportunities.mockReset();
        mockUseAllYieldOpportunities.mockReturnValue(vaultsQuery());
    });

    it('shows one row per asset and network, with the network it is held on', () => {
        renderTable(getInitialState());

        expect(screen.getByTestId('@dashboard/home-asset-item/eth/coin')).toBeInTheDocument();
        expect(
            screen.getByTestId(`@dashboard/home-asset-item/eth/${USDC_ON_ETH}`),
        ).toBeInTheDocument();
        expect(screen.getByTestId('@dashboard/home-asset-item/btc/coin')).toBeInTheDocument();
    });

    it('puts the most valuable asset first', () => {
        renderTable(getInitialState());

        const assetNames = screen
            .getAllByTestId('@dashboard/home-asset/name')
            .map(element => element.textContent);

        expect(assetNames).toEqual(['BTC', 'ETH', 'USDC']);
    });

    it('says the wallet holds nothing once every balance is zero, and keeps the menu over it', () => {
        renderTable(
            getInitialState({
                accounts: [
                    mockWalletAccount({ symbol: ETH, formattedBalance: '0' }),
                    mockWalletAccount({ symbol: BTC, formattedBalance: '0' }),
                ],
            }),
        );

        expect(screen.getByTestId('@dashboard/home-asset-table/empty')).toBeInTheDocument();
        expect(screen.queryAllByTestId('@dashboard/home-asset/name')).toHaveLength(0);
        expect(screen.getByTestId('@dashboard/home-asset/grouping')).toBeInTheDocument();
    });

    describe('the APY badge next to the ticker', () => {
        it('offers a coin its staking rate, and nothing to what cannot earn', () => {
            renderTable(getInitialState({ ethStakingApy: 3.2 }));

            expect(badgeIn('eth/coin')?.textContent).toBe(upToApy('3.2'));
            expect(badgeIn(`eth/${USDC_ON_ETH}`)).toBeNull();
            expect(badgeIn('btc/coin')).toBeNull();
        });

        it('offers a coin the better of staking and its wrapped-coin vault, and a token its vault', () => {
            mockUseAllYieldOpportunities.mockReturnValue(vaultsQuery([wethVault, usdcVault]));

            renderTable(getInitialState({ ethStakingApy: 3.2 }));

            expect(badgeIn('eth/coin')?.textContent).toBe(upToApy('4'));
            expect(badgeIn(`eth/${USDC_ON_ETH}`)?.textContent).toBe(upToApy('4.5'));
        });

        it('leaves the vaults out while yield deposits are switched off, and staking in', () => {
            // What a cache another page filled hands back: the switch cannot rely on the fetch alone.
            mockUseAllYieldOpportunities.mockReturnValue(vaultsQuery([wethVault, usdcVault]));

            renderTable(getInitialState({ ethStakingApy: 3.2, areYieldDepositsOff: true }));

            expect(badgeIn('eth/coin')?.textContent).toBe(upToApy('3.2'));
            expect(badgeIn(`eth/${USDC_ON_ETH}`)).toBeNull();
            expect(mockUseAllYieldOpportunities).not.toHaveBeenCalledWith(
                expect.objectContaining({ enabled: true }),
            );
        });
    });

    describe('the menu over the table', () => {
        it('groups the rows by network as the user chose on universal firmware', () => {
            renderTable(getInitialState({ grouping: 'networks' }));

            expect(screen.getByTestId('@dashboard/home-asset/grouping')).toBeInTheDocument();
            expect(screen.getByTestId('@dashboard/home-asset-group/btc')).toBeInTheDocument();
        });

        it('is not offered on Bitcoin-only firmware, which shows every row ungrouped', () => {
            // Worth 10c: a small balance the saved switch would hide.
            const smallBitcoinAccount = mockWalletAccount({
                symbol: BTC,
                formattedBalance: '0.000001',
            });

            const services = renderTable(
                getInitialState({
                    accounts: [smallBitcoinAccount],
                    firmwareType: FirmwareType.BitcoinOnly,
                    grouping: 'networks',
                    areSmallBalancesShown: false,
                }),
            );

            expect(screen.queryByTestId('@dashboard/home-asset/grouping')).not.toBeInTheDocument();
            expect(screen.queryByTestId('@dashboard/home-asset-group/btc')).not.toBeInTheDocument();
            expect(screen.getByTestId('@dashboard/home-asset-item/btc/coin')).toBeInTheDocument();
            expect(services.store.getState().wallet.settings).toMatchObject({
                homeAssetsTableGrouping: 'networks',
                areHomeAssetSmallBalancesShown: false,
            });
        });
    });
});
