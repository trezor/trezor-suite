import { tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { TradingStackRoutes } from '@suite-native/navigation';
import { type TestStore, initStore, renderWithStoreProvider } from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import {
    TradingConfirmingScreen,
    type TradingConfirmingScreenProps,
} from '../TradingConfirmingScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: 'TradingConfirming', params: undefined }),
    useNavigation: () => ({ popToTop: jest.fn() }),
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnected: () => true,
}));

const testQuote = exchangeQuotes[0];

describe('TradingConfirmingScreen', () => {
    let store: TestStore;

    const renderScreen = (props: Partial<TradingConfirmingScreenProps> = {}) =>
        renderWithStoreProvider(
            <TradingConfirmingScreen
                variant="approve"
                continueOn={TradingStackRoutes.TradingExchangePreview}
                {...props}
            />,
            { store },
        );

    beforeEach(() => {
        store = initStore({ wallet: getWalletState({ tradeType: 'exchange' }) }).store;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
    });

    it('should render approve header when variant is approve', () => {
        const { getByTestId } = renderScreen({ variant: 'approve' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent(
            getTranslation('moduleTrading.tradingConfirmationScreen.approveHeaderTitle', {
                symbol: 'USDC',
            }),
        );
    });

    it('should render revoke header when variant is revoke', () => {
        const { getByTestId } = renderScreen({ variant: 'revoke' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent(
            getTranslation('moduleTrading.tradingConfirmationScreen.revokeHeaderTitle', {
                symbol: 'USDC',
            }),
        );
    });
});
