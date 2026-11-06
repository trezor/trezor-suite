import { type CryptoId, type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { initialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';

import { type GetTradingExchangeCryptoInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';

import { useTradingAllowanceModal } from './useTradingAllowanceModal';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

const mockConfirmApproval = mock((_params: unknown) => Promise.resolve(undefined));

jest.mock('src/hooks/wallet/trading/form/exchange/useExchangeApproval', () => ({
    useExchangeApproval: () => ({
        confirmApproval: mockConfirmApproval,
    }),
}));

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        selectTradingSendAccount: () => ACCOUNT,
    };
});

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

const SPENDER = '0x1111111111111111111111111111111111111111';
// ERC-20 `approve(spender, amount)` calldata: selector + 32-byte spender + 32-byte amount.
const APPROVE_CALLDATA = `0x095ea7b3${SPENDER.slice(2).padStart(64, '0')}${'1'.padStart(64, '0')}`;

const QUOTE: ExchangeTrade = {
    exchange: PROVIDER.name,
    status: 'APPROVAL_REQ',
    send: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
    sendStringAmount: '100',
    preapprovedStringAmount: '50',
    receiveAddress: '0xreceive',
    dexTx: { from: '0xowner', to: '0xtoken', value: '0', data: APPROVE_CALLDATA },
};

const getCryptoInfo = mock<GetTradingExchangeCryptoInfo>(() => ({
    sendCryptoLabel: 'USDT',
    sendCryptoNetworkSymbol: asNetworkSymbol('eth'),
    sendCryptoContractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    receiveCryptoLabel: 'ETH',
    receiveCryptoNetworkSymbol: asNetworkSymbol('eth'),
    receiveCryptoContractAddress: undefined,
    exchangeName: PROVIDER.companyName,
    selectedFee: 'normal',
}));

const renderAllowanceModal = ({
    isOpen = true,
    selectedQuote = QUOTE,
}: {
    isOpen?: boolean;
    selectedQuote?: ExchangeTrade;
}) => {
    const preloadedState: MockSuiteState = {
        ...mockInitialAppState,
        wallet: {
            ...mockInitialAppState.wallet,
            trading: {
                ...initialState,
                exchange: {
                    ...initialState.exchange,
                    selectedQuote,
                    exchangeInfo: {
                        providerInfos: { [PROVIDER.name]: PROVIDER },
                        buyCryptoIds: [],
                        sellCryptoIds: [],
                    },
                },
            },
        },
    };
    const analytics = mockDesktopAnalytics();
    const { services } = createTestCompositionRoot<
        { services: DesktopAnalyticsDep },
        MockSuiteState
    >({
        preloadedState,
        services: () => ({ analytics }),
    });
    const onClose = mock();

    const { result } = renderHookWithStoreProvider(
        () => useTradingAllowanceModal({ isOpen, onClose, getCryptoInfo }),
        { services },
    );

    return { result, onClose, analytics };
};

describe('useTradingAllowanceModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('derives the modal params from the selected quote', () => {
        const { result } = renderAllowanceModal({});

        expect(result.current.account).toBe(ACCOUNT);
        expect(result.current.modalParams).toEqual({
            provider: {
                ...PROVIDER,
                logo: expect.stringContaining(PROVIDER.logo),
                label: 'TR_TRADING_PROVIDER',
            },
            spender: SPENDER,
            tokenContractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            preapprovedAmount: '50',
            approveAmount: '100',
        });
    });

    it('has no params while the modal is closed', () => {
        const { result } = renderAllowanceModal({ isOpen: false });

        expect(result.current.modalParams).toBeNull();
    });

    it('has no params for a quote without approve calldata', () => {
        const { result } = renderAllowanceModal({
            selectedQuote: { ...QUOTE, dexTx: undefined },
        });

        expect(result.current.modalParams).toBeNull();
    });

    it('reports modal analytics with the crypto info', () => {
        const { result, analytics } = renderAllowanceModal({});

        result.current.onConfirm();

        expect(analytics.report).toHaveBeenCalledWith({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'revoke-modal',
                action: 'continue',
                ...getCryptoInfo(),
            },
        });
    });

    it('cancelling closes the modal and drops the pending approval type on the quote', async () => {
        const { result, onClose, analytics } = renderAllowanceModal({});

        await act(async () => {
            await result.current.onCancel();
        });

        expect(analytics.report).toHaveBeenCalledWith(
            expect.objectContaining({ payload: expect.objectContaining({ action: 'cancel' }) }),
        );
        expect(onClose).toHaveBeenCalled();
        expect(mockConfirmApproval).toHaveBeenCalledWith({
            trade: { ...QUOTE, approvalType: undefined },
            receiveAddress: QUOTE.receiveAddress,
        });
    });

    it('cancelling without a receive address does not contact the provider', async () => {
        const { result } = renderAllowanceModal({
            selectedQuote: { ...QUOTE, receiveAddress: undefined },
        });

        await act(async () => {
            await result.current.onCancel();
        });

        expect(mockConfirmApproval).not.toHaveBeenCalled();
    });
});
