import * as fixtures from './__fixtures__/anchor';
import * as anchorUtils from './anchorUtils';

describe('anchor utils', () => {
    test('getDefaultBackendType', () => {
        expect(anchorUtils.getTxAnchor('txid')).toBe('@account/transaction/txid');
    });

    describe('getEarnYieldRowAnchor', () => {
        it('identifies the row by network, account type and index — never by account key', () => {
            expect(
                anchorUtils.getEarnYieldRowAnchor({
                    symbol: 'eth',
                    accountType: 'normal',
                    accountIndex: 0,
                    vaultId: 'ethereum:1:0x58d97b57bb95320f9a05dc918aef65434969c2b2',
                }),
            ).toBe(
                '@earn/yield/eth-normal-0/ethereum:1:0x58d97b57bb95320f9a05dc918aef65434969c2b2',
            );
        });

        it('distinguishes accounts of the same network holding the same vault', () => {
            const vaultId = 'ethereum:1:0x58d97b57bb95320f9a05dc918aef65434969c2b2';

            expect(
                anchorUtils.getEarnYieldRowAnchor({
                    symbol: 'eth',
                    accountType: 'normal',
                    accountIndex: 0,
                    vaultId,
                }),
            ).not.toBe(
                anchorUtils.getEarnYieldRowAnchor({
                    symbol: 'eth',
                    accountType: 'normal',
                    accountIndex: 1,
                    vaultId,
                }),
            );
        });
    });

    describe('isEarnYieldRowAnchor', () => {
        it.each([
            ['@earn/yield/eth-normal-0/ethereum:1:0xabc', true],
            ['@earn/yield', false],
            ['@earn/staking', false],
            ['@account/transaction/txid', false],
            [undefined, false],
        ])('%s -> %s', (anchor, expected) => {
            expect(anchorUtils.isEarnYieldRowAnchor(anchor)).toBe(expected);
        });
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
