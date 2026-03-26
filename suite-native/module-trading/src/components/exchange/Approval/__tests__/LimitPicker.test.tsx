import { selectTradingExchangeActiveQuote, tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import {
    type TestStore,
    initStore,
    renderWithStoreProvider,
    userEvent,
    within,
} from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { LimitPicker } from '../LimitPicker';

describe('LimitPicker', () => {
    let store: TestStore;
    const mockOnApprovalTypeChange = jest.fn();

    const renderLimitPicker = () =>
        renderWithStoreProvider(
            <LimitPicker
                onApprovalTypeChange={approvalType => {
                    mockOnApprovalTypeChange(approvalType);
                    const quote = selectTradingExchangeActiveQuote(store.getState());
                    if (!quote) {
                        return;
                    }
                    store.dispatch(
                        tradingExchangeActions.saveSelectedQuote({ ...quote, approvalType }),
                    );
                }}
            />,
            { store },
        );

    beforeEach(() => {
        mockOnApprovalTypeChange.mockReset();

        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        preloadedState!.wallet!.trading.exchange.preselectedQuote = exchangeQuotes[0];

        store = initStore(preloadedState).store;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(exchangeQuotes[0]));
    });

    it('should render limit by default', () => {
        const { getByTestId } = renderLimitPicker();

        const picker = getByTestId('ExchangeApproval/LimitPicker');

        expect(within(picker).getByText('100 USDC')).toBeOnTheScreen();
        expect(
            within(picker).getByText(
                getTranslation('moduleTrading.exchangeApprovalLimitSheet.limitedCard.info'),
            ),
        ).toBeOnTheScreen();
    });

    it('should render Unlimited when selected by user', async () => {
        const { getByTestId } = renderLimitPicker();

        const picker = getByTestId('ExchangeApproval/LimitPicker');
        const sheet = getByTestId('ExchangeApproval/LimitSheet');

        await userEvent.press(within(sheet).getByText('Unlimited'));

        expect(mockOnApprovalTypeChange).toHaveBeenCalledTimes(1);
        expect(mockOnApprovalTypeChange).toHaveBeenCalledWith('INFINITE');
        expect(within(picker).getByText('Unlimited')).toBeOnTheScreen();
        expect(
            within(picker).getByText(
                getTranslation('moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.info'),
            ),
        ).toBeOnTheScreen();
        expect(
            within(picker).getByText(
                getTranslation('moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.alert', {
                    coinSymbol: 'USDC',
                }),
            ),
        ).toBeOnTheScreen();
        expect(selectTradingExchangeActiveQuote(store.getState())).toEqual(
            expect.objectContaining({ approvalType: 'INFINITE' }),
        );
    });

    it('should update limit when users selects new value', async () => {
        const { getByTestId } = renderLimitPicker();

        const picker = getByTestId('ExchangeApproval/LimitPicker');
        const sheet = getByTestId('ExchangeApproval/LimitSheet');

        await userEvent.press(within(sheet).getByText('100 USDC'));

        expect(mockOnApprovalTypeChange).toHaveBeenCalledTimes(1);
        expect(mockOnApprovalTypeChange).toHaveBeenCalledWith('MINIMAL');
        expect(within(picker).getByText('100 USDC')).toBeOnTheScreen();
        expect(
            within(picker).getByText(
                getTranslation('moduleTrading.exchangeApprovalLimitSheet.limitedCard.info'),
            ),
        ).toBeOnTheScreen();
        expect(selectTradingExchangeActiveQuote(store.getState())).toEqual(
            expect.objectContaining({ approvalType: 'MINIMAL' }),
        );
    });

    it('should render nothing without quote', () => {
        store.dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { toJSON } = renderLimitPicker();

        expect(toJSON()).toBeNull();
    });
});
