import { TradingActions } from './TradingActions';
import { waitForEnabled, waitForVisible, waitToHaveRegex } from '../../support/utils';

class ExchangeApprovalActions extends TradingActions {
    constructor(
        screenPrefix: 'exchange-approval' | 'exchange-revoke',
        private readonly screenName: 'TradingExchangeApproval' | 'TradingExchangeRevoke',
    ) {
        super(screenPrefix);
    }

    getScreen() {
        return element(by.id(`@screen/${this.screenName}`));
    }

    async expectScreenToBeVisible() {
        await waitForVisible(this.getScreen());
    }

    async waitForFeesToLoad() {
        await waitToHaveRegex(
            by.id('@transactionManagement/fee-crypto-amount'),
            /\d[\d.]*\s[A-Z]{2,6}/,
            { timeout: this.DOUBLE_LONG_TIMEOUT },
        );
    }

    async goToOutputsReview() {
        const button = this.getElementById('continue-button');
        await waitForEnabled(button, { timeout: this.DOUBLE_LONG_TIMEOUT });
        await button.tap();
    }
}

export const exchangeApprovalActions = new ExchangeApprovalActions(
    'exchange-approval',
    'TradingExchangeApproval',
);

export const exchangeRevokeActions = new ExchangeApprovalActions(
    'exchange-revoke',
    'TradingExchangeRevoke',
);
