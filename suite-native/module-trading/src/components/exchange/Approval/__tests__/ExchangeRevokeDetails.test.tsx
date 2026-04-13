import type { AccountKey } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils-store';
import {
    eth1NormalAccount,
    getWalletState,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';

import { ExchangeRevokeDetails } from '../ExchangeRevokeDetails';

describe('ExchangeRevokeDetails', () => {
    let preloadedState: PreloadedState;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const renderExchangeRevokeDetails = () =>
        renderWithStoreProvider(<ExchangeRevokeDetails exchange="mercuryo" />, { preloadedState });

    beforeEach(() => {
        preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        preloadedState!.wallet!.trading!.exchange!.tradingAccountKey = eth1NormalAccount.key;
        preloadedState!.wallet!.trading!.exchange!.preselectedQuote = mercuryoFixedWorstQuote;

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
        preloadedState!.wallet!.trading!.exchange!.tradingAccountKey =
            'unknown-account-key' as AccountKey;

        const { getByText, queryByText } = renderExchangeRevokeDetails();

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
