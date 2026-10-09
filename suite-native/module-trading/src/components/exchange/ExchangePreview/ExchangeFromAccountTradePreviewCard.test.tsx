import {
    mockNetworkIcon,
    mockNetworkModule,
    mockNetworkModuleRepository,
} from '@suite-common/networks/mocks';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type NetworkSymbol } from '@trezor/network-module-types';

import {
    ExchangeFromAccountTradePreviewCard,
    type ExchangeFromAccountTradePreviewCardProps,
} from './ExchangeFromAccountTradePreviewCard';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const networkModule = mockNetworkModule();
const networkModuleRepository = mockNetworkModuleRepository({
    get: () => networkModule,
    isSupportedNetwork: (_symbol): _symbol is NetworkSymbol => true,
});

describe('ExchangeFromAccountTradePreviewCard', () => {
    const renderExchangeFromAccountTradePreviewCard = async (
        props: Partial<ExchangeFromAccountTradePreviewCardProps> = {},
        tradingAccountKey = eth1NormalAccount.key,
    ) =>
        await renderWithTradingProvider(<ExchangeFromAccountTradePreviewCard {...props} />, {
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
                        exchange: { tradingAccountKey },
                    },
                },
            },
            services: { networks: { networkIcon: mockNetworkIcon(), networkModuleRepository } },
        });

    it('should render nothing when there is no quote', async () => {
        const { toJSON } = await renderExchangeFromAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', async () => {
        const { toJSON } = await renderExchangeFromAccountTradePreviewCard(
            { quote: mercuryoFixedWorstQuote },
            mockAccountKey({ descriptor: 'unknownAccountKey' }),
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradingAccountCard otherwise', async () => {
        const { getByText } = await renderExchangeFromAccountTradePreviewCard({
            quote: mercuryoFixedWorstQuote,
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.fromAccount')),
        ).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('-100 USDC')).toBeOnTheScreen();
        expect(getByText(`100-${mercuryoFixedWorstQuote.send}`)).toBeOnTheScreen();
    });
});
