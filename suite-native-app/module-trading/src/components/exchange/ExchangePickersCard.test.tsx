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

    const renderExchangePickersCard = async (
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) => {
        const result = await renderWithTradingProvider(<ExchangePickersCard />, {
            services,
            tradeType: 'exchange',
            overrides: { ...baseOverrides, ...extraOverrides },
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

        ({ unmount } = result);

        return result;
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const { result } = await renderHookWithTradingProvider(() => useExchangeForm(), {
            services,
            tradeType: 'exchange',
            overrides: baseOverrides,
        });
        exchangeForm = result.current;
    });

    afterEach(async () => {
        await unmount?.();
    });

    it('should render nothing when no picker can be displayed', async () => {
        const { toJSON } = await renderExchangePickersCard();

        expect(toJSON()).toBeNull();
    });

    it('should render receive account picker when receive asset is selected', async () => {
        await act(() => {
            exchangeForm.setValue('receiveAsset', btcAsset);
        });

        const { getByText } = await renderExchangePickersCard();

        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
        ).toBeOnTheScreen();
    });

    it('should render provider picker when quotes are loading', async () => {
        const { getByText } = await renderExchangePickersCard({
            wallet: { trading: { exchange: { isLoading: true } } },
        });

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
    });

    it('should render provider picker when quote is selected', async () => {
        await act(() => {
            exchangeForm.setValue('quote', mercuryoFixedWorstQuote);
        });

        const { getByText } = await renderExchangePickersCard();

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
    });
});
