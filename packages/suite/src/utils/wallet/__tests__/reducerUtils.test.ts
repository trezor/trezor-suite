import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { NETWORKS } from '@wallet-config';
import * as reducerUtils from '../reducerUtils';
import * as fixtures from './fixtures/reducerUtils';
import { Account, Discovery } from '@wallet-types';

describe('reducerUtils', () => {
    fixtures.getAccountTransactions.forEach(f => {
        it(`reducerUtils.getAccountTransactions${f.testName}`, () => {
            // @ts-ignore
            expect(
                reducerUtils.getAccountTransactions(
                    f.transactions as WalletAccountTransaction[],
                    f.account as Account,
                ),
            ).toEqual(f.result);
        });
    });

    fixtures.getDiscoveryProcess.forEach(f => {
        it(`reducerUtils.getDiscoveryProcess${f.testName}`, () => {
            expect(
                reducerUtils.getDiscoveryProcess(f.discoveries as Discovery[], f.device),
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
});
