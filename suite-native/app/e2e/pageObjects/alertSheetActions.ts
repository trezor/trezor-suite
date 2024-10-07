class AlertSheetActions {
    async tapPrimaryButton() {
        await waitFor(element(by.id('@alert-sheet/primary-button')))
            .toBeVisible()
            .withTimeout(10000);
        await element(by.id('@alert-sheet/primary-button')).tap();
    }

    async tapSecondaryButton() {
        await waitFor(element(by.id('@alert-sheet/secondary-button')))
            .toBeVisible()
            .withTimeout(10000);
        await element(by.id('@alert-sheet/secondary-button')).tap();
    }
}

export const onAlertSheet = new AlertSheetActions();
