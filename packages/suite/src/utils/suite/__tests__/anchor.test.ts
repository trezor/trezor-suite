import * as anchorUtils from '../anchor';
import * as fixtures from '../__fixtures__/anchor';

describe('anchor utils', () => {
    test('getDefaultBackendType', () => {
        expect(anchorUtils.getTxAnchor('txid')).toBe('@account/transaction/txid');
    });

    fixtures.findAnchorTransactionPage.forEach(f => {
        it(`findAnchorTransactionPage ${f.testName}`, () => {
            expect(
                anchorUtils.findAnchorTransactionPage(
                    f.transactions,
                    f.transactionsPerPage,
                    f.anchor,
                ),
            ).toEqual(f.result);
        });
    });
});
