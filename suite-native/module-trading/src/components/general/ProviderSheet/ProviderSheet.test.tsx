import { type TradingTradeType, type TradingType } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { screen } from '@suite-native/test-utils-store';
import { cexdirectFloatingQuote, mercuryoApplePayBuyQuote } from '@suite-native/trading-fixtures';
import { EMPTY_GROUPED_EXCHANGE_QUOTES_BY_RATE_TYPE } from '@suite-native/trading-state';

import { ProviderSheet, type ProviderSheetProps } from './ProviderSheet';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

describe('ProviderSheet', () => {
    const renderProviderSheet = async (
        props: Partial<ProviderSheetProps<TradingType, TradingTradeType>> = {},
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(
            <ProviderSheet
                onClose={jest.fn()}
                isVisible={true}
                onQuoteSelect={jest.fn()}
                quotes={{ fixed: [] }}
                tradingType="buy"
                {...props}
            />,
            { overrides },
        );

    afterEach(async () => {
        await screen.unmount();
    });

    it('should render empty providers placeholder and no section header and for buy', async () => {
        const { queryByText, getByText } = await renderProviderSheet({}, {});

        expect(
            getByText(getTranslation('moduleTrading.providerSheet.noProviders')),
        ).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleTrading.providerSheet.fixed.titleOffers')),
        ).toBeNull();
    });

    it('should render section header and empty placeholder for exchange', async () => {
        const { getByText, getAllByText, queryByText } = await renderProviderSheet(
            { tradingType: 'exchange' },
            {},
        );

        expect(
            getAllByText(getTranslation('moduleTrading.providerSheet.noProviders')).length,
        ).toBeGreaterThan(0);
        expect(
            getByText(getTranslation('moduleTrading.providerSheet.fixed.titleOffers')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.providerSheet.float.titleOffers')),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('moduleTrading.providerSheet.dex.title'))).toBeNull();
    });

    it('should render fixed and float section headers for exchange without DEX section', async () => {
        const { getByText, queryByText } = await renderProviderSheet({
            tradingType: 'exchange',
            quotes: EMPTY_GROUPED_EXCHANGE_QUOTES_BY_RATE_TYPE,
        });

        expect(
            getByText(getTranslation('moduleTrading.providerSheet.fixed.titleOffers')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.providerSheet.float.titleOffers')),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('moduleTrading.providerSheet.dex.title'))).toBeNull();
    });

    it('should render provided quotes', async () => {
        const { queryByText, getByText } = await renderProviderSheet({
            quotes: { fixed: [mercuryoApplePayBuyQuote] },
        });

        expect(queryByText(getTranslation('moduleTrading.providerSheet.noProviders'))).toBeNull();
        expect(
            queryByText(getTranslation('moduleTrading.providerListItem.centralizedExchange')),
        ).toBeNull();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should render exchange type information for exchange quotes', async () => {
        const { getByText } = await renderProviderSheet({
            quotes: { fixed: [cexdirectFloatingQuote] },
            tradingType: 'exchange',
        });

        expect(
            getByText(getTranslation('moduleTrading.providerListItem.centralizedExchange')),
        ).toBeOnTheScreen();
    });
});
