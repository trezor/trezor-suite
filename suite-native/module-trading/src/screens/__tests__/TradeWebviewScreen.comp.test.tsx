import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { TradingWebViewScreen } from '../TradingWebViewScreen';

let mockRouteParams: {
    closeCallbackUrl: string;
    source?: { uri?: string; html?: string };
} = { closeCallbackUrl: '' };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: 'TradingWebViewScreen', params: { ...mockRouteParams } }),
}));

jest.mock('@suite-common/trading', () => {
    const actualImplementation = jest.requireActual('@suite-common/trading');

    return {
        ...actualImplementation,
        tradingThunks: {
            ...actualImplementation.tradingThunks,
            watchTradeThunk: () => ({ type: 'mocked-action' }),
        },
    };
});

describe('TradingWebViewScreen', () => {
    it('should render header', async () => {
        mockRouteParams = {
            closeCallbackUrl: 'CALLBACK_URL',
            source: { uri: 'SOURCE_URI', html: undefined },
        };
        const { getByTestId } = await renderWithStoreProviderAsync(<TradingWebViewScreen />);

        expect(getByTestId('@screen/sub-header/icon-left')).toBeTruthy();
    });

    it('should render error when no source is set', async () => {
        mockRouteParams = {
            closeCallbackUrl: 'CALLBACK_URL',
        };
        const { getByText } = await renderWithStoreProviderAsync(<TradingWebViewScreen />);

        expect(getByText('Something went wrong')).toBeTruthy();
    });

    it('should render error when sources are undefined', async () => {
        mockRouteParams = {
            closeCallbackUrl: 'CALLBACK_URL',
            source: { uri: undefined, html: undefined },
        };
        const { getByText } = await renderWithStoreProviderAsync(<TradingWebViewScreen />);

        expect(getByText('Something went wrong')).toBeTruthy();
    });
});
