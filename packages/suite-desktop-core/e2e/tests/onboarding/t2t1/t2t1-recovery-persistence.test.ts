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

test.describe('Onboarding - T2T1 in recovery mode', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { wipe: true, model: 'T2T1', version: '2.5.3' },
        setupEmulator: false,
    });

    test.beforeEach(async ({ page, onboardingPage, analyticsPage }) => {
        await onboardingPage.disableFirmwareHashCheck();

        await analyticsPage.passThroughAnalytics();

        await onboardingPage.firmware.skip();
        await page.getByTestId('@onboarding/path-recovery-button').click();
    });

    test('Initial run with device that is already in recovery mode', async ({
        page,
        trezorUserEnvLink,
        onboardingPage,
        analyticsPage,
        devicePrompt,
        indexedDb,
    }) => {
        // Start recovery with some device
        await page.getByTestId('@onboarding/recovery/start-button').click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.selectNumOfWordsEmu(20);
        await trezorUserEnvLink.pressYes();
        await page.waitForTimeout(501); // Wait for device release

        // Disconnect device, reload application
        await trezorUserEnvLink.stopEmu();
        await devicePrompt.connectDevicePromptIsShown();

        await indexedDb.reset();
        await page.reload();

        // Restart emulator and disable firmware hash check
        await trezorUserEnvLink.startEmu({ wipe: false, model: 'T2T1', version: '2.5.3' });
        await onboardingPage.disableFirmwareHashCheck();

        // Go through analytics opt-out again
        await analyticsPage.passThroughAnalytics();

        // Recovery device persisted after reload
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressNo();
        await trezorUserEnvLink.pressYes();
    });

    test('Continue recovery after device is disconnected', async ({
        page,
        trezorUserEnvLink,
        devicePrompt,
    }) => {
        // Start recovery
        await page.getByTestId('@onboarding/recovery/start-button').click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.selectNumOfWordsEmu(20);
        await trezorUserEnvLink.pressYes();

        // Enter first Shamir share
        for (const word of shareOneOfThree) {
            await trezorUserEnvLink.inputEmu(word);
        }

        await devicePrompt.confirmOnDevicePromptIsShown();

        // Disconnect and reconnect device
        await trezorUserEnvLink.stopEmu();
        await devicePrompt.connectDevicePromptIsShown();
        await trezorUserEnvLink.startEmu({ wipe: false, model: 'T2T1', version: '2.5.3' });
        await devicePrompt.confirmOnDevicePromptIsShown();

        // This is needed, because there seem to be some weird refreshes on the emu
        // which means you confirm too early if you don't wait
        await page.waitForTimeout(3000);
        await trezorUserEnvLink.pressYes();

        // Enter second Shamir share
        for (const word of shareTwoOfThree) {
            await trezorUserEnvLink.inputEmu(word);
        }

        await trezorUserEnvLink.pressYes();
        await page.getByTestId('@onboarding/recovery/continue-button').click();
        await page.getByTestId('@onboarding/skip-button').click();
    });
});
