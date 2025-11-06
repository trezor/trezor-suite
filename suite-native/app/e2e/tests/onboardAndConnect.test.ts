import { expect as detoxExpect } from 'detox';

import { conditionalDescribe } from '@suite-common/test-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { networks } from '@suite-common/wallet-config/src/networksConfig';

import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onDevicePrompt } from '../pageObjects/devicePromptActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { openApp, prepareTrezorEmulator } from '../support/setup';
import { getModelFromEnv, scrollUntilVisible, waitForVisible,  } from '../support/utils';

const coins: NetworkSymbol[] = ['btc', 'eth', 'ada', 'etc', 'xrp', 'ltc', 'bch', 'doge', 'zec'];

conditionalDescribe(
    device.getPlatform() === 'android',
    'Go through onboarding and connect Trezor. [@fixT3W1]',
    () => {
        beforeEach(async () => {
            await openApp({});
            await prepareTrezorEmulator();
        });

        it('Navigate to dashboard', async () => {
            await onOnboarding.finishOnboarding();

            if (getModelFromEnv() === 'T3W1') {
                await onDevicePrompt.allowConnectToTrezor();
                await onDeviceOnboarding.enterTHPPairingCode();
            }

            await onCoinEnabling.waitForInitScreen();
            await onCoinEnabling.handleCoinEnablingInit(coins);
            await waitForVisible(by.text('Connected'));
            for (const coin of coins) {
                const networkName = networks[coin].name;
                const coinTextElement = element(by.id(`@assets/asset-item/${coin}/title`));
                await scrollUntilVisible(coinTextElement);
                await detoxExpect(coinTextElement).toBeVisible();
                await detoxExpect(coinTextElement).toHaveText(networkName);
            }
        });
    },
);
