import {
    type StakingPosition,
    type StakingPositionBalances,
    type StakingProductDescriptor,
    stakingAmountSchema,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type Account, type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol, asNetworkSymbols } from '@trezor/network-module-types';

import {
    type StakingDeviceRootState,
    selectDeviceStakingEntryByWarning,
    selectDeviceStakingPositionEntries,
    selectDeviceStakingPositionEntriesBySymbol,
    selectDeviceStakingPositionsCount,
    selectDeviceStakingSymbols,
} from './stakingDeviceSelectors';
import { mockStakingState } from '../../mocks';

const DEVICE_STATIC_SESSION_ID = 'selectedWallet@deviceId:0';
const OTHER_DEVICE_STATIC_SESSION_ID = 'otherWallet@otherDeviceId:0';

const selectedDevice = mockSuiteDevice({
    id: 'selected-device',
    connected: true,
    available: true,
    remember: true,
    state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
});

const amount = (value: string) => stakingAmountSchema.parse(value);

const balances = (overrides: Partial<StakingPositionBalances>): StakingPositionBalances => ({
    staked: amount('0'),
    pending: amount('0'),
    unstaking: amount('0'),
    withdrawable: amount('0'),
    rewards: amount('0'),
    ...overrides,
});

const eth = mockStakingProductDescriptor();
const thod = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('thod') });
const sol = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('sol'), type: 'native' });
const solExternal = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('sol'),
    providerId: stakingProviderIdSchema.parse('external'),
    type: 'native',
    operations: [],
    consentKey: null,
    isCountedInAccountTotals: false,
});
const ada = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('ada'),
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
    rewardsKind: 'claimable',
});
const adaFiveBinaries = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('ada'),
    providerId: stakingProviderIdSchema.parse('fivebinaries'),
    type: 'native',
    operations: ['unstake', 'claim', 'vote'],
    consentKey: null,
    rewardsKind: 'claimable',
});
const trx = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('trx'),
    providerId: stakingProviderIdSchema.parse('curated'),
    type: 'native',
    operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
    rateKind: 'apr',
    rewardsKind: 'claimable',
});

const DESCRIPTORS = [eth, thod, sol, solExternal, ada, adaFiveBinaries, trx];

type CreateAccountParams = {
    symbol: string;
    descriptor: string;
    index?: number;
    deviceState?: Account['deviceState'];
    visible?: boolean;
};

const createAccount = ({
    symbol,
    descriptor,
    index = 0,
    deviceState = DEVICE_STATIC_SESSION_ID,
    visible = true,
}: CreateAccountParams) =>
    mockWalletAccount({
        symbol: asNetworkSymbol(symbol),
        descriptor: asAccountDescriptor(descriptor),
        index,
        deviceState,
        visible,
    });

const trxAccount = createAccount({ symbol: 'trx', descriptor: 'trx1' });
const adaAccount = createAccount({ symbol: 'ada', descriptor: 'ada1' });
const adaFiveBinariesAccount = createAccount({ symbol: 'ada', descriptor: 'ada2' });
const solAccount = createAccount({ symbol: 'sol', descriptor: 'sol1' });
const thodAccount = createAccount({ symbol: 'thod', descriptor: 'thod1' });
const ethAccount = createAccount({ symbol: 'eth', descriptor: 'eth1' });
const secondEthAccount = createAccount({ symbol: 'eth', descriptor: 'eth2', index: 1 });
const emptyPoolEthAccount = createAccount({ symbol: 'eth', descriptor: 'eth3' });
const hiddenEthAccount = createAccount({ symbol: 'eth', descriptor: 'eth4', visible: false });
const otherDeviceEthAccount = createAccount({
    symbol: 'eth',
    descriptor: 'eth5',
    deviceState: OTHER_DEVICE_STATIC_SESSION_ID,
});

// In reverse coin order, so the selectors have to sort.
const ACCOUNTS = [
    trxAccount,
    adaFiveBinariesAccount,
    adaAccount,
    solAccount,
    thodAccount,
    otherDeviceEthAccount,
    hiddenEthAccount,
    emptyPoolEthAccount,
    secondEthAccount,
    ethAccount,
];

