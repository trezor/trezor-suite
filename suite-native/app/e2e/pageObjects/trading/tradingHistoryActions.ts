import { expect as detoxExpect } from 'detox';

import { TradingActions } from './TradingActions';
import { scrollUntilVisible, waitForVisible } from '../../support/utils';

type AssertTradeDetailParams = {
    fiatAmount: string;
    fiatCurrency: string;
    receiveAccount: string;
    receiveCryptoSymbol: string;
};

class TradingHistoryActions extends TradingActions {
    constructor() {
        super('history');
    }

    async assertTradeDetail({
        fiatAmount,
        fiatCurrency,
        receiveAccount,
        receiveCryptoSymbol,
    }: AssertTradeDetailParams) {
        const payRowTestID = this.getTestId('detail/info/pay');
        const payAssetTestID = `${payRowTestID}/asset`;
        const receiveRowTestID = this.getTestId('detail/info/get');
        const receiveAssetTestID = `${receiveRowTestID}/asset`;

        await waitForVisible(by.id('@screen/TradingHistoryDetail'));

        await scrollUntilVisible(element(by.id(payRowTestID)));
        await detoxExpect(element(by.id(`${payAssetTestID}/primary-label`))).toHaveText(
            fiatCurrency,
        );
        await detoxExpect(element(by.id(`${payAssetTestID}/amount`))).toHaveText(fiatAmount);

        await scrollUntilVisible(element(by.id(receiveRowTestID)));
        await detoxExpect(element(by.id(`${receiveAssetTestID}/primary-label`))).toHaveText(
            receiveCryptoSymbol,
        );
        await detoxExpect(element(by.id(`${receiveRowTestID}/account-label`))).toHaveText(
            `to ${receiveAccount}`,
        );
    }
}

export const tradingHistoryActions = new TradingHistoryActions();
