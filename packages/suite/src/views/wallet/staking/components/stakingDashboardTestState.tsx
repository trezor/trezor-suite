import { type ReactElement } from 'react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type StakingDep } from '@suite-common/earn-staking';
import {
    mockStakingQueryClient,
    mockStakingServices,
    mockStakingState,
} from '@suite-common/earn-staking/mocks';
import {
    type StakingPosition,
    type StakingProductDescriptor,
    type StakingProductId,
    type StakingProductInfo,
    stakingAmountSchema,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type RenderResult, createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey, type CurrentRate } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { mock } from '@trezor/dependency-injection';
import { type StaticSessionId } from '@trezor/device-utils';
import { type VersionArray } from '@trezor/utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

export const ETH = asNetworkSymbol('eth');
export const SOL = asNetworkSymbol('sol');
export const ADA = asNetworkSymbol('ada');
export const TRX = asNetworkSymbol('trx');
export const THOD = asNetworkSymbol('thod');

export const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

export const amount = (value: string) => stakingAmountSchema.parse(value);

export const ZERO_BALANCES: StakingPosition['balances'] = {
    staked: amount('0'),
    pending: amount('0'),
    unstaking: amount('0'),
    withdrawable: amount('0'),
    rewards: amount('0'),
};

const cardanoFeatures = {
    unstake: 'ada.staking.unstake',
    claim: 'ada.staking.claim',
    vote: 'ada.staking.vote',
};

export const ethProduct = mockStakingProductDescriptor();
export const thodProduct = mockStakingProductDescriptor({
    networkSymbol: THOD,
    messageSystemFeatures: {},
});
export const solProduct = mockStakingProductDescriptor({
    networkSymbol: SOL,
    type: 'native',
    rewardsKind: 'expected',
    options: [],
    messageSystemFeatures: {
        stake: 'sol.staking.stake',
        unstake: 'sol.staking.unstake',
        withdraw: 'sol.staking.claim',
    },
});
export const adaEverstakeProduct = mockStakingProductDescriptor({
    networkSymbol: ADA,
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
    options: [],
    messageSystemFeatures: { stake: 'ada.staking.stake', ...cardanoFeatures },
});
export const adaFiveBinariesProduct = mockStakingProductDescriptor({
    networkSymbol: ADA,
    providerId: stakingProviderIdSchema.parse('fivebinaries'),
    type: 'native',
    operations: ['unstake', 'claim', 'vote'],
    options: [],
    consentKey: null,
    messageSystemFeatures: cardanoFeatures,
});
export const adaExternalProduct = mockStakingProductDescriptor({
    networkSymbol: ADA,
    providerId: stakingProviderIdSchema.parse('external'),
    type: 'native',
    operations: ['unstake', 'claim', 'vote'],
    options: [],
    consentKey: null,
    messageSystemFeatures: cardanoFeatures,
});
export const trxProduct = mockStakingProductDescriptor({
    networkSymbol: TRX,
    providerId: stakingProviderIdSchema.parse('curated'),
    type: 'native',
    operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
    rateKind: 'apr',
    rewardsKind: 'claimable',
    options: [],
    consentKey: 'staking:curated',
    platforms: { desktop: { access: 'manage' }, mobile: { access: 'read-only' } },
    messageSystemFeatures: {
        stake: 'trx.staking.stake',
        unstake: 'trx.staking.unstake',
        withdraw: 'trx.staking.withdraw',
        claim: 'trx.staking.claim',
        vote: 'trx.staking.vote',
    },
    minFirmware: {
        stake: '2.12.2',
        unstake: '2.12.2',
        withdraw: '2.12.2',
        claim: '2.12.2',
        vote: '2.12.2',
    },
});

export const products = [
    ethProduct,
    thodProduct,
    solProduct,
    adaEverstakeProduct,
    adaFiveBinariesProduct,
    adaExternalProduct,
    trxProduct,
];

