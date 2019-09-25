import { State as TransactionsState } from '@wallet-reducers/transactionReducer';
import { NETWORKS } from '@wallet-config';
import * as reducerUtils from '../reducerUtils';
import * as fixtures from './fixtures/reducerUtils';
import { Account } from '@wallet-types';

// TODO: write utils for generating txs, discoveries and remove 700+ lines of transactions fixtures
describe('reducerUtils', () => {
    fixtures.getAccountTransactions.forEach(f => {
        it(`reducerUtils.getAccountTransactions${f.testName}`, () => {
            expect(
                reducerUtils.getAccountTransactions(
                    // @ts-ignore TODO: Missing isAddress on TransactionTarget coming from connect/blockbook?
                    f.transactions as TransactionsState['transactions'],
                    f.account as Account,
                ),
            ).toEqual(f.result);
        });
    });

    it('reducerUtils.getSelectedNetwork', () => {
        const res = reducerUtils.getSelectedNetwork(NETWORKS, 'btc');
        if (res) {
            expect(res.name).toEqual('Bitcoin');
        } else {
            expect(res).toBeNull();
        }
    });

    fixtures.observeChanges.forEach(f => {
        it(`reducerUtils.observeChanges${f.testName}`, () => {
            // @ts-ignore
            expect(reducerUtils.observeChanges(f.prev, f.current, f.filter)).toEqual(f.result);
        });
    });

    it('reducerUtils.getAccountHash', () => {
        expect(reducerUtils.getAccountKey('descriptor', 'symbol', 'deviceState')).toEqual(
            'descriptor-symbol-deviceState',
        );
    });
});
