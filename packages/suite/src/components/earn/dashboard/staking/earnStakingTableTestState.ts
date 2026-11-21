import { mockStakingState } from '@suite-common/earn-staking/mocks';
import {
    type StakingPosition,
    type StakingProductDescriptor,
    type StakingProductLimits,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { Feature, type MessageSystemState } from '@suite-common/message-system';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey, type CurrentRate } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';
import { type VersionArray } from '@trezor/utils';

import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

export const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

export const ETH = asNetworkSymbol('eth');
export const SOL = asNetworkSymbol('sol');
export const ADA = asNetworkSymbol('ada');
export const TRX = asNetworkSymbol('trx');
export const THOD = asNetworkSymbol('thod');
export const BTC = asNetworkSymbol('btc');

export const amount = (value: string) => stakingAmountSchema.parse(value);

export const ZERO_BALANCES: StakingPosition['balances'] = {
    staked: amount('0'),
    pending: amount('0'),
    unstaking: amount('0'),
    withdrawable: amount('0'),
    rewards: amount('0'),
};

const limits = (minStakeAmount: string, registrationDeposit = '0'): StakingProductLimits => ({
    minStakeAmount: amount(minStakeAmount),
    maxStakeAmount: amount('1000000000000000000000'),
    minWithdrawalAmount: amount('0'),
    feeBufferBalance: amount('0'),
    minBalanceForStaking: amount(minStakeAmount),
    minStakeAmountForDashboard: amount(minStakeAmount),
    registrationDeposit: amount(registrationDeposit),
});

/** The eth product of the mock descriptor: 0.1 ETH is the dashboard minimum. */
export const ethProduct = mockStakingProductDescriptor();
export const solProduct = mockStakingProductDescriptor({
    networkSymbol: SOL,
    type: 'native',
    rewardsKind: 'expected',
    options: [],
    limits: limits('1000000000'),
    messageSystemFeatures: { stake: Feature.stake.sol },
});
export const adaProduct = mockStakingProductDescriptor({
    networkSymbol: ADA,
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
    options: [],
    limits: limits('1000000', '2000000'),
    messageSystemFeatures: { stake: Feature.stake.ada },
});
export const trxProduct = mockStakingProductDescriptor({
    networkSymbol: TRX,
    type: 'native',
    rateKind: 'apr',
    rewardsKind: 'claimable',
    operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
    options: [],
    limits: limits('1000000'),
    messageSystemFeatures: { stake: Feature.stake.trx, withdraw: Feature.withdraw.trx },
    minFirmware: {
        stake: '2.12.2',
        unstake: '2.12.2',
        withdraw: '2.12.2',
        claim: '2.12.2',
        vote: '2.12.2',
    },
});
export const thodProduct = mockStakingProductDescriptor({ networkSymbol: THOD });

export const products = [ethProduct, solProduct, adaProduct, trxProduct, thodProduct];

type MockAccountParams = {
    symbol: NetworkSymbol;
    descriptor: string;
    availableBalance?: string;
    formattedBalance?: string;
    index?: number;
    accountType?: Account['accountType'];
};

export const mockAccount = ({
    symbol,
    descriptor,
    availableBalance = '0',
    formattedBalance = '0',
    index = 0,
    accountType = 'normal',
}: MockAccountParams): Account =>
    mockWalletAccount({
        symbol,
        descriptor: descriptor as Account['descriptor'],
        availableBalance,
        formattedBalance,
        balance: availableBalance,
        index,
        accountType,
    });

export const mockStakedPosition = (
    productId: StakingProductDescriptor['id'],
    staked: string,
    overrides: Partial<StakingPosition> = {},
): StakingPosition =>
    mockStakingPosition({
        productId,
        balances: { ...ZERO_BALANCES, staked: amount(staked) },
        unlocks: [],
        targets: [],
        ...overrides,
    });

// In dollars, the dollar rate is the rate itself.
export const mockRate = (rate: number) => ({ rate, usdRate: rate }) as CurrentRate;

const STAKE_OFF_MESSAGE_ID = 'stakeOff';

/** The message system once the stake of `domain` was switched off remotely. */
export const messageSystemWithStakeOff = (domain: string): MessageSystemState =>
    ({
        ...mockInitialAppState.messageSystem,
        config: {
            version: 1,
            timestamp: '2026-01-01',
            sequence: 1,
            actions: [
                {
                    message: {
                        id: STAKE_OFF_MESSAGE_ID,
                        priority: 1,
                        dismissible: false,
                        category: ['feature'],
                        content: { en: 'Staking is off' },
                        feature: [{ domain, flag: false }],
                    },
                },
            ],
        },
        validMessages: {
            banner: [],
            context: [],
            modal: [],
            feature: [STAKE_OFF_MESSAGE_ID],
        },
    }) as unknown as MessageSystemState;

type UnavailableCapabilities = Partial<Record<NetworkSymbol, 'no-support'>>;

const createDevice = (
    firmware: VersionArray,
    unavailableCapabilities: UnavailableCapabilities,
): TrezorDevice => {
    const device = mockSuiteDevice({
        state: { staticSessionId: DEVICE_STATE },
        unavailableCapabilities,
    });

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
    unavailableCapabilities?: UnavailableCapabilities;
    messageSystem?: MessageSystemState;
    descriptors?: readonly StakingProductDescriptor[];
    firmware?: VersionArray;
};

export const createEarnStakingTableState = ({
    accounts = [],
    positions = {},
    unavailableCapabilities = {},
    messageSystem = mockInitialAppState.messageSystem,
    descriptors = products,
    firmware = [2, 12, 2],
}: CreateStateParams = {}): MockSuiteState => ({
    ...mockInitialAppState,
    messageSystem,
    networks: mockNetworksState([ETH, SOL, ADA, TRX, THOD, BTC]),
    earn: { staking: mockStakingState({ descriptors, positions }) },
    device: {
        ...mockInitialAppState.device,
        selectedDevice: createDevice(firmware, unavailableCapabilities),
    },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts,
        settings: { ...mockInitialAppState.wallet.settings, localCurrency: 'usd' },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: { [getFiatRateKey(ETH, 'usd')]: mockRate(3000) },
        },
    },
});