export const ethAccount = mockWalletAccount({
    symbol: ETH,
    availableBalance: '3000000000000000000',
});
export const solAccount = mockWalletAccount({ symbol: SOL, availableBalance: '2500000000' });
export const adaAccount = mockWalletAccount({ symbol: ADA, availableBalance: '100000000' });
export const trxAccount = mockWalletAccount({ symbol: TRX, availableBalance: '100000000' });

export const mockPosition = (
    productId: StakingProductId,
    overrides: Partial<StakingPosition> = {},
): StakingPosition =>
    mockStakingPosition({
        productId,
        balances: ZERO_BALANCES,
        unlocks: [],
        targets: [],
        operations: [],
        ...overrides,
    });

export const TRON_DETAILS: Extract<
    NonNullable<StakingPosition['details']>,
    { kind: 'tron-staking' }
> = {
    kind: 'tron-staking',
    frozen: { energy: amount('0'), bandwidth: amount('0') },
    delegated: { energy: amount('0'), bandwidth: amount('0') },
    votingPower: amount('0'),
    unallocatedVotingPower: amount('0'),
    rewardClaimAvailableAt: null,
};

// In dollars, the dollar rate is the rate itself.
const mockRate = (rate: number) => ({ rate, usdRate: rate }) as CurrentRate;

const createDevice = (firmware: VersionArray): TrezorDevice => {
    const device = mockSuiteDevice({ connected: true, state: { staticSessionId: DEVICE_STATE } });

    if (device.type !== 'acquired') {
        throw new Error('Expected an acquired device');
    }

    const [major_version, minor_version, patch_version] = firmware;

    return {
        ...device,
        features: { ...device.features, major_version, minor_version, patch_version },
    };
};

type CreateStateParams = {
    accounts?: Account[];
    positions?: Partial<Record<AccountKey, readonly StakingPosition[]>>;
    descriptors?: readonly StakingProductDescriptor[];
    /** Message-system features switched off, by their domain. */
    disabledFeatures?: readonly string[];
    firmware?: VersionArray;
};

export const createStakingDashboardState = ({
    accounts = [],
    positions = {},
    descriptors = products,
    disabledFeatures = [],
    firmware = [2, 12, 2],
}: CreateStateParams = {}): MockSuiteState => ({
    ...mockInitialAppState,
    messageSystem:
        disabledFeatures.length === 0
            ? mockInitialAppState.messageSystem
            : mockMessageSystemStateWithFeatureFlags(
                  Object.fromEntries(disabledFeatures.map(domain => [domain, false])),
              ),
    networks: mockNetworksState([ETH, THOD, SOL, ADA, TRX]),
    earn: { staking: mockStakingState({ descriptors, positions }) },
    device: { ...mockInitialAppState.device, selectedDevice: createDevice(firmware) },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts,
        settings: { ...mockInitialAppState.wallet.settings, localCurrency: 'usd' },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: {
                [getFiatRateKey(ETH, 'usd')]: mockRate(3000),
                [getFiatRateKey(SOL, 'usd')]: mockRate(150),
                [getFiatRateKey(ADA, 'usd')]: mockRate(0.5),
                [getFiatRateKey(TRX, 'usd')]: mockRate(0.25),
            },
        },
    },
});

type RenderParams = {
    state: MockSuiteState;
    productInfo?: Partial<Record<StakingProductId, StakingProductInfo>>;
};

export const renderStakingDashboardComponent = (
    element: ReactElement,
    { state, productInfo }: RenderParams,
): RenderResult & { report: jest.Mock } => {
    const report = mock<DesktopAnalyticsDep['analytics']['report']>();
    const { services } = createTestCompositionRoot<
        { services: StakingDep & DesktopAnalyticsDep },
        MockSuiteState
    >({
        preloadedState: state,
        services: () => ({
            staking: mockStakingServices(),
            analytics: mockDesktopAnalytics(report),
        }),
    });

    const view = renderWithProviders(services, element, {
        queryClient: mockStakingQueryClient({ productInfo }),
    });

    return { ...view, report };
};
