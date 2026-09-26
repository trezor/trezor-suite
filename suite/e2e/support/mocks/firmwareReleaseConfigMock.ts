import { type Page, expect } from '@playwright/test';
import { type Server, createServer } from 'node:http';

import { firmwareActions } from '@suite-common/firmware';
import { type ConditionalRelease, type FirmwareRelease, FirmwareType } from '@trezor/device-utils';
import { type Model } from '@trezor/trezor-user-env-link';
import { versionUtils } from '@trezor/utils';

import { step } from '../common';
import { type DeviceFixture } from '../device';

export const MOCKED_FIRMWARE_CHANGELOG = 'Firmware release mocked by the e2e test suite.';

const PORT = 3000;
const CHANNEL = 'localhost-signed';
const CHANNEL_DIR = 'firmware/signed';
const CONFIG_PATH = `${CHANNEL_DIR}/releases.v1.json`;
const RELEASE_PATH = `${CHANNEL_DIR}/latest.json`;

// Connect ignores a remote config whose sequence does not exceed the one bundled in the app.
const SEQUENCE_ABOVE_BUNDLED = 999_999;
const ROLLOUT_TO_EVERYONE = {
    environment: { min_suite_version: '1.0.0', min_suite_native_version: '1.0.0' },
    rollout_probability: 100,
};
const INSTALL_ONLY_FIELDS = {
    url: `${CHANNEL_DIR}/latest.bin`,
    fingerprint: '0'.repeat(64),
    translations: {},
};

const parseVersion = (version: string) => {
    const parsed = versionUtils.tryParse(version);
    if (!parsed) {
        throw new Error(`Invalid firmware version: ${version}`);
    }

    return parsed;
};

// Connect fetches the release file of every model the config lists and drops the whole remote
// config when any of them is missing, so the config names only the model under test.
const releaseConfig = (model: Model) => ({
    version: 1,
    timestamp: '2026-01-01T00:00:00.000Z',
    sequence: SEQUENCE_ABOVE_BUNDLED,
    releases: {
        [model]: {
            universal: {
                firmware_type: FirmwareType.Universal,
                conditions: ROLLOUT_TO_EVERYONE,
                releasePath: RELEASE_PATH,
            },
            'bitcoin-only': {
                firmware_type: FirmwareType.BitcoinOnly,
                conditions: ROLLOUT_TO_EVERYONE,
                releasePath: RELEASE_PATH,
            },
        } satisfies Record<FirmwareType, ConditionalRelease>,
    },
    // Connect throws when reading intermediaries off a config that does not declare them.
    intermediaries: {},
});

const release = (version: string) =>
    ({
        required: false,
        version: parseVersion(version),
        min_firmware_version: [1, 0, 0],
        min_bootloader_version: [1, 0, 0],
        changelog: `* ${MOCKED_FIRMWARE_CHANGELOG}`,
        ...INSTALL_ONLY_FIELDS,
    }) satisfies FirmwareRelease;

export class FirmwareReleaseConfigMock {
    private server: Server | undefined;
    private readonly servedPaths: string[] = [];

    constructor(
        private readonly page: Page,
        private readonly device: DeviceFixture,
    ) {}

    // Call before the analytics consent: that is when Connect initializes and reads the channel.
    @step()
    async start(releaseVersion: string) {
        const routes: Record<string, unknown> = {
            [CONFIG_PATH]: releaseConfig(this.device.model),
            [RELEASE_PATH]: release(releaseVersion),
        };

        this.server = createServer((request, response) => {
            const path = (request.url ?? '').slice(1);
            this.servedPaths.push(path);
            response.setHeader('access-control-allow-origin', '*');

            const route = routes[path];
            if (route) {
                response.writeHead(200, { 'content-type': 'application/json' });
                response.end(JSON.stringify(route));

                return;
            }

            // Serving the binary makes Connect hash the whole firmware on the device, ~7s per test.
            if (path.endsWith('.bin')) {
                response.writeHead(404);
                response.end();

                return;
            }

            // Connect also asks for the release of the firmware the device already runs (revision
            // check). Only the offered release is mocked, the rest is answered by the real host.
            void fetch(`https://data.trezor.io/${path.replace(CHANNEL_DIR, 'firmware')}`)
                .then(async upstream => {
                    response.writeHead(upstream.status, {
                        'content-type':
                            upstream.headers.get('content-type') ?? 'application/octet-stream',
                    });
                    response.end(Buffer.from(await upstream.arrayBuffer()));
                })
                .catch(() => {
                    response.writeHead(502);
                    response.end();
                });
        });

        await new Promise<void>(resolve => this.server!.listen(PORT, resolve));

        await this.page.ensureStoreOnDesktop();
        await this.page.evaluate(
            action => window.store.dispatch(action),
            firmwareActions.setFirmwareChannel(CHANNEL),
        );
    }

    // Connect falls back to the bundled config silently, and it only initializes after the
    // analytics consent, so call this once the test is past that screen.
    @step()
    async expectReleaseConfigServed() {
        await expect
            .poll(() => this.servedPaths, {
                message: 'expected Connect to read the firmware release config from the mock',
                timeout: 30_000,
            })
            .toContain(CONFIG_PATH);
    }

    @step()
    async stop() {
        if (!this.server) return;

        await new Promise<void>(resolve => this.server!.close(() => resolve()));
        this.server = undefined;
    }
}
