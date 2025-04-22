import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';
import { ConnectPermissionsModal } from '../../support/pageObjects/connectPermissionsModal';

const passThroughPermissions = async (connectPermissionsModal: ConnectPermissionsModal) => {
    await expect(connectPermissionsModal.processParagraph).toHaveText('node');
    await expect(connectPermissionsModal.rememberCheckbox).toHaveText('Always allow for this app');
    await connectPermissionsModal.confirmButton.click();
};

test.describe('TrezorConnect.signMessage', { tag: ['@group=suite', '@desktopOnly'] }, () => {
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

    test('TrezorConnect.ethereumSignTransaction', async ({
        connectPermissionsModal,
        trezorUserEnvLink,
    }) => {
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

        await passThroughPermissions(connectPermissionsModal);
        await expect(connectPermissionsModal.loadingHeader).toHaveText('Sign Ethereum transaction');

        // todo: add UI asserts for step 1
        await trezorUserEnvLink.swipeEmu('up');

        // todo: add UI asserts for step 2
        await trezorUserEnvLink.pressYes();

        expect(await res).toMatchObject({ success: true });
    });

    test('TrezorConnect.ethereumSignMessage', async ({
        connectPermissionsModal,
        trezorUserEnvLink,
        page,
    }) => {
        const res = TrezorConnect.ethereumSignMessage({
            path: "m/44'/60'/0'",
            message: 'example message',
        });

        await passThroughPermissions(connectPermissionsModal);
        await expect(connectPermissionsModal.loadingHeader).toHaveText('Sign Ethereum message');

        const text = page.getByTestId('@sign-message-modal/message');
        await expect(text).toHaveText('example message');

        await trezorUserEnvLink.swipeEmu('up');
        await trezorUserEnvLink.swipeEmu('up');
        await trezorUserEnvLink.pressYes();
        expect(await res).toMatchObject({ success: true });
    });

    // todo: use account not available in suite (weird derivation path)
});
