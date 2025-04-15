import { ComposedTransactionInfo } from 'src/reducers/wallet/tradingReducer';
import { Account } from 'src/types/wallet';
import * as fixtures from 'src/utils/wallet/trading/__fixtures__/sellUtils';
import { createQuoteLink } from 'src/utils/wallet/trading/sellUtils';

const { QUOTE_REQUEST_FIAT, QUOTE_REQUEST_CRYPTO } = fixtures;

describe('trading/sell utils', () => {
    it('createQuoteLink', async () => {
        const accountMock = {
            index: 1,
            accountType: 'normal',
            symbol: 'btc',
        } as Account;
        const composedInfoMock = {
            selectedFee: 'custom',
            composed: {
                feePerByte: '1',
                maxFeePerGas: '2',
                maxPriorityFeePerGas: '3',
                feeLimit: '4',
            },
        } as ComposedTransactionInfo;
        expect(
            await createQuoteLink(QUOTE_REQUEST_FIAT, accountMock, composedInfoMock),
        ).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#sell-offers/btc/normal/1/qf/CZ/EUR/10/bitcoin/creditCard/custom/1/2/3/4`,
        );
        expect(
            await createQuoteLink(QUOTE_REQUEST_CRYPTO, accountMock, composedInfoMock),
        ).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#sell-offers/btc/normal/1/qc/CZ/EUR/0.001/bitcoin/creditCard/custom/1/2/3/4`,
        );
        expect(
            await createQuoteLink(
                QUOTE_REQUEST_CRYPTO,
                accountMock,
                composedInfoMock,
                '42134432141234',
            ),
        ).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#sell-offers/btc/normal/1/p-qc/CZ/EUR/0.001/bitcoin/creditCard/42134432141234/custom/1/2/3/4`,
        );
    });
});
