import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import * as crossFetch from 'cross-fetch';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DeviceButtonRequestPayload } from '@trezor/connect-common';
import { BridgeTransport } from '@trezor/transport-common';
import { type EmuStartOptsType } from '@trezor/trezor-user-env-link';

import {
    type ReviewPage,
    assertRawReview,
    assertReviewFields,
    getReviewFields,
    normalizeReviewText,
    traverseReview,
} from './clearSigningReview';
import TrezorConnect, { UI_EVENTS } from '../../../src';
import { clearSigningScenarios } from '../../__fixtures__/clearSigning';
import { getController, initTrezorConnect, setup, skipTest } from '../../common.setup';

// Observe real downloads without substituting the production definition bytes.
vi.mock('cross-fetch', { spy: true });
const { default: fetch } = await vi.importActual<typeof crossFetch>('cross-fetch');
const downloadedDefinitions = new Set<string>();
const definitionHashes = new Map<string, string>();
const fetchSpy = vi.mocked(crossFetch.default).mockImplementation(async (...args) => {
    const response = await fetch(...args);
    if (
        response.status === 200 &&
        String(args[0]).startsWith('https://data.trezor.io/firmware/definitions/eth/')
    ) {
        downloadedDefinitions.add(String(args[0]));
        definitionHashes.set(
            String(args[0]),
            bytesToHex(sha256(new Uint8Array(await response.clone().arrayBuffer()))),
        );
    }

    return response;
});

const controller = getController();
const reviews: ReviewPage[][] = [];
let confirmations = Promise.resolve();
let confirmationError: unknown;
const emulatorOptions: EmuStartOptsType = JSON.parse(process.env.EMULATOR_START_OPTS ?? '{}');

const confirmAndCapture = (request: DeviceButtonRequestPayload) => {
    confirmations = confirmations
        .then(async () => {
            reviews.push(
                await traverseReview(controller, {
                    model: emulatorOptions.model,
                    pages: request.pages,
                }),
            );
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
        reviews.length = 0;
        downloadedDefinitions.clear();
        definitionHashes.clear();
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
        const testName = scenario.knownRawFallback
            ? `Reproduces known raw-data fallback for ${scenario.name}`
            : `Displays readable ${scenario.name} details on Trezor`;
        it(testName, async () => {
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
            const displayedValues = reviews
                .flat()
                .flatMap(page => page.paragraphs.map(normalizeReviewText));
            const hasProvider = scenario.providers.some(provider =>
                displayedValues.includes(normalizeReviewText(provider)),
            );
            const fields = reviews.flatMap(getReviewFields);
            assertReviewFields(fields, [{ label: 'Maximum fee', value: '0.0005 ETH' }]);
            if (scenario.knownRawFallback) {
                expect(
                    definitionHashes.get(
                        `https://data.trezor.io/firmware/definitions/eth/chain-id/1/${scenario.definitionPath}`,
                    ),
                    'Production descriptor changed; review and remove the known-fallback marker',
                ).toBe(scenario.knownRawFallback.definitionHash);
                assertRawReview(reviews, scenario.transaction.data);
                expect(hasProvider).toBe(false);
                expect(displayedValues).not.toContain(normalizeReviewText(scenario.intent));
                for (const definitionPath of [
                    'network.dat',
                    'token-c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.dat',
                ]) {
                    expect(
                        downloadedDefinitions,
                        JSON.stringify([...downloadedDefinitions]),
                    ).toContain(
                        `https://data.trezor.io/firmware/definitions/eth/chain-id/1/${definitionPath}`,
                    );
                }
                console.warn(
                    `Known production defect (${scenario.knownRawFallback.url}): ${scenario.knownRawFallback.reason}; maker review still displays raw calldata`,
                );
            } else {
                expect(hasProvider).toBe(true);
                expect(displayedValues).toContain(normalizeReviewText(scenario.intent));
                assertReviewFields(fields, scenario.reviewFields);
            }
        });
    }
});
