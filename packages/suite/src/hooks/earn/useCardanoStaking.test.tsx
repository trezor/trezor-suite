import { act } from '@testing-library/react';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { stakeInitialState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { useCardanoStaking } from './useCardanoStaking';

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
            symbol: asNetworkSymbol('ada'),
            availableBalance: '10000000',
            addresses: { change: [CHANGE_ADDRESS], used: [], unused: [] },
            utxo: [],
        },
        {
            ...networkSpecificDefaultCardano,
            misc: {
                staking: { address: '', isActive: false, rewards: '', poolId: null, drep: null },
            },
        },
    );

const renderCardanoStaking = (account: Account) => {
    const store = configureMockStore({
        extra: undefined,
        preloadedState: {
            wallet: {
                selectedAccount: { account },
                stake: stakeInitialState,
                transactions: { transactions: {} },
            },
        },
    });

    return renderHookWithStoreProvider(() => useCardanoStaking(), { store });
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

        const { result } = renderCardanoStaking(mockNeverStakedAccount());

        expect(result.current.delegatingAvailable.status).toBe(false);

        await act(() => result.current.calculateFeeAndDeposit('delegate'));

        expect(result.current.delegatingAvailable.status).toBe(true);
        expect(result.current.isStakingDisabled).toBe(false);
        expect(result.current.fee).toBe('174301');
        expect(result.current.deposit).toBe('2000000');
    });

    it('keeps staking unavailable when the composed delegation is not final', async () => {
        cardanoComposeTransactionMock.mockResolvedValue({
            success: true,
            payload: [{ type: 'nonfinal', fee: '174301', deposit: '2000000' }],
        });

        const { result } = renderCardanoStaking(mockNeverStakedAccount());

        await act(() => result.current.calculateFeeAndDeposit('delegate'));

        expect(result.current.delegatingAvailable).toEqual({
            status: false,
            reason: 'TX_NOT_FINAL',
        });
        expect(result.current.isStakingDisabled).toBe(true);
    });

    it('does not make withdrawing available when there is nothing to withdraw', async () => {
        const { result } = renderCardanoStaking(mockNeverStakedAccount());

        await act(() => result.current.calculateFeeAndDeposit('withdrawal'));

        expect(result.current.withdrawingAvailable.status).toBe(false);
        expect(cardanoComposeTransactionMock).not.toHaveBeenCalled();
    });
});
