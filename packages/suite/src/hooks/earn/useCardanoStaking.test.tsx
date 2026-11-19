import { act } from '@testing-library/react';

import { type StakingDep } from '@suite-common/earn-staking';
import {
    mockStakingQueryClient,
    mockStakingServices,
    mockStakingState,
} from '@suite-common/earn-staking/mocks';
import {
    type StakingPosition,
    type StakingProductInfo,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_STAKING_POOL } from '@suite-common/wallet-constants';
import { poolBech32ToHex } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import {
    MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
    MOCK_CARDANO_EVERSTAKE_POOL,
    mockWalletAccount,
} from '@suite-common/wallet-types/mocks';
import TrezorConnect, { type CardanoCertificate, PROTO } from '@trezor/connect';

import { renderHookWithProviders } from '#src/support/test-utils/hooksHelper';

import { useCardanoStaking } from './useCardanoStaking';
import { type MockSuiteState, mockInitialAppState } from '../../../mocks/mockInitialAppState';

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: {
            ...actual.default,
            cardanoComposeTransaction: jest.fn(),
        },
    };
});

const cardanoComposeTransactionMock = TrezorConnect.cardanoComposeTransaction as jest.Mock;

const ADA = asNetworkSymbol('ada');

const ADA_EVERSTAKE_PRODUCT = mockStakingProductDescriptor({
    networkSymbol: ADA,
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
    options: [],
});

const CHANGE_ADDRESS = {
    address: 'addr1change',
    path: "m/1852'/1815'/0'/1/0",
    transfers: 0,
    balance: '0',
    sent: '0',
    received: '0',
};

const mockNeverStakedAccount = (): Account =>
    mockWalletAccount(
        {
            symbol: ADA,
            availableBalance: '10000000',
            addresses: { change: [CHANGE_ADDRESS], used: [], unused: [] },
            utxo: [],
        },
        { misc: { staking: { isActive: false } } },
    );

const mockAccountWithRewardsButNoDrep = (): Account =>
    mockWalletAccount(
        {
            symbol: ADA,
            availableBalance: '10000000',
            addresses: { change: [CHANGE_ADDRESS], used: [], unused: [] },
            utxo: [],
        },
        {
            misc: {
                staking: {
                    address: 'stake1address',
                    isActive: true,
                    rewards: '1000000',
                    poolId: null,
                    drep: null,
                },
            },
        },
    );

const amount = (value: string) => stakingAmountSchema.parse(value);

const zeroBalances = {
    staked: amount('0'),
    pending: amount('0'),
    unstaking: amount('0'),
    withdrawable: amount('0'),
    rewards: amount('0'),
};

const mockDelegation = (overrides: Partial<StakingPosition> = {}): StakingPosition =>
    mockStakingPosition({
        productId: ADA_EVERSTAKE_PRODUCT.id,
        lockup: 'liquid',
        balances: { ...zeroBalances, staked: amount('10000000') },
        unlocks: [],
        targets: [],
        operations: ['unstake', 'claim', 'vote'],
        ...overrides,
    });

const everstakeTarget = (address: string, saturation: number) => ({
    address,
    providerId: ADA_EVERSTAKE_PRODUCT.providerId,
    name: 'Everstake',
    rate: 2.4,
    saturation,
});

type RenderParams = {
    account: Account;
    selectedAccount?: Account;
    position?: StakingPosition;
    productInfo?: StakingProductInfo;
};

const renderCardanoStaking = ({
    account,
    selectedAccount = account,
    position,
    productInfo,
}: RenderParams) => {
    const { services } = createTestCompositionRoot<{ services: StakingDep }, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            earn: {
                staking: mockStakingState({
                    descriptors: [ADA_EVERSTAKE_PRODUCT],
                    positions: position === undefined ? {} : { [account.key]: [position] },
                }),
            },
            wallet: {
                ...mockInitialAppState.wallet,
                accounts: [account],
                selectedAccount: {
                    status: 'loaded',
                    account: selectedAccount,
                    network: getNetwork(ADA),
                    params: undefined,
                },
            },
        },
        services: () => ({ staking: mockStakingServices() }),
    });

    return renderHookWithProviders(services, () => useCardanoStaking({ account }), {
        queryClient: mockStakingQueryClient({
            productInfo:
                productInfo === undefined ? {} : { [ADA_EVERSTAKE_PRODUCT.id]: productInfo },
        }),
    });
};

