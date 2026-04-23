import type { CryptoId, ExchangeTrade } from 'invity-api';

import { Button } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';

import { ExchangeConfirmation } from '../ExchangeConfirmation';

jest.mock('../../../hooks/exchange/useExchangeSelectQuote', () => ({
    useExchangeSelectQuote: jest.fn(),
}));

let mockQuote: ExchangeTrade;

jest.mock('../../../hooks/exchange/useExchangeFormContext', () => ({
    useExchangeFormContext: () => ({
        watch: () => mockQuote,
    }),
}));

jest.mock('../../../hooks/general/useTradingStellarActivateToken', () => ({
    useTradingStellarActivateToken: jest.fn(),
}));

describe('ExchangeConfirmation', () => {
    const mockUseExchangeSelectQuote =
        require('../../../hooks/exchange/useExchangeSelectQuote').useExchangeSelectQuote;
    const mockUseTradingStellarActivateToken =
        require('../../../hooks/general/useTradingStellarActivateToken').useTradingStellarActivateToken;

    const mockSelectQuote = (canProceed = true) =>
        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed,
            selectQuote: jest.fn(),
            selecteQuoteForRevoke: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

    const renderConfirmation = () =>
        renderWithStoreProvider(<ExchangeConfirmation />, {
            preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } },
            providers: ['intl'],
        });

    const queryContinueButton = () =>
        screen.queryByText(getTranslation('moduleTrading.tradingScreen.buttons.continue'));

    const queryRevokeButton = () =>
        screen.queryByText(getTranslation('moduleTrading.tradingScreen.buttons.revoke'));

    beforeEach(() => {
        mockQuote = {
            send: 'ethereum--0x6b175474e89094c44da98b954eedeac495271d0f' as CryptoId,
            receive: 'ethereum' as CryptoId,
            exchange: 'test-provider',
            isDex: false,
        };

        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: false,
            activateButtonElement: null,
        });
    });

    it('should render "Continue" button when canProceed is true', () => {
        mockSelectQuote();

        renderConfirmation();

        expect(queryContinueButton()).toBeOnTheScreen();
    });

    it('should not render "Continue" button when canProceed is false', () => {
        mockQuote.isDex = false;
        mockSelectQuote(false);

        renderConfirmation();

        expect(queryContinueButton()).not.toBeOnTheScreen();
    });

    it('should not render "Revoke" button when approval is not needed', () => {
        mockSelectQuote();

        renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should not render "Revoke" button when approval is needed', () => {
        mockQuote.isDex = true;
        mockSelectQuote();

        renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is approved', () => {
        mockQuote.isDex = true;
        mockQuote.preapprovedStringAmount = '100';
        mockSelectQuote();

        renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is needs_increase', () => {
        mockQuote.isDex = true;
        mockQuote.preapprovedStringAmount = '100';
        mockQuote.status = 'APPROVAL_REQ';

        mockSelectQuote();

        renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });

    it('should not render "Revoke" button when approval status is null', () => {
        mockQuote.isDex = false;

        mockSelectQuote();

        renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is needs_revoke', () => {
        mockQuote.isDex = true;
        mockQuote.preapprovedStringAmount = '100';
        mockQuote.status = 'APPROVAL_REQ';
        mockQuote.send = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId;

        mockSelectQuote();

        renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });

    it('should render activate button when trading inactive Stellar token', () => {
        mockSelectQuote();

        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: true,
            activateButtonElement: <Button>Activate</Button>,
        });

        const { queryByText } = renderConfirmation();
        expect(queryByText('Activate')).toBeTruthy();
        expect(queryByText('Continue')).toBeNull();
    });

    it('should not render activate button when not trading inactive Stellar token', () => {
        mockSelectQuote();

        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: false,
            activateButtonElement: <Button>Activate</Button>,
        });

        const { queryByText } = renderConfirmation();
        expect(queryByText('Activate')).toBeNull();
        expect(queryByText('Continue')).toBeTruthy();
    });

    it('should not render Revoke button, when canProceed is false', () => {
        mockQuote.isDex = true;
        mockQuote.preapprovedStringAmount = '100';
        mockQuote.status = 'APPROVAL_REQ';
        mockQuote.send = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId;

        mockSelectQuote(false);

        renderConfirmation();

        expect(queryRevokeButton()).toBeNull();
    });
});
