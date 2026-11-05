import { waitForVisible } from '../support/utils';

class AlertSheetActions {
    async tapPrimaryButton() {
        const primaryButtonElement = element(by.id('@alert-sheet/primary-button'));

        await waitForVisible(primaryButtonElement);
        await primaryButtonElement.tap();
    }

    async tapSecondaryButton() {
        const secondaryButtonElement = element(by.id('@alert-sheet/secondary-button'));

        await waitForVisible(secondaryButtonElement);
        await secondaryButtonElement.tap();
    }
}

export const onAlertSheet = new AlertSheetActions();
