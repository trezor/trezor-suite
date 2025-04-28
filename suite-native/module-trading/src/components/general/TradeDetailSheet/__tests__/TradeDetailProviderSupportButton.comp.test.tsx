import {
    PreloadedState,
    act,
    fireEvent,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { mercuryo } from '../../../../__fixtures__/providers';
import { getBuyTrade } from '../../../../__fixtures__/trades';
import { getInitializedTradingStateWithQuotes } from '../../../../__fixtures__/tradingState';
import { TradeDetailProviderSupportButton } from '../TradeDetailProviderSupportButton';
const mockOpenLink = jest.fn();

jest.mock('@suite-native/link', () => ({
    useOpenLink: () => mockOpenLink,
}));

describe('TradeDetailProviderSupportButton', () => {
    const getPreloadedState = (supportUrl: string | undefined): PreloadedState => ({
        wallet: {
            tradingNew: {
                ...getInitializedTradingStateWithQuotes(),
                trades: [getBuyTrade({ status: 'ERROR' })],
                buy: {
                    buyInfo: {
                        buyInfo: {
                            defaultAmountsOfFiatCurrencies: {},
                        },
                        providerInfos: {
                            ['mercuryo']: {
                                ...mercuryo,
                                supportUrl,
                            },
                        },
                    },
                },
            },
        },
    });

    const mercuryoSupportUrl = 'https://support.mercuryo.io';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = (supportUrl?: string | undefined) =>
        renderWithStoreProviderAsync(
            <TradeDetailProviderSupportButton provider="mercuryo" tradeType="buy" />,
            { preloadedState: getPreloadedState(supportUrl) },
        );

    it('should render button with correct text', async () => {
        const { getByText } = await renderComponent(mercuryoSupportUrl);

        expect(getByText('Go to provider support')).toBeTruthy();
    });

    it('should call openLink with correct URL when pressed', async () => {
        const { getByText } = await renderComponent(mercuryoSupportUrl);

        expect(getByText('Go to provider support')).toBeTruthy();

        act(() => {
            fireEvent.press(getByText('Go to provider support'));
        });

        expect(mockOpenLink).toHaveBeenCalledWith(mercuryoSupportUrl);
    });

    it('should not render when supportUrl is not provided', async () => {
        const { toJSON } = await renderComponent();

        expect(toJSON()).toBeNull();
    });

    it('should not render when supportUrl is empty string', async () => {
        const { toJSON } = await renderComponent(undefined);

        expect(toJSON()).toBeNull();
    });
});
