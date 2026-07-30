import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils-store';
import { btcAsset, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { ExchangePickersCard } from './ExchangePickersCard';
import { useExchangeForm } from '../../hooks/exchange/useExchangeForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingFeatureFlags,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

const reportMock = jest.fn();
const mockNavigate = jest.fn();
const services = {
    analytics: {
        report: reportMock,
    },
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

describe('ExchangePickersCard', () => {
    let exchangeForm: ExchangeFormType;
    let unmount: (() => void) | undefined;

    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: createTradingFeatureFlags(),
    };

    const renderExchangePickersCard = (
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) => {
        const result = renderWithTradingProvider(<ExchangePickersCard />, {
            services,
            tradeType: 'exchange',
            overrides: { ...baseOverrides, ...extraOverrides },
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

        ({ unmount } = result);

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        const { result } = renderHookWithTradingProvider(() => useExchangeForm(), {
            services,
            tradeType: 'exchange',
            overrides: baseOverrides,
        });
        exchangeForm = result.current;
    });

    afterEach(() => {
        unmount?.();
    });

    it('should render nothing when no picker can be displayed', () => {
        const { toJSON } = renderExchangePickersCard();

        expect(toJSON()).toBeNull();
    });

    it('should render receive account picker when receive asset is selected', () => {
        act(() => {
            exchangeForm.setValue('receiveAsset', btcAsset);
        });

        const { getByText } = renderExchangePickersCard();

        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
        ).toBeOnTheScreen();
    });

    it('should render provider picker when quotes are loading', () => {
        const { getByText } = renderExchangePickersCard({
            wallet: { trading: { exchange: { isLoading: true } } },
        });

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
    });

    it('should render provider picker when quote is selected', () => {
        act(() => {
            exchangeForm.setValue('quote', mercuryoFixedWorstQuote);
        });

        const { getByText } = renderExchangePickersCard();

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
    });
});