const getDelegationPool = () => {
    const [params] = cardanoComposeTransactionMock.mock.calls.at(-1) ?? [];

    return params?.certificates?.find(
        (certificate: CardanoCertificate) =>
            certificate.type === PROTO.CardanoCertificateType.STAKE_DELEGATION,
    )?.pool;
};

describe('useCardanoStaking', () => {
    beforeEach(() => {
        cardanoComposeTransactionMock.mockReset();
    });

    it('makes delegation available to an account that has never staked', async () => {
        cardanoComposeTransactionMock.mockResolvedValue({
            success: true,
            payload: [{ type: 'final', fee: '174301', deposit: '2000000' }],
        });

        const { result } = renderCardanoStaking({ account: mockNeverStakedAccount() });

        expect(result.current.delegatingAvailable.status).toBe(false);

        await act(() => result.current.calculateFeeAndDeposit('delegate'));

        expect(result.current.delegatingAvailable.status).toBe(true);
        expect(result.current.isStakingDisabled).toBe(false);
        expect(result.current.fee).toBe('174301');
        expect(result.current.deposit).toBe('2000000');
    });

    it('composes for the given account, not for the one selected in the wallet', async () => {
        cardanoComposeTransactionMock.mockResolvedValue({
            success: true,
            payload: [{ type: 'final', fee: '174301', deposit: '2000000' }],
        });
        const account = mockNeverStakedAccount();
        const selectedAccount = mockWalletAccount(
            {
                symbol: ADA,
                descriptor: asAccountDescriptor('selectedAdaDescriptor'),
                availableBalance: '0',
                addresses: { change: [CHANGE_ADDRESS], used: [], unused: [] },
                utxo: [],
            },
            { misc: { staking: { isActive: false } } },
        );

        const { result } = renderCardanoStaking({ account, selectedAccount });

        await act(() => result.current.calculateFeeAndDeposit('delegate'));

        expect(cardanoComposeTransactionMock).toHaveBeenCalledWith(
            expect.objectContaining({
                account: expect.objectContaining({ descriptor: account.descriptor }),
            }),
        );
        expect(result.current.isStakingDisabled).toBe(false);
    });

    it('keeps staking unavailable when the composed delegation is not final', async () => {
        cardanoComposeTransactionMock.mockResolvedValue({
            success: true,
            payload: [{ type: 'nonfinal', fee: '174301', deposit: '2000000' }],
        });

        const { result } = renderCardanoStaking({ account: mockNeverStakedAccount() });

        await act(() => result.current.calculateFeeAndDeposit('delegate'));

        expect(result.current.delegatingAvailable).toEqual({
            status: false,
            reason: 'TX_NOT_FINAL',
        });
        expect(result.current.isStakingDisabled).toBe(true);
    });

    it('keeps a known compose error as the reason', async () => {
        cardanoComposeTransactionMock.mockResolvedValue({
            success: true,
            payload: [{ type: 'error', error: 'UTXO_BALANCE_INSUFFICIENT' }],
        });

        const { result } = renderCardanoStaking({ account: mockNeverStakedAccount() });

        await act(() => result.current.calculateFeeAndDeposit('delegate'));

        expect(result.current.delegatingAvailable).toEqual({
            status: false,
            reason: 'UTXO_BALANCE_INSUFFICIENT',
        });
    });

    it('reduces an unknown compose error to a fixed reason', async () => {
        cardanoComposeTransactionMock.mockResolvedValue({
            success: true,
            payload: [{ type: 'error', error: 'Something the UI has no case for' }],
        });

        const { result } = renderCardanoStaking({ account: mockNeverStakedAccount() });

        await act(() => result.current.calculateFeeAndDeposit('delegate'));

        expect(result.current.delegatingAvailable).toEqual({
            status: false,
            reason: 'COMPOSE_FAILED',
        });
    });

    it('reports a failed compose by a fixed reason, never the message that may embed the payload', async () => {
        const utxoAddress = 'addr1q9utxo';
        cardanoComposeTransactionMock.mockResolvedValue({
            success: false,
            error: {
                code: 'Failure_UnknownCode',
                message: `Invalid parameter "account.utxo" (= [{"address":"${utxoAddress}"}]): Expected string`,
            },
        });

        const { result } = renderCardanoStaking({ account: mockNeverStakedAccount() });

        await act(() => result.current.calculateFeeAndDeposit('delegate'));

        expect(result.current.delegatingAvailable).toEqual({
            status: false,
            reason: 'COMPOSE_FAILED',
        });
    });

    it('reports the missing DRep delegation instead of composing a withdrawal the node would reject', async () => {
        const { result } = renderCardanoStaking({ account: mockAccountWithRewardsButNoDrep() });

        await act(() => result.current.calculateFeeAndDeposit('withdrawal'));

        expect(result.current.withdrawingAvailable).toEqual({
            status: false,
            reason: 'DREP_DELEGATION_REQUIRED',
        });
        expect(cardanoComposeTransactionMock).not.toHaveBeenCalled();
    });

    it('does not make withdrawing available when there is nothing to withdraw', async () => {
        const { result } = renderCardanoStaking({ account: mockNeverStakedAccount() });

        await act(() => result.current.calculateFeeAndDeposit('withdrawal'));

        expect(result.current.withdrawingAvailable.status).toBe(false);
        expect(cardanoComposeTransactionMock).not.toHaveBeenCalled();
    });

    it('delegates to the least saturated Everstake pool the product info caches', async () => {
        cardanoComposeTransactionMock.mockResolvedValue({
            success: true,
            payload: [{ type: 'final', fee: '174301', deposit: '2000000' }],
        });

        const { result } = renderCardanoStaking({
            account: mockNeverStakedAccount(),
            productInfo: mockStakingProductInfo({
                targets: [
                    everstakeTarget(MOCK_CARDANO_EVERSTAKE_POOL, 80),
                    everstakeTarget(MOCK_CARDANO_EVERSTAKE_OTHER_POOL, 40),
                ],
            }),
        });

        await act(() => result.current.calculateFeeAndDeposit('delegate'));

        expect(getDelegationPool()).toBe(poolBech32ToHex(MOCK_CARDANO_EVERSTAKE_OTHER_POOL));
    });

    it('keeps the fee calculation callback while the cached pools are the same', () => {
        const { result, rerender } = renderCardanoStaking({
            account: mockNeverStakedAccount(),
            productInfo: mockStakingProductInfo({
                targets: [everstakeTarget(MOCK_CARDANO_EVERSTAKE_POOL, 80)],
            }),
        });
        const { calculateFeeAndDeposit } = result.current;

        rerender();

        expect(result.current.calculateFeeAndDeposit).toBe(calculateFeeAndDeposit);
    });

    it('delegates to the default Everstake pool while no product info is cached', async () => {
        cardanoComposeTransactionMock.mockResolvedValue({
            success: true,
            payload: [{ type: 'final', fee: '174301', deposit: '2000000' }],
        });

        const { result } = renderCardanoStaking({ account: mockNeverStakedAccount() });

        await act(() => result.current.calculateFeeAndDeposit('delegate'));

        expect(getDelegationPool()).toBe(CARDANO_EVERSTAKE_STAKING_POOL.hex);
    });

    it('reports the reward balance of the position, in lovelace', () => {
        const { result } = renderCardanoStaking({
            account: mockAccountWithRewardsButNoDrep(),
            position: mockDelegation({
                balances: {
                    ...zeroBalances,
                    staked: amount('11000000'),
                    rewards: amount('1000000'),
                },
            }),
        });

        expect(result.current.rewards).toBe('1000000');
    });

    it('keeps staking disabled while a staking transaction of the position is pending', async () => {
        cardanoComposeTransactionMock.mockResolvedValue({
            success: true,
            payload: [{ type: 'final', fee: '174301', deposit: '2000000' }],
        });

        const { result } = renderCardanoStaking({
            account: mockNeverStakedAccount(),
            position: mockDelegation({
                pendingTransactions: [{ txid: 'tx-stake', operation: 'stake' }],
            }),
        });

        await act(() => result.current.calculateFeeAndDeposit('delegate'));

        expect(result.current.delegatingAvailable.status).toBe(true);
        expect(result.current.isStakingDisabled).toBe(true);
    });
});
