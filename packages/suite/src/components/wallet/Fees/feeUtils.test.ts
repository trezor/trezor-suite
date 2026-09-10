import { type NetworkType } from '@suite-common/wallet-config';
import {
    type PrecomposedLevels,
    type PrecomposedTransaction,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/connect';

import { getFeeTooltipTextId, getIsTrc20Transfer, getSupportsAdjustableFees } from './feeUtils';

const token: TokenInfo = {
    standard: 'TRC20',
    contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    decimals: 6,
    symbol: 'usdt',
};

const baseFinalLevel: PrecomposedTransactionFinal = {
    type: 'final',
    totalSpent: '1000',
    fee: '100',
    feePerByte: '1',
    bytes: 100,
    inputs: [],
    outputs: [],
    outputsPermutation: [],
};

const finalLevel = (
    overrides: Partial<PrecomposedTransactionFinal> = {},
): PrecomposedTransactionFinal => ({ ...baseFinalLevel, ...overrides });

const levels = (normal: PrecomposedTransaction): PrecomposedLevels => ({ normal });

describe('getIsTrc20Transfer', () => {
    it('is true only for a Tron level carrying a token', () => {
        expect(
            getIsTrc20Transfer({
                networkType: 'tron',
                composedLevels: levels(finalLevel({ token })),
            }),
        ).toBe(true);
    });

    it.each<[string, NetworkType, PrecomposedLevels | undefined]>([
        ['a Tron level without a token', 'tron', levels(finalLevel())],
        [
            'a Tron level that failed to compose',
            'tron',
            levels({ type: 'error', error: 'NOT-ENOUGH-FUNDS' }),
        ],
        ['missing composed levels', 'tron', undefined],
        ['a token level on another network', 'ethereum', levels(finalLevel({ token }))],
    ])('is false for %s', (_, networkType, composedLevels) => {
        expect(getIsTrc20Transfer({ networkType, composedLevels })).toBe(false);
    });
});

describe('getSupportsAdjustableFees', () => {
    it.each<[NetworkType, boolean, boolean]>([
        ['bitcoin', false, true],
        ['ethereum', false, true],
        ['ripple', false, true],
        ['solana', false, false],
        ['tron', false, false],
        ['tron', true, true],
    ])('%s, token transfer %s → %s', (networkType, isTokenTransfer, expected) => {
        expect(getSupportsAdjustableFees({ networkType, isTokenTransfer })).toBe(expected);
    });
});

describe('getFeeTooltipTextId', () => {
    it.each<[NetworkType, string]>([
        ['ethereum', 'TR_EVM_MAX_FEE_DESC'],
        ['stellar', 'TR_STELLAR_FEE_DESC'],
        ['solana', 'TR_SOL_FEE_DESC'],
        ['ripple', 'TR_XRP_FEE_DESC'],
        ['tron', 'TR_TRON_FEE_DESC'],
        ['bitcoin', 'TR_TRANSACTION_FEE_DESC'],
    ])('%s → %s', (networkType, expected) => {
        expect(getFeeTooltipTextId({ networkType, composedLevels: levels(finalLevel()) })).toBe(
            expected,
        );
    });

    it('announces the activation fee when a Tron account has to be activated', () => {
        const composedLevels = levels(finalLevel({ accountActivationFee: '1000000' }));

        expect(getFeeTooltipTextId({ networkType: 'tron', composedLevels })).toBe(
            'TR_TRON_FEE_ACTIVATION_DESC',
        );
    });
});
