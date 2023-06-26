describe('Example', () => {
  beforeAll(async () => {
      await device.launchApp();
  });

  beforeEach(async () => {
      await device.reloadReactNative();
  });

  it('should have welcome screen', async () => {
      await device.takeScreenshot('first screen');
      const nextBtn = await element(by.id('@onboarding/Welcome/nextBtn'));
      await expect(nextBtn).toBeVisible();
      await nextBtn.tap();
      await device.takeScreenshot('next screen');
  });
});