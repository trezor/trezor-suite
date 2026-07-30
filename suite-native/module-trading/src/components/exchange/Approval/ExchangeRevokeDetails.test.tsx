import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { ExchangeRevokeDetails } from './ExchangeRevokeDetails';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

describe('ExchangeRevokeDetails', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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

    const renderExchangeRevokeDetails = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = defaultOverrides,
    ) =>
        renderWithTradingProvider(<ExchangeRevokeDetails exchange="mercuryo" />, {
            tradeType: 'exchange',
            overrides,
        });

    beforeEach(() => {
        errorSpy.mockClear();
    });

    it('should render revoke details', () => {
        const { getByText } = renderExchangeRevokeDetails();

        expect(
            getByText(getTranslation('moduleTrading.exchangeTradePreviewCard.account')),
        ).toBeOnTheScreen();
        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeRevokeScreen.limitLabel')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.ethereum')),
        ).toBeOnTheScreen();
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should render error when account is not found', () => {
        const { getByText, queryByText } = renderExchangeRevokeDetails({
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
            getByText(getTranslation('moduleTrading.tradingExchangeRevokeScreen.revokeErrorAlert')),
        ).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleTrading.exchangeTradePreviewCard.account')),
        ).toBeNull();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith('No account selected for exchange revoke details');
    });
});
