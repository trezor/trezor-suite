import { type Locator, type Page } from '@playwright/test';

export class EarnNutshellModal {
    readonly modalContainer: Locator;
    readonly heading: Locator;
    readonly depositProcess: Locator;
    readonly withdrawProcess: Locator;
    readonly claimProcess: Locator;
    readonly updateProviderProcess: Locator;
    readonly continueButton: Locator;
    readonly depositApyValue: Locator;

    constructor(private readonly page: Page) {
        this.modalContainer = this.page.getByTestId('@modal/earn-in-a-nutshell');
        this.heading = this.modalContainer.getByTestId('@modal/header');
        this.depositProcess = this.modalContainer.getByTestId(
            '@modal/earn-in-a-nutshell/deposit-process',
        );
        this.withdrawProcess = this.modalContainer.getByTestId(
            '@modal/earn-in-a-nutshell/withdraw-process',
        );
        this.claimProcess = this.modalContainer.getByTestId(
            '@modal/earn-in-a-nutshell/claim-process',
        );
        this.updateProviderProcess = this.modalContainer.getByTestId(
            '@modal/earn-in-a-nutshell/update-provider-process',
        );
        this.continueButton = this.modalContainer.getByTestId('@modal/staking/continue-button');
        this.depositApyValue = this.depositProcess.getByTestId('@earn/dashboard/apy-percentage');
    }
}
