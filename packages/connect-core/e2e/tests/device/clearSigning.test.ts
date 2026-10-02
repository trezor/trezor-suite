import * as crossFetch from 'cross-fetch';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { BridgeTransport } from '@trezor/transport-common';
import { type EmuStartOptsType, Model } from '@trezor/trezor-user-env-link';

import TrezorConnect, { UI_EVENTS } from '../../../src';
import { clearSigningScenarios } from '../../__fixtures__/clearSigning';
import { getController, initTrezorConnect, setup, skipTest } from '../../common.setup';

type DisplayLayout = {
    Content?: { paragraphs: string[][] };
    content?: { content?: { paragraphs: string[][] }; paragraphs?: string[][] };
    flow_page?: { text: string[] };
};

const normalizeDisplayValue = (value: string) =>
    value
        .replace(/(\d)-\s+(?=\d)/g, '$1')
        .replace(/\s/g, '')
        .toLowerCase();

// Observe real downloads without substituting the production definition bytes.
vi.mock('cross-fetch', { spy: true });
const { default: fetch } = await vi.importActual<typeof crossFetch>('cross-fetch');
const downloadedDefinitions = new Set<string>();
const fetchSpy = vi.mocked(crossFetch.default).mockImplementation(async (...args) => {
    const response = await fetch(...args);
    if (
        response.status === 200 &&
        String(args[0]).startsWith('https://data.trezor.io/firmware/definitions/eth/')
    ) {
        downloadedDefinitions.add(String(args[0]));
    }

    return response;
});

const controller = getController();
const displayedValues: string[] = [];
let confirmations = Promise.resolve();
let confirmationError: unknown;
let expectedReviewValues: string[] = [];
const emulatorOptions: EmuStartOptsType = JSON.parse(process.env.EMULATOR_START_OPTS ?? '{}');

const captureDisplay = async () => {
    const { tokens } = await controller.getDebugState();
    const layout: DisplayLayout = JSON.parse(tokens.join(''));
    const paragraphs =
        layout.Content?.paragraphs ??
        layout.content?.content?.paragraphs ??
        layout.content?.paragraphs ??
        layout.flow_page?.text.map(text => [text]);
    if (!paragraphs) {
        throw new Error('Readable text missing from the Trezor display');
    }
    const values = paragraphs.map(lines => normalizeDisplayValue(lines.join('')));
    displayedValues.push(...values);

    return values;
};

const confirmAndCapture = () => {
    confirmations = confirmations
        .then(async () => {
            // Connect has received the ButtonRequest before the debug-link readiness probe.
            let values = await captureDisplay();
            for (const [index, value] of expectedReviewValues.entries()) {
                const nextValue = expectedReviewValues[index + 1];
                if (values.includes(value) && nextValue && !values.includes(nextValue)) {
                    // Visit every review page before confirming on smaller displays.
                    if (emulatorOptions.model === Model.T3W1) {
                        await controller.clickEmu({ x: 200, y: 480 });
                    } else {
                        await controller.swipeEmu('up');
                    }
                    await expect
                        .poll(
                            async () => {
                                values = await captureDisplay();

                                return values;
                            },
                            { timeout: 5_000 },
                        )
                        .toContain(nextValue);
                }
            }
            await controller.pressYes();
        })
        .catch(error => {
            confirmationError = error;
            TrezorConnect.cancel();
        });
};

describe.skipIf(Boolean(skipTest(['1'])))('Production Ethereum clear signing', () => {
    beforeAll(async () => {
        TrezorConnect.dispose();
        await setup(controller, {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        });
        await initTrezorConnect(controller, {
            autoConfirm: false,
            definitionsChannel: 'production',
            transports: [
                new BridgeTransport({
                    id: 'clear-signing',
                    port: Number(process.env.TESTS_BRIDGE_PORT ?? 21328),
                }),
            ],
        });
        TrezorConnect.on(UI_EVENTS.BUTTON_REQUEST, confirmAndCapture);
    });

    beforeEach(() => {
        displayedValues.length = 0;
        downloadedDefinitions.clear();
        confirmationError = undefined;
    });

    afterEach(async () => {
        TrezorConnect.cancel();
        await confirmations;
    });

    afterAll(async () => {
        TrezorConnect.off(UI_EVENTS.BUTTON_REQUEST, confirmAndCapture);
        TrezorConnect.dispose();
        fetchSpy.mockRestore();
        await controller.stopBridge();
        await controller.stopEmu();
        controller.dispose();
    });

    for (const scenario of clearSigningScenarios) {
        it(`Displays readable ${scenario.name} details on Trezor`, async () => {
            expectedReviewValues = scenario.reviewValues.map(normalizeDisplayValue);
            const result = await TrezorConnect.ethereumSignTransaction({
                path: "m/44'/60'/0'/0/0",
                transaction: scenario.transaction,
            });
            await confirmations;
            if (confirmationError) {
                throw confirmationError;
            }
            expect(result).toMatchObject({
                success: true,
                payload: { serializedTx: expect.stringMatching(/^(0x)?[0-9a-f]+$/i) },
            });
            expect(downloadedDefinitions).toContain(
                `https://data.trezor.io/firmware/definitions/eth/chain-id/1/${scenario.definitionPath}`,
            );
            expect(
                scenario.providers.some(provider =>
                    displayedValues.includes(normalizeDisplayValue(provider)),
                ),
            ).toBe(true);
            for (const value of [scenario.intent, ...scenario.reviewValues]) {
                expect(displayedValues).toContain(normalizeDisplayValue(value));
            }
            expect(displayedValues.some(value => value.startsWith('maximumfee'))).toBe(true);
        });
    }
});
