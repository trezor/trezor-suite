import { type Locator, type Page } from '@playwright/test';

export class TxSimulationModal {
    readonly maxFeeAmount: Locator;
    readonly maxFeeFiat: Locator;
    readonly confirmButton: Locator;

    constructor(private readonly page: Page) {
        this.maxFeeAmount = this.page.getByTestId('@trading/quote/maximum-fee-amount-with-symbol');
        this.maxFeeFiat = this.page.getByTestId('@trading/quote/maximum-fee-fiat-amount');
        this.confirmButton = this.page.getByTestId('@tx-simulation-modal/confirm-button');
    }

    sentAsset(index: number): Locator {
        return this.page.getByTestId(`@sign-message-modal/tx-simulation-out-${index}`);
    }

    sentAssetFiat(index: number): Locator {
        return this.page.getByTestId(`@sign-message-modal/tx-simulation-out-${index}/fiat`);
    }

    receivedAsset(index: number): Locator {
        return this.page.getByTestId(`@sign-message-modal/tx-simulation-in-${index}`);
    }

    receivedAssetFiat(index: number): Locator {
        return this.page.getByTestId(`@sign-message-modal/tx-simulation-in-${index}/fiat`);
    }
}
