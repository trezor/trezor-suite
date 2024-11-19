class BottomSheetActions {
    async skipViewOnlyMode() {
        const skipViewOnlyModeButton = element(by.id('skip-view-only-mode'));

        await waitFor(skipViewOnlyModeButton).toBeVisible().withTimeout(20000);
        await skipViewOnlyModeButton.tap();
    }
}

export const onBottomSheet = new BottomSheetActions();