const ethPosition = mockStakingPosition();
const thodPosition = mockStakingPosition({ productId: thod.id });
const solPosition = mockStakingPosition({
    productId: sol.id,
    balances: balances({ staked: amount('5000000000'), rewards: amount('854795') }),
    unlocks: [],
});
const solExternalPosition = mockStakingPosition({
    productId: solExternal.id,
    balances: balances({ staked: amount('10000000000') }),
    unlocks: [],
    operations: [],
});
const adaPosition = mockStakingPosition({
    productId: ada.id,
    lockup: 'liquid',
    balances: balances({ staked: amount('994750000'), rewards: amount('5250000') }),
    unlocks: [],
    operations: ['unstake', 'claim', 'vote'],
});
const emptyFiveBinariesPosition = mockStakingPosition({
    productId: adaFiveBinaries.id,
    status: 'inactive',
    lockup: 'liquid',
    balances: balances({}),
    unlocks: [],
    targets: [],
    operations: ['unstake', 'vote'],
    warnings: [{ code: 'outdated-provider', providerId: adaFiveBinaries.providerId }],
});
const trxPosition = mockStakingPosition({
    productId: trx.id,
    balances: balances({
        staked: amount('1000000000'),
        unstaking: amount('200000000'),
        withdrawable: amount('300000000'),
        rewards: amount('1500000'),
    }),
    unlocks: [{ amount: amount('200000000'), availableAt: 1_800_000_000_000 }],
    operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
});
const emptyPoolPosition = mockStakingPosition({
    status: 'inactive',
    balances: balances({ rewards: amount('0') }),
    unlocks: [],
    targets: [],
    operations: ['stake'],
});
const unregisteredPosition = mockStakingPosition({
    productId: mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('dsol') }).id,
});

const POSITIONS: Partial<Record<AccountKey, readonly StakingPosition[]>> = {
    [ethAccount.key]: [ethPosition],
    [secondEthAccount.key]: [ethPosition, unregisteredPosition],
    [emptyPoolEthAccount.key]: [emptyPoolPosition],
    [hiddenEthAccount.key]: [ethPosition],
    [otherDeviceEthAccount.key]: [ethPosition],
    [thodAccount.key]: [thodPosition],
    [solAccount.key]: [solPosition, solExternalPosition],
    [adaAccount.key]: [adaPosition],
    [adaFiveBinariesAccount.key]: [emptyFiveBinariesPosition],
    [trxAccount.key]: [trxPosition],
};

type CreateStateParams = {
    descriptors?: readonly StakingProductDescriptor[];
    positions?: Partial<Record<AccountKey, readonly StakingPosition[]>>;
    accounts?: Account[];
};

const createState = ({
    descriptors = DESCRIPTORS,
    positions = POSITIONS,
    accounts = ACCOUNTS,
}: CreateStateParams = {}): StakingDeviceRootState => ({
    earn: { staking: mockStakingState({ descriptors, positions }) },
    wallet: { accounts },
    device: { devices: [selectedDevice], selectedDevice, buttonRequestsByPath: {} },
    networks: mockNetworksState(asNetworkSymbols(['btc', 'eth', 'thod', 'sol', 'ada', 'trx'])),
});

const describeEntries = (state: StakingDeviceRootState) =>
    selectDeviceStakingPositionEntries(state).map(({ accountKey, descriptor }) => ({
        accountKey,
        productId: descriptor.id,
    }));

