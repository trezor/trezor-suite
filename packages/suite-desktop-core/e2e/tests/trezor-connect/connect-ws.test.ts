import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';
import { ConnectPopupModal } from '../../support/pageObjects/connectPopupModal';

const passThroughPermissions = async (connectModal: ConnectPopupModal) => {
    await expect(connectModal.processParagraph).toHaveText('node');
    await expect(connectModal.rememberCheckbox).toHaveText('Always allow for this app');
    await connectModal.confirmButton.click();
};

test.describe('TrezorConnect', { tag: ['@group=suite', '@desktopOnly'] }, () => {
    test.use({ electronConf: { exposeConnectWs: true } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
        await test.step('Initialize TrezorConnect', async () => {
            await TrezorConnect.init({
                manifest: {
                    appUrl: 'http://localhost:8080',
                    email: '',
                    appName: 'Tester',
                },
                coreMode: 'suite-desktop',
                debug: true,
            });
        });
    });

    test('TrezorConnect.getAddress', async ({ connectModal, trezorUserEnvLink }) => {
        const res = TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });

        await passThroughPermissions(connectModal);
        await expect(connectModal.loadingHeader).toHaveText('Export Bitcoin address');

        // export single address
        await trezorUserEnvLink.pressYes();
        expect(await res).toMatchObject({ success: true });

        // export multiple addresses
        const resMultiple = TrezorConnect.getAddress({
            bundle: [
                {
                    path: "m/44'/0'/0'/0/0",
                    coin: 'btc',
                },
                {
                    path: "m/44'/0'/0'/0/0",
                    coin: 'btc',
                },
            ],
        });
        await connectModal.confirmButton.click();
        await expect(connectModal.loadingHeader).toHaveText('Export multiple Bitcoin addresses');

        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();

        expect(await resMultiple).toMatchObject({ success: true });
    });

    test('TrezorConnect.ethereumSignTransaction', async ({ connectModal, trezorUserEnvLink }) => {
        const res = TrezorConnect.ethereumSignTransaction({
            path: "m/44'/60'/0'/0/0",
            transaction: {
                nonce: '0x0',
                gasPrice: '0x14',
                gasLimit: '0x14',
                to: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                chainId: 1,
                value: '0x0',
                data: '0xa9059cbb000000000000000000000000D6971aabeDC7f2A8113679199FE374aE1B1Aea96000000000000000000000000000000000000000000000000000000000097f6b2',
            },
        });

        await passThroughPermissions(connectModal);
        await expect(connectModal.loadingHeader).toHaveText('Sign Ethereum transaction');

        // todo: add UI asserts for step 1
        await trezorUserEnvLink.swipeEmu('up');

        // todo: add UI asserts for step 2
        await trezorUserEnvLink.pressYes();

        expect(await res).toMatchObject({ success: true });
    });
});

// todo: write tests:
// - connect request is accepted when all kind of weird stuff is happening
//   - discovery is in progress
//   - onboarding is in progress
//   - recovery/backup is in progress
//   - device is not connected
//   - device is used by another application
//   - device is not initialized, device is in bootloader
// - permissions, grant, revoke, settings page
