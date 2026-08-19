import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';

import { applyYieldFeeAffordability } from './yieldFeeAffordabilityUtils';

const usdc = { contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' } as TokenInfo;

const buildPrecomposedTransaction = ({
    fee,
    token,
    totalSpent,
}: {
    fee: string;
    token?: TokenInfo;
    totalSpent: string;
}): PrecomposedTransactionFinal =>
    ({
        type: 'final',
        fee,
        totalSpent,
        token,
    }) as PrecomposedTransactionFinal;

describe('applyYieldFeeAffordability', () => {
    // Token flows (deposit, withdraw, unwrap) spend the native coin on the fee only; `totalSpent`
    // counts the transferred token, not the balance the fee is paid from.
    const tokenTransaction = buildPrecomposedTransaction({
        fee: '21000000000000',
        token: usdc,
        totalSpent: '1000000',
    });
    // A wrap moves the native coin itself, so `totalSpent` already covers amount plus fee.
    const nativeTransaction = buildPrecomposedTransaction({
        fee: '21000000000000',
        totalSpent: '1021000000000000',
    });

    it('keeps a token-flow level the balance can cover', () => {
        expect(applyYieldFeeAffordability(tokenTransaction, '21000000000000')).toBe(
            tokenTransaction,
        );
    });

    it('rejects a token-flow level one wei short of its fee', () => {
        expect(applyYieldFeeAffordability(tokenTransaction, '20999999999999')).toEqual({
            type: 'error',
            error: 'AMOUNT_IS_NOT_ENOUGH',
            errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
        });
    });

    it('counts the wrapped amount and the fee for a native-spending level', () => {
        expect(applyYieldFeeAffordability(nativeTransaction, '1021000000000000')).toBe(
            nativeTransaction,
        );
        expect(applyYieldFeeAffordability(nativeTransaction, '1020999999999999')).toMatchObject({
            type: 'error',
        });
    });
});
