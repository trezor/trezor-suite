describe('Example', () => {
    beforeAll(async () => {
        await device.launchApp();
    });

    beforeEach(async () => {
        // await device.reloadReactNative();
    });

    it('should have welcome screen', async () => {
        await device.takeScreenshot('first screen');
        // await waitFor(element(by.id('@onboarding/Welcome/nextBtn')))
        await expect(element(by.text('Trezor'))).toExist();
        await device.takeScreenshot('next screen');
    });
});
