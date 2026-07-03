import type { CryptoId, SellFiatTrade } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingSellTradeRequest } from '../useTradingSellTradeRequest';

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

const ACCOUNT = mockWalletAccount({ symbol: 'btc' });

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

type StateOverrides = {
    providerInfos?: Record<string, { flow?: string }>;
    quotesRequest?: Record<string, unknown>;
};

const buildState = (overrides: StateOverrides = {}) => {
    const providerInfos = overrides.providerInfos ?? { cexdirect: { flow: 'PAYMENT_GATE' } };
    const quotesRequest =
        'quotesRequest' in overrides
            ? overrides.quotesRequest
            : {
                  country: 'DE',
                  fiatCurrency: 'EUR',
                  cryptoCurrency: 'bitcoin',
                  amountInCrypto: true,
              };

    return {
        wallet: {
            trading: {
                composedTransactionInfo: { selectedFee: 'normal', composed: undefined },
                sell: {
                    sellInfo: { providerInfos },
                    quotesRequest,
                },
            },
        },
    };
};

const renderHelper = (account: Account | undefined, overrides?: StateOverrides) => {
    const store = configureMockStore({ preloadedState: buildState(overrides) });
    const { result } = renderHookWithStoreProvider(() => useTradingSellTradeRequest(account), {
        store,
    });

    return { store, result };
};

describe('useTradingSellTradeRequest', () => {
    beforeEach(() => {
        mockCreateQuoteLink.mockClear();
        mockHandleTradeThunk.mockClear();
        redirectResponse = undefined;
    });

    describe('getTradeRequestParams', () => {
        it('builds the return url via createQuoteLink and returns processResponseData', async () => {
            const { result } = renderHelper(ACCOUNT);

            const common = await result.current.getTradeRequestParams(QUOTE);

            expect(common?.returnUrl).toBe('https://return.url');
            expect(typeof common?.processResponseData).toBe('function');
            expect(mockCreateQuoteLink).toHaveBeenCalledWith(
                expect.objectContaining({
                    country: 'DE',
                    fiatCurrency: 'EUR',
                    cryptoCurrency: 'bitcoin',
                    paymentMethod: 'bankTransfer',
                }),
                ACCOUNT,
                { selectedFee: 'normal', composed: undefined },
                'order-1',
            );
        });

        it('passes no orderId for a non PAYMENT_GATE provider', async () => {
            const { result } = renderHelper(ACCOUNT, {
                providerInfos: { cexdirect: { flow: 'DEFAULT' } },
            });

            await result.current.getTradeRequestParams(QUOTE);

            expect(mockCreateQuoteLink).toHaveBeenCalledWith(
                expect.any(Object),
                ACCOUNT,
                expect.any(Object),
                undefined,
            );
        });

        it.each<[string, StateOverrides, Account | undefined]>([
            ['the account is missing', {}, undefined],
            ['the quotes request is missing', { quotesRequest: undefined }, ACCOUNT],
            ['the provider is unknown', { providerInfos: {} }, ACCOUNT],
        ])('returns undefined when %s', async (_, overrides, account) => {
            const { result } = renderHelper(account, overrides);

            const common = await result.current.getTradeRequestParams(QUOTE);

            expect(common).toBeUndefined();
            expect(mockCreateQuoteLink).not.toHaveBeenCalled();
        });
    });

    describe('handleSellTrade', () => {
        it('dispatches handleTradeThunk with the account, trade and resolved return url', async () => {
            const { result } = renderHelper(ACCOUNT);

            await result.current.handleSellTrade(QUOTE);

            expect(mockHandleTradeThunk).toHaveBeenCalledWith(
                expect.objectContaining({
                    account: ACCOUNT,
                    trade: QUOTE,
                    returnUrl: 'https://return.url',
                }),
            );
        });

        it('does nothing when the account is missing', async () => {
            const { result } = renderHelper(undefined);

            await result.current.handleSellTrade(QUOTE);

            expect(mockHandleTradeThunk).not.toHaveBeenCalled();
        });

        it('returns true when the partner trade submits a redirect form', async () => {
            redirectResponse = { tradeForm: { form: { formMethod: 'IFRAME' } } };
            const { result } = renderHelper(ACCOUNT);

            const { isRedirecting } = await result.current.handleSellTrade(QUOTE);

            expect(isRedirecting).toBe(true);
        });

        it('returns false when the partner trade does not redirect', async () => {
            const { result } = renderHelper(ACCOUNT);

            const { isRedirecting } = await result.current.handleSellTrade(QUOTE);

            expect(isRedirecting).toBe(false);
        });
    });
});
