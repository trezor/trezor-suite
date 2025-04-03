import { expect, test } from '../../support/fixtures';

test.use({ startEmulator: false });

test(
    'Join early access',
    { tag: ['@group=settings', '@desktopOnly'] },
    async ({ settingsPage }) => {
        test.fail();
        await settingsPage.navigateTo('application');
        await settingsPage.joinEarlyAccessProgram();
        await expect(settingsPage.earlyAccessJoinButton).toHaveText('Opt out');
    },
);