describe('selectDeviceStakingPositionEntries', () => {
    it('lists the counted positions of the visible device accounts in coin order', () => {
        expect(describeEntries(createState())).toEqual([
            { accountKey: ethAccount.key, productId: eth.id },
            { accountKey: secondEthAccount.key, productId: eth.id },
            { accountKey: thodAccount.key, productId: thod.id },
            { accountKey: solAccount.key, productId: sol.id },
            { accountKey: adaAccount.key, productId: ada.id },
            { accountKey: trxAccount.key, productId: trx.id },
        ]);
    });

    it.each([
        { name: 'a hidden account', account: hiddenEthAccount },
        { name: 'an account of another device', account: otherDeviceEthAccount },
        { name: 'a pool entry at zero', account: emptyPoolEthAccount },
        { name: 'a stake key with an empty balance', account: adaFiveBinariesAccount },
    ])('leaves out $name', ({ account }) => {
        expect(describeEntries(createState({ accounts: [account] }))).toEqual([]);
    });

    it('leaves out uncounted and unregistered positions', () => {
        const state = createState({ accounts: [solAccount, secondEthAccount] });

        expect(describeEntries(state)).toEqual([
            { accountKey: secondEthAccount.key, productId: eth.id },
            { accountKey: solAccount.key, productId: sol.id },
        ]);
    });

    it('is empty without a selected device', () => {
        const state: StakingDeviceRootState = {
            ...createState(),
            device: { devices: [], selectedDevice: undefined, buttonRequestsByPath: {} },
        };

        expect(selectDeviceStakingPositionEntries(state)).toBe(
            selectDeviceStakingPositionEntries(createState({ positions: {} })),
        );
    });

    it('keeps the references across a recreated state', () => {
        const first = selectDeviceStakingPositionEntries(createState());

        selectDeviceStakingPositionEntriesBySymbol(createState(), asNetworkSymbol('sol'));

        expect(selectDeviceStakingPositionEntries(createState())).toBe(first);
        expect(selectDeviceStakingPositionEntries(createState())[0]).toBe(first[0]);
    });
});

describe('selectDeviceStakingPositionEntriesBySymbol', () => {
    it('keeps the entries of one network', () => {
        const state = createState();

        expect(
            selectDeviceStakingPositionEntriesBySymbol(state, asNetworkSymbol('eth')).map(
                ({ accountKey }) => accountKey,
            ),
        ).toEqual([ethAccount.key, secondEthAccount.key]);
        expect(selectDeviceStakingPositionEntriesBySymbol(state, asNetworkSymbol('sol'))).toBe(
            selectDeviceStakingPositionEntriesBySymbol(createState(), asNetworkSymbol('sol')),
        );
    });

    it('shares the empty list for a network without positions', () => {
        expect(
            selectDeviceStakingPositionEntriesBySymbol(createState(), asNetworkSymbol('btc')),
        ).toBe(selectDeviceStakingPositionEntriesBySymbol(createState(), asNetworkSymbol('dsol')));
    });
});

describe('selectDeviceStakingSymbols', () => {
    it('lists each network once, in coin order', () => {
        expect(selectDeviceStakingSymbols(createState())).toEqual([
            'eth',
            'thod',
            'sol',
            'ada',
            'trx',
        ]);
        expect(selectDeviceStakingSymbols(createState())).toBe(
            selectDeviceStakingSymbols(createState()),
        );
    });
});

describe('selectDeviceStakingPositionsCount', () => {
    it('counts the entries', () => {
        expect(selectDeviceStakingPositionsCount(createState())).toBe(6);
        expect(selectDeviceStakingPositionsCount(createState({ positions: {} }))).toBe(0);
    });
});

describe('selectDeviceStakingEntryByWarning', () => {
    it('finds the first entry with the warning, whatever its amount', () => {
        expect(selectDeviceStakingEntryByWarning(createState(), 'outdated-provider')).toEqual({
            accountKey: adaFiveBinariesAccount.key,
            position: emptyFiveBinariesPosition,
            descriptor: adaFiveBinaries,
        });
        expect(selectDeviceStakingEntryByWarning(createState(), 'outdated-provider')).toBe(
            selectDeviceStakingEntryByWarning(createState(), 'outdated-provider'),
        );
    });

    it('is null without the warning', () => {
        expect(selectDeviceStakingEntryByWarning(createState(), 'missing-drep')).toBeNull();
    });

    it('ignores hidden accounts and other devices', () => {
        const state = createState({
            accounts: [
                { ...adaFiveBinariesAccount, visible: false },
                { ...adaFiveBinariesAccount, deviceState: OTHER_DEVICE_STATIC_SESSION_ID },
            ],
        });

        expect(selectDeviceStakingEntryByWarning(state, 'outdated-provider')).toBeNull();
    });
});
