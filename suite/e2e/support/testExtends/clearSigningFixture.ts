import type { Response } from '@playwright/test';

import type { ClearSigningScenario } from '../../fixtures/clearSigning';
import { test as base, expect } from '../fixtures';

const normalizeDisplayValue = (value: string) =>
    value
        .replace(/(\d)-\s+(?=\d)/g, '$1')
        .replace(/\s/g, '')
        .toLowerCase();

export const test = base.extend<{
    confirmClearSigning: (scenario: ClearSigningScenario) => Promise<void>;
}>({
    deviceSetup: {
        mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
    },
    confirmClearSigning: async (
        { blockbookMock, onboardingPage, settingsPage, device, devicePrompt, page },
        runTest,
    ) => {
        await blockbookMock.start('eth');
        blockbookMock.updateAccountState({
            balance: '1000000000000000000',
            nonce: '0',
            confirmedNonce: '0',
            txs: 0,
            nonTokenTxs: 0,
            transactions: [],
            tokens: [],
            stakingPools: [],
        });
        blockbookMock.mockServer.setFixtures(
            blockbookMock.mockServer.getFixtures().map(fixture =>
                fixture.method === 'estimateFee'
                    ? {
                          method: 'estimateFee',
                          default: true,
                          response: {
                              data: [
                                  {
                                      feePerUnit: '1000000000',
                                      feeLimit: '500000',
                                      feePerTx: '500000000000000',
                                  },
                              ],
                          },
                      }
                    : fixture,
            ),
        );
        let broadcastCount = 0;
        blockbookMock.mockServer.on('blockbook_sendTransaction', () => {
            broadcastCount++;
        });

        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: [
                { symbol: 'eth', backend: { type: 'blockbook', url: blockbookMock.url } },
            ],
        });

        const downloadedDefinitions = new Set<string>();
        const recordDefinitionResponse = (response: Response) => {
            if (
                response.status() === 200 &&
                response.url().includes('/firmware/definitions/eth/')
            ) {
                downloadedDefinitions.add(response.url());
            }
        };
        page.on('response', recordDefinitionResponse);

        const readDisplayValues = async () => {
            const { body } = await device.getDisplayContent();

            // Preserve exact amounts while ignoring T3T1 numeric line-break hyphenation.
            return body.map(lines => normalizeDisplayValue(lines.join('')));
        };

        const expectDisplayValue = async (expectedValue: string) => {
            let displayedValues: string[] = [];
            await expect(async () => {
                displayedValues = await readDisplayValues();
                expect(displayedValues).toContain(normalizeDisplayValue(expectedValue));
            }).toPass({ timeout: 5_000 });

            return displayedValues;
        };

        await runTest(async scenario => {
            // Debug-link readiness pings can divert the initial ButtonRequest from the bridge.
            await devicePrompt.confirmOnDevicePromptIsShown();
            // toShowOnDisplay skips canary firmware; these checks must run there too.
            await expect(async () => {
                const displayedValues = await readDisplayValues();
                expect(scenario.providers.map(normalizeDisplayValue)).toContain(
                    displayedValues.join(''),
                );
            }).toPass({ timeout: 5_000 });
            expect(downloadedDefinitions, 'Production definition was downloaded').toContain(
                `https://data.trezor.io/firmware/definitions/eth/chain-id/1/${scenario.definitionPath}`,
            );
            await devicePrompt.waitForPromptAndConfirm();

            await expectDisplayValue(scenario.intent);
            await devicePrompt.waitForPromptAndConfirm();

            const expectedValues = scenario.reviewValues.map(normalizeDisplayValue);
            for (const [index, expectedValue] of expectedValues.entries()) {
                const displayedValues = await expectDisplayValue(expectedValue);
                const nextValue = expectedValues[index + 1];

                // Models can fit a different number of review fields on the same page.
                if (nextValue && !displayedValues.includes(nextValue)) {
                    await devicePrompt.confirmOnDevicePromptIsShown();
                    await device.pressContinue();
                }
            }
            await devicePrompt.waitForPromptAndConfirm();

            await device.expectToContainOnDisplay('Maximum fee');
            await devicePrompt.waitForPromptAndConfirm();
        });

        page.off('response', recordDefinitionResponse);
        expect(broadcastCount, 'Signing must not broadcast the transaction').toBe(0);
    },
});
