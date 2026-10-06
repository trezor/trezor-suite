import { type Store } from '@reduxjs/toolkit';

import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, userEvent, within } from '@suite-native/test-utils-store';
import { mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { LimitPicker } from './LimitPicker';
import { createTradingTestStore } from '../../../test-utils/tradingTestUtils';

type State = TradingRootState;

describe('LimitPicker', () => {
    let store: Store<State>;
    const mockOnApprovalTypeChange = jest.fn();

    const renderLimitPicker = async () =>
        await renderWithStoreProvider(
            <LimitPicker
                onApprovalTypeChange={approvalType => {
                    mockOnApprovalTypeChange(approvalType);
                    const quote = selectTradingExchangeSelectedQuote(store.getState());
                    if (!quote) {
                        return;
                    }
                    store.dispatch(
                        tradingExchangeActions.saveSelectedQuote({ ...quote, approvalType }),
                    );
                }}
            />,
            { services: { store } },
        );

    beforeEach(() => {
        mockOnApprovalTypeChange.mockReset();

        const quote = { ...mercuryoFixedWorstQuote, approvalStringAmount: '100' };

        store = createTradingTestStore({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    trading: {
                        exchange: {
                            selectedQuote: quote,
                        },
                    },
                },
            },
        });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quote));
    });

    it('should render limit by default', async () => {
        const { getByTestId } = await renderLimitPicker();

        const picker = getByTestId('ExchangeApproval/LimitPicker');

        expect(within(picker).getByText('100 USDC')).toBeOnTheScreen();
        expect(
            within(picker).getByText(
                getTranslation('moduleTrading.exchangeApprovalLimitSheet.limitedCard.info'),
            ),
        ).toBeOnTheScreen();
    });

    it('should render Unlimited when selected by user', async () => {
        const { getByTestId } = await renderLimitPicker();

        const picker = getByTestId('ExchangeApproval/LimitPicker');
        const sheet = getByTestId('ExchangeApproval/LimitSheet');

        await userEvent.press(
            within(sheet).getByText(
                getTranslation('moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel'),
            ),
        );

        expect(mockOnApprovalTypeChange).toHaveBeenCalledTimes(1);
        expect(mockOnApprovalTypeChange).toHaveBeenCalledWith('INFINITE');
        expect(
            within(picker).getByText(
                getTranslation('moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel'),
            ),
        ).toBeOnTheScreen();
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
        expect(selectTradingExchangeSelectedQuote(store.getState())).toEqual(
            expect.objectContaining({ approvalType: 'INFINITE' }),
        );
    });

    it('should update limit when users selects new value', async () => {
        const { getByTestId } = await renderLimitPicker();

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
        expect(selectTradingExchangeSelectedQuote(store.getState())).toEqual(
            expect.objectContaining({ approvalType: 'MINIMAL' }),
        );
    });

    it('should render nothing without quote', async () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { toJSON } = await renderLimitPicker();

        expect(toJSON()).toBeNull();
    });
});
