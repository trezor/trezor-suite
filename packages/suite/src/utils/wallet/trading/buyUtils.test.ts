import { type DesktopApiDep } from '@suite/desktop-app-api';
import { mockGetHttpReceiverAddress } from '@suite/desktop-app-api/mocks';
import { type Account } from '@suite-common/wallet-types';

import { createQuoteLink, createTxLink } from 'src/utils/wallet/trading/buyUtils';

import { buyUtilsFixtures } from './__fixtures__/buyUtils';

describe('buyUtils', () => {
    const deps: DesktopApiDep<'getHttpReceiverAddress'> = {
        desktopApi: { getHttpReceiverAddress: mockGetHttpReceiverAddress() },
    };

    const accountMock = {
        index: 1,
        accountType: 'normal',
        symbol: 'btc',
    } as Account;

    describe('createQuoteLink', () => {
        it('should create a quote link according to crypto request', async () => {
            expect(
                await createQuoteLink(deps, buyUtilsFixtures.QUOTE_REQUEST_CRYPTO, accountMock),
            ).toStrictEqual(
                `${window.location.origin}/coinmarket-redirect#offers/btc/normal/1/qc/CZ/EUR/0.001/bitcoin/creditCard`,
            );
        });

        it('should create a quote link according to fiat request', async () => {
            expect(
                await createQuoteLink(deps, buyUtilsFixtures.QUOTE_REQUEST_FIAT, accountMock),
            ).toStrictEqual(
                `${window.location.origin}/coinmarket-redirect#offers/btc/normal/1/qf/CZ/EUR/10/bitcoin/creditCard`,
            );
        });
    });

    it('createTxLink - should create transaction link', async () => {
        expect(await createTxLink(deps, buyUtilsFixtures.QUOTE, accountMock)).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#detail/btc/normal/1/e709df77-ee9e-4d12-98c2-84004a19c546`,
        );
    });
});
