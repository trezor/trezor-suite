import { TrezorUserEnvLink } from '/Users/pe.kne/git/trezor-suite/packages/trezor-user-env-link/src/websocket-client.ts';

describe('Onboarding', () => {
    beforeAll(async () => {
        await device.launchApp({
            newInstance: true,
        });
    });

    it('Redirect from first to second screen', async () => {
        console.log(TrezorUserEnvLink.options);
        await expect(element(by.id('@onboarding/Welcome/nextBtn'))).toBeVisible();

        await element(by.id('@onboarding/Welcome/nextBtn')).tap();

        await expect(element(by.text('Connect'))).toBeVisible();
    });
});
