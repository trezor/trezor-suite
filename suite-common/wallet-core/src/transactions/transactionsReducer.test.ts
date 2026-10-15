import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    enhanceTransaction,
    hasUnresolvedInputs,
    mergeResolvedInputs,
} from '@suite-common/wallet-utils';
import { type AccountTransaction } from '@trezor/connect';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import * as fixtures from './__fixtures__/transactionsReducer';
import {
    RESOLVED_FEE,
    accountWithUnresolvedInputs,
    getFullTransaction,
    getUnresolvedTransaction,
    resolvedForeignInput,
} from './__fixtures__/unresolvedInputs';
import { transactionsActions } from './transactionsActions';
import { prepareTransactionsReducer, transactionsInitialState } from './transactionsReducer';

const transactionsReducer = prepareTransactionsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadTransactions: mockReducer() },
});

describe(transactionsReducer.name, () => {
    describe('addTransaction', () => {
        fixtures.addTransaction.forEach(f => {
            it(f.description, () => {
                const result = transactionsReducer(
                    {
                        ...transactionsInitialState,
                        ...f.initialState,
                    },
                    {
                        type: transactionsActions.addTransaction.type,
                        payload: f.actionPayload,
                    },
                );

                expect(result.transactions).toStrictEqual(f.result);
            });
        });
    });

    describe('addTransaction of a transaction with unresolved inputs', () => {
        const account = accountWithUnresolvedInputs;
        const resolvedPending = enhanceTransaction(
            mergeResolvedInputs(getUnresolvedTransaction(), getFullTransaction()),
            account,
        );
        const unresolvedConfirmed = getUnresolvedTransaction({ blockHeight: 100 });

        const addTransactions = (
            stored: WalletAccountTransaction,
            transactions: AccountTransaction[],
        ) =>
            transactionsReducer(
                { ...transactionsInitialState, transactions: { [account.key]: [stored] } },
                transactionsActions.addTransaction({ transactions, account }),
            ).transactions[account.key];

        it('keeps the resolved inputs when the transaction is confirmed', () => {
            const [confirmed] = addTransactions(resolvedPending, [unresolvedConfirmed]) ?? [];

            expect(confirmed).toMatchObject({
                blockHeight: 100,
                blockTime: unresolvedConfirmed.blockTime,
                type: 'joint',
                amount: '4000',
                fee: RESOLVED_FEE,
                feeRate: '5',
                details: { vin: [{ value: '5000' }, resolvedForeignInput], totalInput: '25000' },
            });
            expect(confirmed && hasUnresolvedInputs(confirmed)).toBe(false);
            // A confirmed transaction can't be replaced anymore.
            expect(confirmed?.rbfParams).toBeUndefined();
        });

        it('keeps the resolved inputs when a pending transaction made by Suite is replaced', () => {
            const madeBySuite = { ...resolvedPending, deadline: 200 };
            const [pending] = addTransactions(madeBySuite, [getUnresolvedTransaction()]) ?? [];

            expect(pending).toMatchObject({ fee: RESOLVED_FEE });
            expect(pending).not.toHaveProperty('deadline');
            expect(pending?.rbfParams).toMatchObject({ baseFee: Number(RESOLVED_FEE) });
        });

        it('takes the transaction as it comes when the stored one was not resolved', () => {
            const unresolvedPending = enhanceTransaction(getUnresolvedTransaction(), account);

            const [confirmed] = addTransactions(unresolvedPending, [unresolvedConfirmed]) ?? [];

            expect(confirmed).toEqual(enhanceTransaction(unresolvedConfirmed, account));
        });

        it('takes a transaction with all input values as it comes', () => {
            const fullConfirmed = { ...getFullTransaction(), blockHeight: 100, fee: '1' };

            const [confirmed] = addTransactions(resolvedPending, [fullConfirmed]) ?? [];

            expect(confirmed).toEqual(enhanceTransaction(fullConfirmed, account));
        });
    });

    describe('removeTransaction', () => {
        fixtures.removeTransaction.forEach(f => {
            it(f.description, () => {
                const result = transactionsReducer(
                    {
                        ...transactionsInitialState,
                        ...f.initialState,
                    },
                    {
                        type: transactionsActions.removeTransaction.type,
                        payload: f.actionPayload,
                    },
                );

                expect(result.transactions).toStrictEqual(f.result);
            });
        });
    });
});
