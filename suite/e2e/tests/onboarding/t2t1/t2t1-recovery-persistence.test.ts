import { test } from '../../../support/fixtures';

const shareOneOfThree = [
    'gesture',
    'necklace',
    'academic',
    'acid',
    'deadline',
    'width',
    'armed',
    'render',
    'filter',
    'bundle',
    'failure',
    'priest',
    'injury',
    'endorse',
    'volume',
    'terminal',
    'lunch',
    'drift',
    'diploma',
    'rainbow',
];

const shareTwoOfThree = [
    'gesture',
    'necklace',
    'academic',
    'agency',
    'alpha',
    'ecology',
    'visitor',
    'raisin',
    'yelp',
    'says',
    'findings',
    'bulge',
    'rapids',
    'paper',
    'branch',
    'spelling',
    'cubic',
    'tactics',
    'formal',
    'disease',
];

test.describe('Onboarding - T2T1 in recovery mode', { tag: ['@webOnly', '@T2T1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ page, onboardingPage, analyticsSection }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();

        await analyticsSection.passThroughAnalytics();

        await onboardingPage.firmware.continueThroughFirmware();
        await page.getByTestId('@onboarding/path-recovery-button').click();
    });

    test('Initial run with device that is already in recovery mode', async ({
        page,
        device,
        onboardingPage,
        analyticsSection,
        devicePrompt,
        indexedDb,
    }) => {
        await test.step('Start recovery with some device', async () => {
            await page.getByTestId('@onboarding/recovery/start-button').click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.selectNumberOfWords(20);
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();
            await page.waitForTimeout(500); // Wait for device release
        });

        await test.step('Disconnect device, reload application', async () => {
            await device.powerOff();
            await devicePrompt.connectDevicePromptIsShown();
            await indexedDb.reset();
            await page.reload();
        });

        await test.step('Restart emulator and disable firmware hash check and analytics', async () => {
            await device.powerOn();
            await onboardingPage.disableNecessaryFirmwareChecks();
            await analyticsSection.passThroughAnalytics();
        });

        await test.step('Recovery device persisted after reload', async () => {
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressNo();
            await device.pressYes();
        });
    });

    test('Continue recovery after device is disconnected', async ({
        page,
        device,
        devicePrompt,
        onboardingPage,
        dashboardPage,
    }) => {
        await test.step('Start recovery', async () => {
            await onboardingPage.startRecoveryButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.selectNumberOfWords(20);
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();
        });

        await test.step('Enter first Shamir share', async () => {
            for (const word of shareOneOfThree) {
                await device.type(word);
            }
            await devicePrompt.confirmOnDevicePromptIsShown();
        });

        await test.step('Disconnect and reconnect device', async () => {
            await device.powerOff();
            await devicePrompt.connectDevicePromptIsShown();
            await device.powerOn();
            await devicePrompt.confirmOnDevicePromptIsShown({ timeout: 15_000 });

            // This is needed, because there seem to be some weird refreshes on the emu
            // which means you confirm too early if you don't wait
            await page.waitForTimeout(3_000);
            await device.pressYes();
        });

        await test.step('Enter second Shamir share', async () => {
            for (const word of shareTwoOfThree) {
                await device.type(word);
            }
            await device.pressYes();
        });

        await test.step('Finish onboarding', async () => {
            await onboardingPage.continueRecoveryButton.click();
            await onboardingPage.pin.skip();
            await onboardingPage.finalButton.click();

            await dashboardPage.verifyDiscoveryEmpty();
        });
    });
});
