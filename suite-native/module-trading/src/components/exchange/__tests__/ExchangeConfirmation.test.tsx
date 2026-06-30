import type { CryptoId, ExchangeTrade } from 'invity-api';

import { Button } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, screen } from '@suite-native/test-utils-store';
import { type ExchangeFormType } from '@suite-native/trading-types';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingFeatureFlags,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { CONFIRMATION_TEST_ID, ExchangeConfirmation } from '../ExchangeConfirmation';

jest.mock('../../../hooks/exchange/useExchangeSelectQuote', () => ({
    useExchangeSelectQuote: jest.fn(),
}));

jest.mock('../../../hooks/general/useTradingStellarActivateToken', () => ({
    useTradingStellarActivateToken: jest.fn(),
}));

describe('ExchangeConfirmation', () => {
    let exchangeForm: ExchangeFormType;

    const mockUseExchangeSelectQuote =
        require('../../../hooks/exchange/useExchangeSelectQuote').useExchangeSelectQuote;
    const mockUseTradingStellarActivateToken =
        require('../../../hooks/general/useTradingStellarActivateToken').useTradingStellarActivateToken;

    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: createTradingFeatureFlags(),
    };

    const defaultQuote: ExchangeTrade = {
        send: 'ethereum--0x6b175474e89094c44da98b954eedeac495271d0f' as CryptoId,
        receive: 'ethereum' as CryptoId,
        exchange: 'test-provider',
        isDex: false,
    };

    const setQuote = (quote: ExchangeTrade | undefined) => {
        act(() => {
            exchangeForm.setValue('quote', quote);
        });
    };

    const mockSelectQuote = ({
        canProceed = true,
        isLoading = false,
        isDexQuoteApprovalPrefetchLoadingForCandidateQuote = false,
    }) =>
        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed,
            selectQuote: jest.fn(),
            selectQuoteForRevoke: jest.fn(),
            isLoading,
            isDexQuoteApprovalPrefetchLoadingForCandidateQuote,
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

    const renderConfirmation = () =>
        renderWithTradingProvider(<ExchangeConfirmation />, {
            tradeType: 'exchange',
            overrides: baseOverrides,
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    const queryContinueButton = () => screen.queryByTestId(CONFIRMATION_TEST_ID);

    const queryRevokeButton = () =>
        screen.queryByText(getTranslation('moduleTrading.tradingScreen.buttons.revoke'));

    beforeEach(() => {
        jest.clearAllMocks();

        const { result } = renderHookWithTradingProvider(() => useExchangeForm(), {
            tradeType: 'exchange',
            overrides: baseOverrides,
        });
        exchangeForm = result.current;
        setQuote(defaultQuote);

        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: false,
            activateButtonElement: null,
        });
    });

    it('should render "Continue" button when canProceed is true', () => {
        mockSelectQuote({});

        renderConfirmation();

        expect(queryContinueButton()).toBeOnTheScreen();
    });

    it('should not render "Continue" button when canProceed is false', () => {
        mockSelectQuote({ canProceed: false });

        renderConfirmation();

        expect(queryContinueButton()).not.toBeOnTheScreen();
    });

    it('should render "Continue" button when canProceed is false but is isLoading', () => {
        mockSelectQuote({ canProceed: false, isLoading: true });

        renderConfirmation();

        expect(queryContinueButton()).toBeOnTheScreen();
        expect(queryContinueButton()).toBeDisabled();
    });

    it('should render "Continue" button when canProceed is false but is isDexQuoteApprovalPrefetchLoadingForCandidateQuote', () => {
        mockSelectQuote({
            canProceed: false,
            isDexQuoteApprovalPrefetchLoadingForCandidateQuote: true,
        });

        renderConfirmation();

        expect(queryContinueButton()).toBeOnTheScreen();
        expect(queryContinueButton()).toBeDisabled();
    });

    it('should not render "Revoke" button when approval is not needed', () => {
        mockSelectQuote({});

        renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should not render "Revoke" button when approval is needed', () => {
        setQuote({
            ...defaultQuote,
            isDex: true,
        });
        mockSelectQuote({});

        renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is approved', () => {
        setQuote({
            ...defaultQuote,
            isDex: true,
            preapprovedStringAmount: '100',
        });
        mockSelectQuote({});

        renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is needs_increase', () => {
        setQuote({
            ...defaultQuote,
            isDex: true,
            preapprovedStringAmount: '100',
            status: 'APPROVAL_REQ',
        });

        mockSelectQuote({});

        renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });

    it('should not render "Revoke" button when approval status is null', () => {
        setQuote(undefined);
        mockSelectQuote({});

        renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is needs_revoke', () => {
        setQuote({
            ...defaultQuote,
            isDex: true,
            preapprovedStringAmount: '100',
            status: 'APPROVAL_REQ',
            send: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
        });

        mockSelectQuote({});

        renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });

    it('should render activate button when trading inactive Stellar token', () => {
        mockSelectQuote({});

        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: true,
            activateButtonElement: <Button>Activate</Button>,
        });

        const { queryByText } = renderConfirmation();
        expect(queryByText('Activate')).toBeTruthy();
        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        ).toBeNull();
    });

    it('should not render activate button when not trading inactive Stellar token', () => {
        mockSelectQuote({});

        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: false,
            activateButtonElement: <Button>Activate</Button>,
        });

        const { queryByText } = renderConfirmation();
        expect(queryByText('Activate')).toBeNull();
        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        ).toBeTruthy();
    });

    it('should not render Revoke button, when canProceed is false', () => {
        setQuote({
            ...defaultQuote,
            isDex: true,
            preapprovedStringAmount: '100',
            status: 'APPROVAL_REQ',
            send: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
        });

        mockSelectQuote({ canProceed: false });

        renderConfirmation();

        expect(queryRevokeButton()).toBeNull();
    });
});
