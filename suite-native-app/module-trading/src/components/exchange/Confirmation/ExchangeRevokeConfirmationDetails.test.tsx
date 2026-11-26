import { mockNetworksServices } from '@suite-common/networks/mocks';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { Text } from '@suite-native/atoms';
import { Translation, getTranslation } from '@suite-native/intl';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { ExchangeRevokeConfirmationDetails } from './ExchangeRevokeConfirmationDetails';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

describe('ExchangeRevokeConfirmationDetails', () => {
    const defaultOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: {
                exchange: {
                    tradingAccountKey: eth1NormalAccount.key,
                    selectedQuote: mercuryoFixedWorstQuote,
                },
            },
        },
    };

    const renderDetails = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = defaultOverrides,
    ) =>
        renderWithTradingProvider(
            <ExchangeRevokeConfirmationDetails
                exchange="mercuryo"
                feeRow={
                    <Text>
                        <Translation id="transactionManagement.fees.description.title.ethereum" />
                    </Text>
                }
                transactionIdRow={
                    <Text>
                        <Translation id="moduleTrading.tradingConfirmationScreen.transactionId" />
                    </Text>
                }
            />,
            {
                tradeType: 'exchange',
                overrides,
                services: { networks: mockNetworksServices() },
            },
        );

    it('renders the account, provider, limit, transaction ID and fee rows', async () => {
        const { getByText } = await renderDetails();

        expect(
            getByText(getTranslation('moduleTrading.exchangeTradePreviewCard.account')),
        ).toBeOnTheScreen();
        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeRevokeScreen.limitLabel')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.transactionId')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.ethereum')),
        ).toBeOnTheScreen();
    });

    it('renders nothing without the send account', async () => {
        const { queryByText } = await renderDetails({
            wallet: {
                trading: {
                    exchange: {
                        tradingAccountKey: mockAccountKey({ descriptor: 'unknownAccountKey' }),
                        selectedQuote: mercuryoFixedWorstQuote,
                    },
                },
            },
        });

        expect(
            queryByText(getTranslation('moduleTrading.tradingConfirmationScreen.transactionId')),
        ).toBeNull();
    });
});
