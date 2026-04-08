import type { CryptoId, ExchangeTrade } from 'invity-api';

import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { ExchangeFormQuoteDebugView } from '../ExchangeFormQuoteDebugView';

let mockQuote: ExchangeTrade | undefined;
let mockDebugMode: boolean;

jest.mock('../../../hooks/exchange/useExchangeFormContext', () => ({
    useExchangeFormContext: () => ({
        watch: () => mockQuote,
    }),
}));

jest.mock('@suite-native/trading-debug', () => {
    const original = jest.requireActual('@suite-native/trading-debug');

    return {
        ...original,
        DebugModeView: ({ children }: { children: React.ReactNode }) =>
            mockDebugMode ? children : null,
    };
});

describe('ExchangeFormQuoteDebugView', () => {
    const renderDebugView = () => renderWithBasicProvider(<ExchangeFormQuoteDebugView />);

    beforeEach(() => {
        mockQuote = undefined;
        mockDebugMode = false;
    });

    it('should render nothing when debug mode is disabled', () => {
        mockDebugMode = false;
        mockQuote = {
            send: 'ethereum' as CryptoId,
            receive: 'bitcoin' as CryptoId,
            exchange: 'test-provider',
            isDex: false,
        };

        const { toJSON } = renderDebugView();

        expect(toJSON()).toBeNull();
    });

    it('should render approval status "none" when no quote is selected', () => {
        mockDebugMode = true;
        mockQuote = undefined;

        renderDebugView();

        expect(screen.getByText('Approval status')).toBeOnTheScreen();
        expect(screen.getByText('none')).toBeOnTheScreen();
    });

    it('should render "not defined" for pre-approved amount when no quote is selected', () => {
        mockDebugMode = true;
        mockQuote = undefined;

        renderDebugView();

        expect(screen.getByText('Pre-approved')).toBeOnTheScreen();
        expect(screen.getByText('not defined')).toBeOnTheScreen();
    });

    it('should render approval status "not_needed" for a non-DEX quote', () => {
        mockDebugMode = true;
        mockQuote = {
            send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
            receive: 'bitcoin' as CryptoId,
            exchange: 'mercuryo',
            isDex: false,
        };

        renderDebugView();

        expect(screen.getByText('not_needed')).toBeOnTheScreen();
    });

    it('should render approval status "needs_approval" for a DEX quote without pre-approval', () => {
        mockDebugMode = true;
        mockQuote = {
            send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
            receive: 'bitcoin' as CryptoId,
            exchange: 'invity',
            isDex: true,
        };

        renderDebugView();

        expect(screen.getByText('needs_approval')).toBeOnTheScreen();
    });
});
