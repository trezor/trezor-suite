import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CryptoId, ExchangeTrade } from 'invity-api';

import { events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import {
    type ExchangeIssue,
    type TradingExchangeStepType,
    exchangeInitialState,
    getSimulatedReceiveAmount,
    initialState as tradingInitialState,
    useDexExchangeTxSimulation,
    useExchangeIssue,
} from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { type SuiteServices } from 'src/support/extraDependencies';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingOfferExchange } from './TradingOfferExchange';
import { extraDependenciesDesktopMock } from '../../../../../../../mocks/extraDependenciesDesktopMock';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

const mockSendTransaction = jest.fn(() => Promise.resolve(true));
const mockSignDataAndConfirm = jest.fn(() => Promise.resolve());
const mockGoto = jest.fn((payload: unknown) => ({ type: 'test/goto', payload }));

jest.mock('@suite/device', () => ({
    ...jest.requireActual('@suite/device'),
    useDevice: () => ({ device: { connected: true } }),
}));

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    goto: (payload: unknown) => mockGoto(payload),
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useDexExchangeTxSimulation: jest.fn(),
    useExchangeIssue: jest.fn(),
    getSimulatedReceiveAmount: jest.fn(),
}));

jest.mock('src/hooks/wallet/trading/useTradingExchangeTradeActions', () => ({
    useTradingExchangeTradeActions: () => ({
        account: mockWalletAccount({ symbol: asNetworkSymbol('eth') }),
        sendTransaction: mockSendTransaction,
        signDataAndConfirm: mockSignDataAndConfirm,
    }),
}));

jest.mock('./TradingOfferExchangeDetails', () => ({
    TradingOfferExchangeDetails: () => null,
}));

jest.mock('../TradingInfo/TradingInfoItem', () => ({
    TradingInfoItem: ({
        isReceive,
        amount,
        isAmountLoading,
    }: {
        isReceive?: boolean;
        amount?: string;
        isAmountLoading?: boolean;
    }) => (
        <div data-testid={`info-item-${isReceive ? 'receive' : 'send'}`}>
            {isAmountLoading ? 'loading' : amount}
        </div>
    ),
}));

const mockUseDexExchangeTxSimulation = jest.mocked(useDexExchangeTxSimulation);
const mockUseExchangeIssue = jest.mocked(useExchangeIssue);
const mockGetSimulatedReceiveAmount = jest.mocked(getSimulatedReceiveAmount);

const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;
const TETHER_CRYPTO_ID = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId;

const SELECTED_QUOTE: ExchangeTrade = {
    quoteId: 'e6f30f83-8c0f-4a5c-9fa0-2f8a5d0f5b53',
    exchange: 'lifi',
    status: 'CONFIRM',
    isDex: true,
    send: ETHEREUM_CRYPTO_ID,
    receive: TETHER_CRYPTO_ID,
    sendStringAmount: '0.463',
    receiveStringAmount: '1100',
};

const CROSS_CHAIN_QUOTE: ExchangeTrade = {
    ...SELECTED_QUOTE,
    receive: 'bitcoin' as CryptoId,
};

const SIGN_DATA_QUOTE: ExchangeTrade = {
    ...SELECTED_QUOTE,
    signData: { type: 'eip712-typed-data', data: {} },
};

const PRICE_IMPACT_ISSUE: ExchangeIssue = {
    type: 'price-impact',
    severity: 'warning',
    deviation: 0.12,
};

type SimulationOverrides = {
    isSimulationEnabled?: boolean;
    isSimulationLoading?: boolean;
    issue?: ExchangeIssue | null;
    simulatedReceiveAmount?: string | null;
    simulationError?: Error | null;
    selectedQuote?: ExchangeTrade;
    formStep?: TradingExchangeStepType;
};

const renderOfferExchange = ({
    isSimulationEnabled = true,
    isSimulationLoading = false,
    issue = null,
    simulatedReceiveAmount = null,
    simulationError = null,
    selectedQuote = SELECTED_QUOTE,
    formStep = exchangeInitialState.formStep,
}: SimulationOverrides = {}) => {
    mockUseDexExchangeTxSimulation.mockReturnValue({
        isEnabled: isSimulationEnabled,
        isLoading: isSimulationLoading,
        error: simulationError,
        data: undefined,
    });
    mockUseExchangeIssue.mockReturnValue({
        isSimulationEnabled,
        isSimulationLoading,
        isSimulation: isSimulationEnabled && !isSimulationLoading,
        issue,
    });
    mockGetSimulatedReceiveAmount.mockReturnValue(simulatedReceiveAmount);

    const store = configureMockStore({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                trading: {
                    ...tradingInitialState,
                    exchange: { ...exchangeInitialState, selectedQuote, formStep },
                },
            },
        } satisfies AppState,
    });

    const report = jest.fn();
    const services: SuiteServices = {
        ...extraDependenciesDesktopMock.services,
        analytics: mockDesktopAnalytics(report),
    };

    renderWithProviders(store, services, <TradingOfferExchange />);

    return { report };
};

