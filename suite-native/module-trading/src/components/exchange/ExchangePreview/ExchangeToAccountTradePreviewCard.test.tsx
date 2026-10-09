import {
    mockNetworkIcon,
    mockNetworkModule,
    mockNetworkModuleRepository,
} from '@suite-common/networks/mocks';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { btc1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type NetworkSymbol } from '@trezor/network-module-types';

import {
    ExchangeToAccountTradePreviewCard,
    type ExchangeToAccountTradePreviewCardProps,
} from './ExchangeToAccountTradePreviewCard';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const networkModule = mockNetworkModule();
const networkModuleRepository = mockNetworkModuleRepository({
    get: () => networkModule,
    isSupportedNetwork: (_symbol): _symbol is NetworkSymbol => true,
});

describe('ExchangeToAccountTradePreviewCard', () => {
    const renderExchangeToAccountTradePreviewCard = async (
        props: Partial<ExchangeToAccountTradePreviewCardProps> = {},
        receiveAccountKey = btc1NormalAccount.key,
    ) =>
        await renderWithTradingProvider(<ExchangeToAccountTradePreviewCard {...props} />, {
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    trading: {
                        composedTransactionInfo: {
                            composed: {
                                fee: '1000',
                                feePerByte: '1',
                                feeLimit: '21000',
                                estimatedFeeLimit: '21000',
                            },
                        },
                        exchange: { receiveAccountKey },
                    },
                },
            },
            services: { networks: { networkIcon: mockNetworkIcon(), networkModuleRepository } },
        });

    it('should render nothing when there is no quote', async () => {
        const { toJSON } = await renderExchangeToAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', async () => {
        const { toJSON } = await renderExchangeToAccountTradePreviewCard(
            { quote: mercuryoFixedWorstQuote },
            mockAccountKey({ descriptor: 'unknownAccountKey' }),
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradingAccountCard otherwise', async () => {
        const { getByText } = await renderExchangeToAccountTradePreviewCard({
            quote: mercuryoFixedWorstQuote,
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.toAccount')),
        ).toBeOnTheScreen();
        expect(getByText('+0.00083554 BTC')).toBeOnTheScreen();
        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText(`0.00083554-${mercuryoFixedWorstQuote.receive}`)).toBeOnTheScreen();
    });
});
