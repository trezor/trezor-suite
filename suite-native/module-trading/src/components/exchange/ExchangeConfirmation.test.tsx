import type { CryptoId, ExchangeTrade } from 'invity-api';

import { Button } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, screen } from '@suite-native/test-utils-store';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { CONFIRMATION_TEST_ID, ExchangeConfirmation } from './ExchangeConfirmation';
import { useExchangeForm } from '../../hooks/exchange/useExchangeForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingFeatureFlags,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

jest.mock('../../hooks/exchange/useExchangeSelectQuote', () => ({
    useExchangeSelectQuote: jest.fn(),
}));

jest.mock('../../hooks/general/useTradingStellarActivateToken', () => ({
    useTradingStellarActivateToken: jest.fn(),
}));

describe('ExchangeConfirmation', () => {
    let exchangeForm: ExchangeFormType;

    const mockUseExchangeSelectQuote =
        require('../../hooks/exchange/useExchangeSelectQuote').useExchangeSelectQuote;
    const mockUseTradingStellarActivateToken =
        require('../../hooks/general/useTradingStellarActivateToken').useTradingStellarActivateToken;

    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: createTradingFeatureFlags(),
    };

    const defaultQuote: ExchangeTrade = {
        send: 'ethereum--0x6b175474e89094c44da98b954eedeac495271d0f' as CryptoId,
        receive: 'ethereum' as CryptoId,
        exchange: 'test-provider',
        isDex: false,
    };

    const setQuote = async (quote: ExchangeTrade | undefined) => {
        await act(() => {
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

    const renderConfirmation = async () =>
        await renderWithTradingProvider(<ExchangeConfirmation />, {
            tradeType: 'exchange',
            overrides: baseOverrides,
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    const queryContinueButton = () => screen.queryByTestId(CONFIRMATION_TEST_ID);

    const queryRevokeButton = () =>
        screen.queryByText(getTranslation('moduleTrading.tradingScreen.buttons.revoke'));

    beforeEach(async () => {
        jest.clearAllMocks();

        const { result } = await renderHookWithTradingProvider(() => useExchangeForm(), {
            tradeType: 'exchange',
            overrides: baseOverrides,
        });
        exchangeForm = result.current;
        await setQuote(defaultQuote);

        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: false,
            activateButtonElement: null,
        });
    });

    it('should render "Continue" button when canProceed is true', async () => {
        mockSelectQuote({});

        await renderConfirmation();

        expect(queryContinueButton()).toBeOnTheScreen();
    });

    it('should not render "Continue" button when canProceed is false', async () => {
        mockSelectQuote({ canProceed: false });

        await renderConfirmation();

        expect(queryContinueButton()).not.toBeOnTheScreen();
    });

    it('should render "Continue" button when canProceed is false but is isLoading', async () => {
        mockSelectQuote({ canProceed: false, isLoading: true });

        await renderConfirmation();

        expect(queryContinueButton()).toBeOnTheScreen();
        expect(queryContinueButton()).toBeDisabled();
    });

    it('should render "Continue" button when canProceed is false but is isDexQuoteApprovalPrefetchLoadingForCandidateQuote', async () => {
        mockSelectQuote({
            canProceed: false,
            isDexQuoteApprovalPrefetchLoadingForCandidateQuote: true,
        });

        await renderConfirmation();

        expect(queryContinueButton()).toBeOnTheScreen();
        expect(queryContinueButton()).toBeDisabled();
    });

    it('should not render "Revoke" button when approval is not needed', async () => {
        mockSelectQuote({});

        await renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should not render "Revoke" button when approval is needed', async () => {
        await setQuote({
            ...defaultQuote,
            isDex: true,
        });
        mockSelectQuote({});

        await renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is approved', async () => {
        await setQuote({
            ...defaultQuote,
            isDex: true,
            preapprovedStringAmount: '100',
        });
        mockSelectQuote({});

        await renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is needs_increase', async () => {
        await setQuote({
            ...defaultQuote,
            isDex: true,
            preapprovedStringAmount: '100',
            status: 'APPROVAL_REQ',
        });

        mockSelectQuote({});

        await renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });

    it('should not render "Revoke" button when approval status is null', async () => {
        await setQuote(undefined);
        mockSelectQuote({});

        await renderConfirmation();

        expect(queryRevokeButton()).not.toBeOnTheScreen();
    });

    it('should render "Revoke" button when approval status is needs_revoke', async () => {
        await setQuote({
            ...defaultQuote,
            isDex: true,
            preapprovedStringAmount: '100',
            status: 'APPROVAL_REQ',
            send: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
        });

        mockSelectQuote({});

        await renderConfirmation();

        expect(queryRevokeButton()).toBeOnTheScreen();
    });

    it('should render activate button when trading inactive Stellar token', async () => {
        mockSelectQuote({});

        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: true,
            activateButtonElement: <Button>Activate</Button>,
        });

        const { queryByText } = await renderConfirmation();
        expect(queryByText('Activate')).toBeTruthy();
        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        ).toBeNull();
    });

    it('should not render activate button when not trading inactive Stellar token', async () => {
        mockSelectQuote({});

        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: false,
            activateButtonElement: <Button>Activate</Button>,
        });

        const { queryByText } = await renderConfirmation();
        expect(queryByText('Activate')).toBeNull();
        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        ).toBeTruthy();
    });

    it('should not render Revoke button, when canProceed is false', async () => {
        await setQuote({
            ...defaultQuote,
            isDex: true,
            preapprovedStringAmount: '100',
            status: 'APPROVAL_REQ',
            send: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
        });

        mockSelectQuote({ canProceed: false });

        await renderConfirmation();

        expect(queryRevokeButton()).toBeNull();
    });
});
