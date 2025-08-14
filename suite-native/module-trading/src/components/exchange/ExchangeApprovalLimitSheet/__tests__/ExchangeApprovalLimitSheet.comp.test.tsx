import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { exchangeQuotes } from '../../../../__fixtures__/exchangeQuotes';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { ExchangeApprovalLimitSheet } from '../ExchangeApprovalLimitSheet';

const mockOnDismiss = jest.fn();

const testQuote = exchangeQuotes[0];

const getPreloadedState = (): PreloadedState => ({
    wallet: {
        tradingNew: {
            ...getInitializedTradingState('exchange'),
            exchange: {
                ...getInitializedTradingState('exchange').exchange,
                selectedQuote: testQuote,
            },
        },
    },
});

const getPreloadedStateWithoutQuote = (): PreloadedState => ({
    wallet: {
        tradingNew: {
            ...getInitializedTradingState('exchange'),
            exchange: {
                ...getInitializedTradingState('exchange').exchange,
                selectedQuote: undefined,
            },
        },
    },
});

const renderSheet = (isVisible = true, preloadedState = getPreloadedState()) =>
    renderWithStoreProviderAsync(
        <ExchangeApprovalLimitSheet isVisible={isVisible} onDismiss={mockOnDismiss} />,
        { preloadedState },
    );

describe('ExchangeApprovalLimitSheet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render nothing when quote is not available', async () => {
        const { toJSON } = await renderSheet(true, getPreloadedStateWithoutQuote());

        expect(toJSON()).toBeNull();
    });

    it('should render the sheet when visible', async () => {
        const { getByText } = await renderSheet();

        expect(getByText('Unlimited')).toBeTruthy();
        expect(getByText('200.32 USDC')).toBeTruthy();
    });

    it('should render unlimited approval option with correct details', async () => {
        const { getByText } = await renderSheet();

        expect(getByText('Unlimited')).toBeTruthy();
        expect(
            getByText(
                "Skip future approval requests and save on fees by approving unlimited USDC. Mercuryo will have full access to your USDC, and your funds may be at risk if they're ever compromised.",
            ),
        ).toBeTruthy();
    });

    it('should render limited approval option with correct amount', async () => {
        const { getByText } = await renderSheet();

        expect(getByText('200.32 USDC')).toBeTruthy();
        expect(
            getByText(
                "Approve only the amount needed for this swap. You'll need to approve again (and pay a fee) for future swaps, but this reduces risk by keeping you in full control of your USDC.",
            ),
        ).toBeTruthy();
    });

    it('should render crypto icons for both cards', async () => {
        const { getAllByLabelText } = await renderSheet();

        const cryptoIcons = getAllByLabelText('eth0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
        expect(cryptoIcons).toHaveLength(2);
    });

    it('should render provider company name in unlimited card description', async () => {
        const { getByText } = await renderSheet();

        expect(
            getByText(
                "Skip future approval requests and save on fees by approving unlimited USDC. Mercuryo will have full access to your USDC, and your funds may be at risk if they're ever compromised.",
            ),
        ).toBeTruthy();
    });
});
