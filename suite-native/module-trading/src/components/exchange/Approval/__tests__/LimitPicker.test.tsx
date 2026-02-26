import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { userEvent, within } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { TestStore, initStore, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { LimitPicker } from '../LimitPicker';

describe('LimitPicker', () => {
    let store: TestStore;

    const renderLimitPicker = () => renderWithStoreProviderAsync(<LimitPicker />, { store });

    beforeEach(() => {
        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        preloadedState!.wallet!.trading.exchange.preselectedQuote = exchangeQuotes[0];

        store = initStore(preloadedState).store;
    });

    it('should render Unlimited when no limit is specified', async () => {
        const { getByTestId } = await renderLimitPicker();

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
        const { getByTestId } = await renderLimitPicker();

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

    it('should render nothing without quote', async () => {
        store.dispatch(tradingExchangeActions.savePreselectedQuote(undefined));

        const { toJSON } = await renderLimitPicker();

        expect(toJSON()).toBeNull();
    });
});
