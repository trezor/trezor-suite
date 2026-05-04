import type { DeviceUniquePath } from '@trezor/connect-common';
import type { Descriptor } from '@trezor/transport-abstract';
import { Log } from '@trezor/utils';

import { Device } from '../Device';
import { checkFirmwareHash } from '../workflow/checkFirmwareHash';
import { checkFirmwareHashWithRetries } from '../workflow/checkFirmwareHashWithRetries';

jest.mock('../workflow/checkFirmwareHash', () => ({
    ...jest.requireActual('../workflow/checkFirmwareHash'),
    checkFirmwareHash: jest.fn(
        jest.requireActual('../workflow/checkFirmwareHash').checkFirmwareHash,
    ),
}));

const { createTestTransport } = global.JestMocks;

const logger = new Log('Test', false);
const transport = createTestTransport();

const getMockedDevice = (): Device => {
    const device = new Device({
        id: 'mock-device-id' as DeviceUniquePath,
        transport,
        descriptor: {} as Descriptor,
    });

    device.setAuthenticityChecks = jest.fn(device.setAuthenticityChecks);

    return device;
};

describe(checkFirmwareHashWithRetries.name, () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('performs check successfully from initial state', async () => {
        (checkFirmwareHash as jest.Mock).mockImplementation(() =>
            Promise.resolve({ success: true }),
        );

        const device = getMockedDevice();
        device.getAuthenticityChecks = jest.fn(() => ({
            firmwareRevision: null,
            firmwareHash: null,
        }));
        await checkFirmwareHashWithRetries({ device, logger });
        expect(checkFirmwareHash).toHaveBeenCalled();
        expect(device.setAuthenticityChecks).toHaveBeenCalledWith({
            success: true,
            attemptCount: 1,
        });
    });

    it('performs check with error from initial state', async () => {
        (checkFirmwareHash as jest.Mock).mockImplementation(() =>
            Promise.resolve({ success: false, error: 'hash-mismatch' }),
        );

        const device = getMockedDevice();
        device.getAuthenticityChecks = jest.fn(() => ({
            firmwareRevision: null,
            firmwareHash: null,
        }));
        await checkFirmwareHashWithRetries({ device, logger });
        expect(checkFirmwareHash).toHaveBeenCalled();
        expect(device.setAuthenticityChecks).toHaveBeenCalledWith({
            success: false,
            error: 'hash-mismatch',
            attemptCount: 1,
        });
    });

    it('does not retry the check from success', async () => {
        const device = getMockedDevice();
        device.getAuthenticityChecks = jest.fn(() => ({
            firmwareRevision: null,
            firmwareHash: { success: true },
        }));
        await checkFirmwareHashWithRetries({ device, logger });
        expect(checkFirmwareHash).not.toHaveBeenCalled();
        expect(device.setAuthenticityChecks).not.toHaveBeenCalled();
    });

    it('does not retry the check after decisive error', async () => {
        const device = getMockedDevice();
        device.getAuthenticityChecks = jest.fn(() => ({
            firmwareRevision: null,
            firmwareHash: { success: false, error: 'hash-mismatch' },
        }));
        await checkFirmwareHashWithRetries({ device, logger });
        expect(checkFirmwareHash).not.toHaveBeenCalled();
        expect(device.setAuthenticityChecks).not.toHaveBeenCalled();
    });

    it('does retry with success for a retriable error', async () => {
        (checkFirmwareHash as jest.Mock).mockImplementation(() =>
            Promise.resolve({ success: true }),
        );

        const device = getMockedDevice();
        device.getAuthenticityChecks = jest.fn(() => ({
            firmwareRevision: null,
            firmwareHash: {
                success: false,
                error: 'other-error',
                attemptCount: 1,
                errorPayload: 'first bug',
            },
        }));
        await checkFirmwareHashWithRetries({ device, logger });
        expect(checkFirmwareHash).toHaveBeenCalled();
        expect(device.setAuthenticityChecks).toHaveBeenCalledWith({
            success: true,
            attemptCount: 2,
            warningPayload: { lastErrorPayload: 'first bug' },
        });
    });

    it('does a single retry with error for a retriable error', async () => {
        (checkFirmwareHash as jest.Mock).mockImplementation(() =>
            Promise.resolve({
                success: false,
                error: 'other-error',
                errorPayload: 'second bug',
            }),
        );

        const device = getMockedDevice();
        device.getAuthenticityChecks = jest.fn(() => ({
            firmwareRevision: null,
            firmwareHash: {
                success: false,
                error: 'other-error',
                attemptCount: 1,
                errorPayload: 'first bug',
            },
        }));
        await checkFirmwareHashWithRetries({ device, logger });
        expect(checkFirmwareHash).toHaveBeenCalled();
        expect(device.setAuthenticityChecks).toHaveBeenCalledWith({
            success: false,
            error: 'other-error',
            attemptCount: 2,
            errorPayload: 'second bug',
        });
    });

    it('does not retry a retriable error if retry limit was reached', async () => {
        const device = getMockedDevice();
        device.getAuthenticityChecks = jest.fn(() => ({
            firmwareRevision: null,
            firmwareHash: { success: false, error: 'other-error', attemptCount: 9 },
        }));
        await checkFirmwareHashWithRetries({ device, logger });
        expect(checkFirmwareHash).not.toHaveBeenCalled();
        expect(device.setAuthenticityChecks).not.toHaveBeenCalled();
    });

    it('keeps retrying timeout error until time limit is satisfied', async () => {
        let counter = 0;
        (checkFirmwareHash as jest.Mock).mockImplementation(() => {
            counter++;

            return Promise.resolve(
                counter < 3 ? { success: false, error: 'takes-too-long' } : { success: true },
            );
        });

        const device = getMockedDevice();
        device.getAuthenticityChecks = jest.fn(() => ({
            firmwareRevision: null,
            firmwareHash: null,
        }));
        await checkFirmwareHashWithRetries({ device, logger });
        expect(checkFirmwareHash).toHaveBeenCalledTimes(3);
        expect(device.setAuthenticityChecks).toHaveBeenCalledWith({
            success: false,
            error: 'takes-too-long',
            attemptCount: 1, // the retry is done internally, the counter is to track the number of workflow calls
        });
    });

    it('keeps retrying timeout error until retry limit is reached', async () => {
        (checkFirmwareHash as jest.Mock).mockImplementation(() =>
            Promise.resolve({ success: false, error: 'takes-too-long' }),
        );

        const device = getMockedDevice();
        device.getAuthenticityChecks = jest.fn(() => ({
            firmwareRevision: null,
            firmwareHash: null,
        }));
        await checkFirmwareHashWithRetries({ device, logger });
        expect(checkFirmwareHash).toHaveBeenCalledTimes(5);
        expect(device.setAuthenticityChecks).toHaveBeenCalledWith({
            success: false,
            error: 'takes-too-long',
            attemptCount: 1, // the retry is done internally, the counter is to track the number of workflow calls
        });
    });
});