describe('TradingOfferExchange', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([true, false])('reviews a swap under the swap title (isDex: %s)', isDex => {
        renderOfferExchange({ selectedQuote: { ...SELECTED_QUOTE, isDex } });

        expect(screen.getByText('TR_TRADING_REVIEW_SWAP')).toBeInTheDocument();
    });

    it('shows the quote receive amount until the simulation provides its own', () => {
        renderOfferExchange();

        expect(screen.getByTestId('info-item-receive')).toHaveTextContent('1100');
        expect(mockGetSimulatedReceiveAmount).toHaveBeenCalledWith(undefined, TETHER_CRYPTO_ID);
    });

    it('prefers the simulated receive amount over the quote one', () => {
        renderOfferExchange({ simulatedReceiveAmount: '950' });

        expect(screen.getByTestId('info-item-receive')).toHaveTextContent('950');
    });

    it('skeletons the receive amount and blocks the confirmation while simulating', () => {
        renderOfferExchange({ isSimulationLoading: true });

        expect(screen.getByTestId('info-item-receive')).toHaveTextContent('loading');
        expect(screen.getByTestId('@trading/offer/confirm-on-trezor-and-send')).toBeDisabled();
    });

    it('hides the Blockaid subtitle for a cross-chain swap, but keeps simulating', () => {
        renderOfferExchange({ selectedQuote: CROSS_CHAIN_QUOTE });

        expect(screen.queryByTestId('@trading/offer/simulation-subtitle')).not.toBeInTheDocument();
        expect(mockUseDexExchangeTxSimulation).toHaveBeenCalledWith(
            expect.objectContaining({ isEnabled: true }),
        );
    });

    it('renders neither the banner nor the Blockaid subtitle when the simulation is off', () => {
        renderOfferExchange({ isSimulationEnabled: false });

        expect(screen.queryByTestId('@trading/offer/simulation-subtitle')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@trading/offer/issue-banner')).not.toBeInTheDocument();
        expect(screen.getByTestId('@trading/offer/confirm-on-trezor-and-send')).toBeEnabled();
    });

    it('keeps the confirmation button next to a passive banner when the simulation is off', () => {
        renderOfferExchange({ isSimulationEnabled: false, issue: PRICE_IMPACT_ISSUE });

        expect(screen.getByTestId('@trading/offer/issue-banner')).toBeInTheDocument();
        expect(screen.queryByTestId('@trading/offer/continue-anyway')).not.toBeInTheDocument();
        expect(screen.getByTestId('@trading/offer/confirm-on-trezor-and-send')).toBeInTheDocument();
        expect(screen.queryByTestId('@trading/offer/back-to-trade-form')).not.toBeInTheDocument();
    });

    it('replaces the confirmation button with back to trade form on a simulated issue', async () => {
        renderOfferExchange({ issue: PRICE_IMPACT_ISSUE });

        expect(
            screen.queryByTestId('@trading/offer/confirm-on-trezor-and-send'),
        ).not.toBeInTheDocument();

        await userEvent.click(screen.getByTestId('@trading/offer/back-to-trade-form'));

        expect(mockGoto).toHaveBeenCalledWith({
            routeName: 'wallet-trading-exchange',
            preserveParams: true,
        });
    });

    it('sends the transaction from continue anyway inside the banner', async () => {
        const { report } = renderOfferExchange({ issue: PRICE_IMPACT_ISSUE });

        await userEvent.click(screen.getByTestId('@trading/offer/continue-anyway'));

        expect(mockSendTransaction).toHaveBeenCalledTimes(1);
        expect(report).toHaveBeenCalledWith({
            type: events.tradeExchangeEvent.name,
            payload: {
                action: 'continue',
                step: 'confirm-and-send',
                slippage: undefined,
            },
        });
    });

    it('reports the shown issue', () => {
        const { report } = renderOfferExchange({ issue: PRICE_IMPACT_ISSUE });

        expect(report).toHaveBeenCalledWith({
            type: events.tradingExchangeIssueEvent.name,
            payload: {
                issue: 'price-impact-warning',
                isSimulation: true,
            },
        });
    });

    it('reports leaving for the trade form as a cancellation', async () => {
        const { report } = renderOfferExchange({ issue: PRICE_IMPACT_ISSUE });

        await userEvent.click(screen.getByTestId('@trading/offer/back-to-trade-form'));

        expect(report).toHaveBeenCalledWith({
            type: events.tradeExchangeEvent.name,
            payload: {
                action: 'cancel',
                step: 'confirm-and-send',
                slippage: undefined,
            },
        });
    });

    it('reports continuing on the sign data step', async () => {
        const { report } = renderOfferExchange({
            selectedQuote: SIGN_DATA_QUOTE,
            formStep: 'SIGN_DATA',
        });

        await userEvent.click(screen.getByTestId('@trading/offer/confirm-on-trezor-and-send'));

        expect(mockSignDataAndConfirm).toHaveBeenCalledTimes(1);
        expect(report).toHaveBeenCalledWith({
            type: events.tradeExchangeEvent.name,
            payload: {
                action: 'continue',
                step: 'confirm-and-send',
                slippage: undefined,
            },
        });
    });
});
