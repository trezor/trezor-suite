import { Account } from '@suite-common/wallet-types';

import { buyUtilsFixtures } from 'src/utils/wallet/trading/__fixtures__/buyUtils';
import { createQuoteLink, createTxLink, getStatusMessage } from 'src/utils/wallet/trading/buyUtils';

describe('buyUtils', () => {
    const accountMock = {
        index: 1,
        accountType: 'normal',
        symbol: 'btc',
    } as Account;

    describe('createQuoteLink', () => {
        it('should create a quote link according to crypto request', async () => {
            expect(
                await createQuoteLink(buyUtilsFixtures.QUOTE_REQUEST_CRYPTO, accountMock),
            ).toStrictEqual(
                `${window.location.origin}/coinmarket-redirect#offers/btc/normal/1/qc/CZ/EUR/0.001/bitcoin/creditCard`,
            );
        });

        it('should create a quote link according to fiat request', async () => {
            expect(
                await createQuoteLink(buyUtilsFixtures.QUOTE_REQUEST_FIAT, accountMock),
            ).toStrictEqual(
                `${window.location.origin}/coinmarket-redirect#offers/btc/normal/1/qf/CZ/EUR/10/bitcoin/creditCard`,
            );
        });
    });

    it('createTxLink - should create transaction link', async () => {
        expect(await createTxLink(buyUtilsFixtures.QUOTE, accountMock)).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#detail/btc/normal/1/e709df77-ee9e-4d12-98c2-84004a19c546`,
        );
    });

    it('getStatusMessage', () => {
        expect(getStatusMessage('LOGIN_REQUEST')).toBe('TR_BUY_STATUS_PENDING');
        expect(getStatusMessage('APPROVAL_PENDING')).toBe('TR_BUY_STATUS_PENDING');
        expect(getStatusMessage('SUBMITTED')).toBe('TR_BUY_STATUS_PENDING_GO_TO_GATEWAY');
        expect(getStatusMessage('BLOCKED')).toBe('TR_BUY_STATUS_ERROR');
        expect(getStatusMessage('ERROR')).toBe('TR_BUY_STATUS_ERROR');
        expect(getStatusMessage('SUCCESS')).toBe('TR_BUY_STATUS_SUCCESS');
    });
});
