import { mockNetworksServices } from '@suite-common/networks/mocks';
import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { ExchangeApprovalLimitSheet } from './ExchangeApprovalLimitSheet';
import {
    createTradingTestStore,
    renderWithTradingProvider,
} from '../../../../test-utils/tradingTestUtils';

const mockOnDismiss = jest.fn();
const mockOnApprovalTypeSelect = jest.fn();

const testQuote = mercuryoFixedWorstQuote;

const checksummedUsdcAccount = {
    ...eth1NormalAccount,
    tokens: eth1NormalAccount.tokens?.map(token => ({
        ...token,
        contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    })),
};

const renderSheet = async (
    isVisible = true,
    quote = testQuote,
    selectedApprovalType: 'INFINITE' | 'MINIMAL' = 'INFINITE',
) => {
    const res = await renderWithTradingProvider(
        <ExchangeApprovalLimitSheet
            isVisible={isVisible}
            onDismiss={mockOnDismiss}
            quote={quote}
            onApprovalTypeSelect={mockOnApprovalTypeSelect}
            selectedApprovalType={selectedApprovalType}
        />,
        {
            tradeType: 'exchange',
            overrides: {
                wallet: { trading: { exchange: { selectedQuote: testQuote } } },
            },
            services: { networks: mockNetworksServices() },
        },
    );
    await act(async () => {
        await act(() => Promise.resolve());
    });

    return res;
};

describe('ExchangeApprovalLimitSheet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the sheet when visible', async () => {
        const { getByText } = await renderSheet();

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel')),
        ).toBeTruthy();
        expect(getByText('100 USDC')).toBeTruthy();
    });

    it('should show the token symbol when rendered outside the trading metadata provider and should provide its own metadata provider', async () => {
        const { getByText } = await renderWithStoreProvider(
            <ExchangeApprovalLimitSheet
                isVisible
                onDismiss={mockOnDismiss}
                quote={testQuote}
                onApprovalTypeSelect={mockOnApprovalTypeSelect}
                selectedApprovalType="MINIMAL"
            />,
            {
                services: {
                    store: createTradingTestStore({
                        tradeType: 'exchange',
                        overrides: { wallet: { accounts: [checksummedUsdcAccount] } },
                    }),
                    networks: mockNetworksServices(),
                },
            },
        );

        expect(getByText('100 USDC')).toBeTruthy();
    });

    it('should render unlimited approval option with correct details', async () => {
        const { getByText } = await renderSheet();

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel')),
        ).toBeTruthy();
        expect(
            getByText(
                getTranslation('moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.info'),
            ),
        ).toBeTruthy();
        expect(
            getByText(
                getTranslation('moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.alert', {
                    coinSymbol: 'USDC',
                }),
            ),
        ).toBeTruthy();
    });

    it('should render limited approval option with correct amount', async () => {
        const { getByText } = await renderSheet();

        expect(getByText('100 USDC')).toBeTruthy();
        expect(
            getByText(getTranslation('moduleTrading.exchangeApprovalLimitSheet.limitedCard.info')),
        ).toBeTruthy();
    });

    it('should render crypto icons for both cards', async () => {
        const { getAllByLabelText } = await renderSheet();

        const cryptoIcons = getAllByLabelText('eth:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
        expect(cryptoIcons).toHaveLength(2);
    });

    it('should display quote sendStringAmount in limited approval option', async () => {
        const customQuote = {
            ...testQuote,
            sendStringAmount: '250',
        };
        const { getByText } = await renderSheet(true, customQuote);

        expect(getByText('250 USDC')).toBeTruthy();
    });

    it('should pass correct props when INFINITE is selected', async () => {
        await renderSheet(true, testQuote, 'INFINITE');

        expect(mockOnApprovalTypeSelect).toBeDefined();
    });

    it('should pass correct props when MINIMAL is selected', async () => {
        await renderSheet(true, testQuote, 'MINIMAL');

        expect(mockOnApprovalTypeSelect).toBeDefined();
    });
});
