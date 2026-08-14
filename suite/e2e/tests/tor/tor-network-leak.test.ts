import { getMainnets } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { NetworkAnalyzer } from '../../support/networkAnalyzer';
import { createTestAnnotation } from '../../support/reporters/annotations';

// Launches the Suite with Tor enabled and verifies that the Suite processes (electron/node)
// never open a TCP connection to a non-localhost address. With Tor on, all Suite traffic must
// be routed through the local Tor SOCKS proxy; only the separate bundled `tor` process is
// allowed to reach the outside world.
//
// This test shells out to `lsof` and needs a live internet connection to bootstrap Tor, so it
// is meant to be run locally on demand:
//   TOR_NETWORK_LEAK_E2E=1 yarn workspace @trezor/suite-e2e test:e2e:desktop --project=T3T1 tor/tor-network-leak.test.ts

test.use({
    deviceSetup: { mnemonic: 'mnemonic_all' },
    // netLog captures a Chromium net log (open it with https://netlog-viewer.appspot.com/) so any
    // connection that bypasses the Tor proxy can be traced back to its request URL and source.
    electronConf: { tor: true },
});

test.describe('Tor - no network leak', { tag: ['@desktopOnly', '@T3T1', '@nightlyOnly'] }, () => {
    test.skip(
        !process.env.TOR_NETWORK_LEAK_E2E,
        'Local-only test: requires a live internet connection to bootstrap Tor. Run with TOR_NETWORK_LEAK_E2E=1.',
    );

    test(
        'Suite keeps all connections on localhost while Tor is enabled',
        {
            annotation: createTestAnnotation({
                testCase:
                    'With Tor enabled, the Suite processes must not open any TCP connection outside of localhost.',
                prerequisites: [
                    'Live internet connection so Tor can bootstrap',
                    '`lsof` available',
                ],
                steps: [
                    'Launch Trezor Suite with Tor enabled',
                    'Complete onboarding and wait for Tor to reach the Enabled state',
                    'Run account discovery to generate outbound network traffic',
                    'While the app is active, inspect electron/node TCP connections with lsof',
                    'Verify no connection has a non-localhost remote endpoint',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.Critical,
                stream: TestStream.Foundation,
            }),
        },
        async ({ onboardingPage, settingsPage, page }) => {
            const networkAnalyzer = new NetworkAnalyzer();
            // Sample connections in the background while the app boots, onboards and discovers.

            try {
                await test.step('Complete onboarding with Tor enabled', async () => {
                    await onboardingPage.completeOnboarding();
                });

                networkAnalyzer.start();
                await test.step('Verify Tor is enabled', async () => {
                    await page.ensureStoreOnDesktop();
                    await expect
                        .poll(() => page.getReduxObject('tor.torStatus'), {
                            message: 'Tor should reach the Enabled state',
                            timeout: 90_000,
                        })
                        .toBe('Enabled');
                });

                await test.step('Run account discovery to generate outbound traffic', async () => {
                    const allMainnetSymbols = getMainnets().map(network => network.symbol);
                    await settingsPage.changeNetworks({ enableNetworks: allMainnetSymbols });
                });
            } finally {
                networkAnalyzer.stop();
            }

            const externalConnections = networkAnalyzer.getCollectedExternalConnections();
            console.log('externalConnections', externalConnections);
            const details = externalConnections.map(connection => connection.raw).join('\n');
            console.log('details', details);

            expect(
                externalConnections,
                `Suite opened non-localhost TCP connections while Tor was enabled:\n${details}`,
            ).toEqual([]);
        },
    );
});
