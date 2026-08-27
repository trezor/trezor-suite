import { type CryptoId, type SellFiatTrade } from 'invity-api';

import { configureMockStore } from '@suite-common/test-utils';
import { initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { StaticSessionId } from '@trezor/connect';

import { requestSellTradeThunk } from './requestSellTradeThunk';

const mockCreateQuoteLink = jest.fn((..._args: unknown[]) => Promise.resolve('https://return.url'));
jest.mock('src/utils/wallet/trading/sellUtils', () => ({
    ...jest.requireActual('src/utils/wallet/trading/sellUtils'),
    createQuoteLink: (...args: unknown[]) => mockCreateQuoteLink(...args),
}));

let redirectResponse: unknown;
const mockHandleTradeThunk = jest.fn((args: unknown) =>
    Object.assign(
        () => {
            if (redirectResponse) {
                (args as { processResponseData?: (r: unknown) => void }).processResponseData?.(
                    redirectResponse,
                );
            }

            return Promise.resolve();
        },
        { args },
    ),
);
jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        sellThunks: {
            ...actual.sellThunks,
            handleTradeThunk: (args: unknown) => mockHandleTradeThunk(args),
        },
    };
});

const mockSubmitRequestForm = jest.fn((..._args: unknown[]) => () => {});
jest.mock('../tradingCommonActions', () => ({
    ...jest.requireActual('../tradingCommonActions'),
    submitRequestForm: (...args: unknown[]) => mockSubmitRequestForm(...args),
}));

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

const ACCOUNT: Account = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('btcAccount'),
    balance: '100000000',
});

const QUOTE: SellFiatTrade = {
    exchange: 'cexdirect',
    orderId: 'order-1',
    paymentMethod: 'bankTransfer',
    country: 'DE',
    fiatCurrency: 'EUR',
    cryptoCurrency: 'bitcoin' as CryptoId,
    cryptoStringAmount: '0.01',
    amountInCrypto: true,
};

const buildStore = (accounts: Account[] = [ACCOUNT]) =>
    configureMockStore({
        extra: undefined,
        preloadedState: {
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            tokenDefinitions: {},
            wallet: {
                accounts,
                trading: {
                    ...tradingInitialState,
                    composedTransactionInfo: { selectedFee: 'normal', composed: undefined },
                    sell: {
                        ...tradingInitialState.sell,
                        sellInfo: { providerInfos: { cexdirect: { flow: 'PAYMENT_GATE' } } },
                        quotesRequest: {
                            country: 'DE',
                            fiatCurrency: 'EUR',
                            cryptoCurrency: 'bitcoin',
                            amountInCrypto: true,
                        },
                    },
                },
            },
        },
    });

describe('requestSellTradeThunk', () => {
    beforeEach(() => {
        mockCreateQuoteLink.mockClear();
        mockHandleTradeThunk.mockClear();
        mockSubmitRequestForm.mockClear();
        redirectResponse = undefined;
    });

    it('dispatches handleTradeThunk with the account, trade and resolved return url', async () => {
        const store = buildStore();

        await store.dispatch(requestSellTradeThunk({ quote: QUOTE })).unwrap();

        expect(mockHandleTradeThunk).toHaveBeenCalledWith(
            expect.objectContaining({
                account: ACCOUNT,
                trade: QUOTE,
                returnUrl: 'https://return.url',
            }),
        );
    });

    it('does nothing when no account can be resolved', async () => {
        const store = buildStore([]);

        await store.dispatch(requestSellTradeThunk({ quote: QUOTE })).unwrap();

        expect(mockHandleTradeThunk).not.toHaveBeenCalled();
    });

    it('submits the request form when the partner trade returns a redirect form', async () => {
        const form = { formMethod: 'IFRAME' };
        redirectResponse = { tradeForm: { form } };
        const store = buildStore();

        await store.dispatch(requestSellTradeThunk({ quote: QUOTE })).unwrap();

        expect(mockSubmitRequestForm).toHaveBeenCalledWith(form);
    });

    it('does not submit a request form when the partner trade does not redirect', async () => {
        const store = buildStore();

        await store.dispatch(requestSellTradeThunk({ quote: QUOTE })).unwrap();

        expect(mockSubmitRequestForm).not.toHaveBeenCalled();
    });
});
