import { type UnknownAction } from '@reduxjs/toolkit';
import { type CryptoId, type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { gotoThunk } from '@suite/router';
import {
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-common/test-utils';
import {
    type TradingExchangeFormProps,
    initialState,
    tradingExchangeActions,
    tradingExchangeReducer,
} from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';

import { useTradingExchangeAllowanceFlow } from './useTradingExchangeAllowanceFlow';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const USDT_ACCOUNT_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

const ACCOUNT = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    tokens: [
        {
            standard: 'ERC20',
            contract: USDT_ACCOUNT_CONTRACT,
            symbol: 'usdt',
            decimals: 6,
            balance: '100',
        },
    ],
});

const mockRevokeApproval = mock((_quote: ExchangeTrade) => Promise.resolve(true));
const mockConfirmApproval = mock((_params: unknown) => Promise.resolve(undefined));

jest.mock('#src/hooks/wallet/trading/form/exchange/useExchangeApproval', () => ({
    useExchangeApproval: () => ({
        confirmApproval: mockConfirmApproval,
        revokeApproval: mockRevokeApproval,
    }),
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    selectTradingSendAccount: () => ACCOUNT,
}));

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    gotoThunk: jest.fn(() => ({ type: 'test/goto' })),
}));

const PROVIDER: ExchangeProviderInfo = {
    name: 'test-dex',
    companyName: 'Test DEX',
    logo: 'test-dex.svg',
    isActive: true,
    isFixedRate: false,
    isDex: true,
    buyTickers: [],
    sellTickers: [],
    addressFormats: {},
    supportUrl: '',
    kycPolicyType: 'noKYC',
};

const APPROVED_QUOTE: ExchangeTrade = {
    exchange: PROVIDER.name,
    status: 'CONFIRM',
    isDex: true,
    send: `ethereum--${USDT_CONTRACT}` as CryptoId,
    sendStringAmount: '100',
    preapprovedStringAmount: '50',
    receiveAddress: '0xreceive',
};

const BORROWED_REVOKE_QUOTE: ExchangeTrade = {
    ...APPROVED_QUOTE,
    status: 'APPROVAL_REQ',
    approvalType: 'ZERO',
};

const renderAllowanceFlow = () => {
    const analytics = mockDesktopAnalytics();
    const preloadedState: MockSuiteState = {
        ...mockInitialAppState,
        wallet: {
            ...mockInitialAppState.wallet,
            trading: {
                ...initialState,
                exchange: {
                    ...initialState.exchange,
                    selectedQuote: APPROVED_QUOTE,
                    formValues: { selectedFee: 'normal' } as TradingExchangeFormProps,
                    exchangeInfo: {
                        providerInfos: { [PROVIDER.name]: PROVIDER },
                        buyCryptoIds: [],
                        sellCryptoIds: [],
                    },
                },
            },
        },
    };
    const { services } = createTestCompositionRoot<
        { services: DesktopAnalyticsDep },
        MockSuiteState
    >({
        reducer: (state: MockSuiteState = preloadedState, action: UnknownAction) => ({
            ...state,
            wallet: {
                ...state.wallet,
                trading: {
                    ...state.wallet.trading,
                    exchange: tradingExchangeReducer(state.wallet.trading.exchange, action),
                },
            },
        }),
        preloadedState,
        services: () => ({ analytics }),
    });

    mockRevokeApproval.mockImplementation(() => {
        services.store.dispatch(tradingExchangeActions.saveSelectedQuote(BORROWED_REVOKE_QUOTE));

        return Promise.resolve(true);
    });

    return {
        ...renderHookWithStoreProvider(() => useTradingExchangeAllowanceFlow(), { services }),
        analytics,
    };
};

describe('useTradingExchangeAllowanceFlow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('identifies the token by the contract address the account stores', () => {
        const { result } = renderAllowanceFlow();

        expect(result.current.token?.contractAddress).toBe(USDT_ACCOUNT_CONTRACT);
    });

    it('borrows a revoke quote from the provider to learn the spender', async () => {
        const { result } = renderAllowanceFlow();

        expect(result.current.spender).toBeUndefined();
        await waitFor(() => expect(mockRevokeApproval).toHaveBeenCalledWith(APPROVED_QUOTE));
        expect(mockRevokeApproval).toHaveBeenCalledTimes(1);
        expect(gotoThunk).not.toHaveBeenCalled();
    });

    it('returns to the form when the provider does not hand over the revoke quote', async () => {
        mockRevokeApproval.mockResolvedValueOnce(false);

        renderAllowanceFlow();

        await waitFor(() =>
            expect(gotoThunk).toHaveBeenCalledWith({
                routeName: 'wallet-trading-exchange',
                preserveParams: true,
            }),
        );
    });

    it('reports the revoke fee level in place of the swap form fee level', () => {
        const { result, analytics } = renderAllowanceFlow();

        result.current.reportAction('continue', 'high');
        result.current.reportAction('swap');

        expect(analytics.report).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ payload: expect.objectContaining({ selectedFee: 'high' }) }),
        );
        expect(analytics.report).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                payload: expect.objectContaining({ selectedFee: 'normal' }),
            }),
        );
    });

    it('hands the borrowed quote back to the provider on leave', async () => {
        const { unmount } = renderAllowanceFlow();
        await waitFor(() => expect(mockRevokeApproval).toHaveBeenCalled());

        unmount();

        expect(mockConfirmApproval).toHaveBeenCalledWith({
            trade: { ...APPROVED_QUOTE, approvalType: undefined },
            receiveAddress: APPROVED_QUOTE.receiveAddress,
        });
    });
});
