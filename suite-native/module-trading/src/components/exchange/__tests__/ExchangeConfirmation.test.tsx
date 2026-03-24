import type { CryptoId, ExchangeTrade } from 'invity-api';

import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils';
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

describe('ExchangeConfirmation', () => {
    const mockUseExchangeSelectQuote =
        require('../../../hooks/exchange/useExchangeSelectQuote').useExchangeSelectQuote;

    const renderConfirmation = () =>
        renderWithStoreProvider(<ExchangeConfirmation />, {
            preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } },
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
    });

    it('should render "Continue" button when canProceed is true', () => {
        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        renderConfirmation();

        expect(queryContinueButton()).toBeOnTheScreen();
    });

    it('should not render "Continue" button when canProceed is false', () => {
        mockQuote.isDex = false;
        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: false,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        renderConfirmation();

        expect(queryContinueButton()).not.toBeOnTheScreen();
    });

    it('should not render "Revoke" button when approval is not needed', () => {
        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should not render "Revoke" button when approval is needed', () => {
        mockQuote.isDex = true;
        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is approved', () => {
        mockQuote.isDex = true;
        mockQuote.preapprovedStringAmount = '100';
        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is needs_increase', () => {
        mockQuote.isDex = true;
        mockQuote.preapprovedStringAmount = '100';
        mockQuote.status = 'APPROVAL_REQ';

        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });

    it('should not render "Revoke" button when approval status is null', () => {
        mockQuote.isDex = false;

        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is needs_revoke', () => {
        mockQuote.isDex = true;
        mockQuote.preapprovedStringAmount = '100';
        mockQuote.status = 'APPROVAL_REQ';
        mockQuote.send = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId;

        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });
});
