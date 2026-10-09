import {
    mockNetworkIcon,
    mockNetworkModule,
    mockNetworkModuleRepository,
} from '@suite-common/networks/mocks';
import { getTranslation } from '@suite-native/intl';
import { banxaCreditCardSellQuote, eth1NormalAccount } from '@suite-native/trading-fixtures';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { SellFromAccountCard, type SellFromAccountCardProps } from './SellFromAccountCard';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

const networkModule = mockNetworkModule();
const networkModuleRepository = mockNetworkModuleRepository({
    get: () => networkModule,
    isSupportedNetwork: (_symbol): _symbol is NetworkSymbol => true,
});

describe('SellFromAccountCard', () => {
    const renderSellFromAccountCard = async (
        props: Partial<SellFromAccountCardProps> = {},
        tradingAccountKey = eth1NormalAccount.key,
    ) =>
        await renderWithTradingProvider(<SellFromAccountCard {...props} />, {
            tradeType: 'sell',
            overrides: {
                wallet: {
                    trading: { sell: { tradingAccountKey } },
                },
            },
            services: { networks: { networkIcon: mockNetworkIcon(), networkModuleRepository } },
        });

    it('should render TradingAccountCard', async () => {
        const { getByText } = await renderSellFromAccountCard({
            quote: banxaCreditCardSellQuote,
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.youPay')),
        ).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('-0.0233 ETH')).toBeOnTheScreen();
    });
});
