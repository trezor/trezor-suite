class AlertSheetActions {
    async tapPrimaryButton() {
        const primaryButtonElement = element(by.id('@alert-sheet/primary-button'));

        await waitFor(primaryButtonElement).toBeVisible().withTimeout(10000);
        await primaryButtonElement.tap();
    }

    async tapSecondaryButton() {
        const secondaryButtonElement = element(by.id('@alert-sheet/secondary-button'));

        await waitFor(secondaryButtonElement).toBeVisible().withTimeout(10000);
        await secondaryButtonElement.tap();
    }

    async skipViewOnlyMode() {
        await waitFor(element(by.id('@home/alert/view-only')))
            .toBeVisible()
            .withTimeout(20000);
        await this.tapSecondaryButton();
    }
}

export const onAlertSheet = new AlertSheetActions();
