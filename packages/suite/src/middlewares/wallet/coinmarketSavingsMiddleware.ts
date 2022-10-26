import type { MiddlewareAPI } from 'redux';
import type { AppState, Action, Dispatch } from '@suite-types';
import { COINMARKET_SAVINGS } from '@wallet-actions/constants';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import * as pollingActions from '@wallet-actions/pollingActions';
import * as notificationActions from '@suite-actions/notificationActions';
import invityAPI, { SavingsTradeKYCFinalStatuses } from '@suite-services/invityAPI';
import {
    KYCStatusPollingIntervalMilliseconds,
    KYCStatusPollingMaxCount,
} from '@wallet-constants/coinmarket/savings';
import { isDesktop } from '@suite-utils/env';

const coinmarketSavingsMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (action.type === COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE) {
            const { account } = api.getState().wallet.selectedAccount;
            const { savingsInfo } = api.getState().wallet.coinmarket.savings;
            if (account && savingsInfo) {
                invityAPI.getSavingsTrade().then(savingsTradeResponse => {
                    if (savingsTradeResponse) {
                        api.dispatch(
                            coinmarketSavingsActions.saveSavingsTradeResponse(savingsTradeResponse),
                        );
                        const { trade } = savingsTradeResponse;
                        if (trade) {
                            if (isDesktop() && trade.status === 'SetSavingsParameters') {
                                const pollingKey =
                                    `coinmarket-savings-trade/${account.descriptor}` as const;
                                api.dispatch(pollingActions.stopPolling(pollingKey));
                            }

                            const provider = savingsInfo.providerInfos[trade.exchange];
                            api.dispatch(coinmarketSavingsActions.setSelectedProvider(provider));

                            if (
                                trade.kycStatus &&
                                !SavingsTradeKYCFinalStatuses.includes(trade.kycStatus)
                            ) {
                                api.dispatch(
                                    coinmarketSavingsActions.startWatchingKYCStatus(trade.exchange),
                                );
                            }

                            trade.tradeItems?.forEach(savingsTradeItem =>
                                api.dispatch(
                                    coinmarketSavingsActions.saveTrade(
                                        savingsTradeItem,
                                        account,
                                        savingsTradeItem.created,
                                    ),
                                ),
                            );
                        }
                    }
                });
            }
        }

        if (action.type === COINMARKET_SAVINGS.START_WATCHING_KYC_STATUS) {
            const { account, status } = api.getState().wallet.selectedAccount;
            const { selectedProvider, isWatchingKYCStatus } =
                api.getState().wallet.coinmarket.savings;
            if (account && status === 'loaded' && selectedProvider && !isWatchingKYCStatus) {
                const pollingKey = `coinmarket-savings-kyc/${account.descriptor}` as const;
                const apiKey = invityAPI.getCurrentApiKey();
                api.dispatch(
                    pollingActions.startPolling(
                        pollingKey,
                        () =>
                            invityAPI.watchKYCStatus(apiKey).then(result => {
                                if (
                                    result &&
                                    !result.code &&
                                    result.kycStatus &&
                                    SavingsTradeKYCFinalStatuses.includes(result.kycStatus)
                                ) {
                                    api.dispatch(
                                        coinmarketSavingsActions.stopWatchingKYCStatus(
                                            result.kycStatus,
                                        ),
                                    );
                                    const notificationType =
                                        result.kycStatus === 'Verified'
                                            ? 'savings-kyc-success'
                                            : 'savings-kyc-failed';
                                    api.dispatch(
                                        notificationActions.addToast({
                                            type: notificationType,
                                        }),
                                    );
                                }
                            }),
                        KYCStatusPollingIntervalMilliseconds,
                        KYCStatusPollingMaxCount,
                    ),
                );
            }
        }

        if (action.type === COINMARKET_SAVINGS.STOP_WATCHING_KYC_STATUS) {
            const { account, status } = api.getState().wallet.selectedAccount;
            if (account && status === 'loaded') {
                const pollingKey = `coinmarket-savings-kyc/${account.descriptor}` as const;
                api.dispatch(pollingActions.stopPolling(pollingKey));
            }
        }

        next(action);
        return action;
    };
export default coinmarketSavingsMiddleware;
