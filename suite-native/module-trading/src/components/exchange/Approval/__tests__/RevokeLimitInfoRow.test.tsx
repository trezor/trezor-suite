import { type TestStore, initStore, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { RevokeLimitInfoRow } from '../RevokeLimitInfoRow';

describe('RevokeLimitInfoRow', () => {
    let store: TestStore;

    const renderRevokeLimitInfoRow = () =>
        renderWithStoreProvider(<RevokeLimitInfoRow />, { store });

    beforeEach(() => {
        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };
        preloadedState!.wallet!.trading.exchange.preselectedQuote = {
            ...mercuryoFixedWorstQuote,
            preapprovedStringAmount: '100',
        };
        ({ store } = initStore(preloadedState));
    });

    it('should render that new limit is 0', () => {
        const { getByText } = renderRevokeLimitInfoRow();

        expect(getByText('0 USDC')).toBeOnTheScreen();
    });

    it('should display preapprovedStringAmount', () => {
        const { getByText } = renderRevokeLimitInfoRow();

        expect(getByText('100 USDC')).toBeOnTheScreen();
    });

    it('should render nothing when no quote is set', () => {
        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };
        preloadedState!.wallet!.trading.exchange.preselectedQuote = undefined;
        ({ store } = initStore(preloadedState));

        const { toJSON } = renderRevokeLimitInfoRow();

        expect(toJSON()).toBeNull();
    });
});
