import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
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

    const renderLimitPicker = () => renderWithStoreProvider(<LimitPicker />, { store });

    beforeEach(() => {
        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        preloadedState!.wallet!.trading.exchange.preselectedQuote = exchangeQuotes[0];

        store = initStore(preloadedState).store;
    });

    it('should render Unlimited when no limit is specified', () => {
        const { getByTestId } = renderLimitPicker();

        const picker = getByTestId('ExchangeApproval/LimitPicker');

        expect(within(picker).getByText('Unlimited')).toBeOnTheScreen();
        expect(
            within(picker).getByText(/^Approve unlimited USDC to skip future approval requests/),
        ).toBeOnTheScreen();
        expect(selectTradingExchangeSelectedQuote(store.getState())).toEqual(
            expect.objectContaining({ approvalType: 'INFINITE' }),
        );
    });

    it('should update limit when users selects new value', async () => {
        const { getByTestId } = renderLimitPicker();

        const picker = getByTestId('ExchangeApproval/LimitPicker');
        const sheet = getByTestId('ExchangeApproval/LimitSheet');

        await userEvent.press(within(sheet).getByText('100 USDC'));

        expect(within(picker).getByText('100 USDC')).toBeOnTheScreen();
        expect(
            within(picker).getByText(/^Approve only the amount needed for this swap/),
        ).toBeOnTheScreen();
        expect(selectTradingExchangeSelectedQuote(store.getState())).toEqual(
            expect.objectContaining({ approvalType: 'MINIMAL' }),
        );
    });

    it('should render nothing without quote', () => {
        store.dispatch(tradingExchangeActions.savePreselectedQuote(undefined));

        const { toJSON } = renderLimitPicker();

        expect(toJSON()).toBeNull();
    });
});
