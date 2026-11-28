import { type DiscoveryStatus } from '@suite-common/wallet-types';

import { type DiscoveryFailureCause, getDiscoveryFailureCause } from './getDiscoveryFailureCause';

describe('getDiscoveryFailureCause', () => {
    it.each<{ name: string; discovery: DiscoveryStatus | undefined; cause: DiscoveryFailureCause }>(
        [
            {
                name: 'a cancelled run',
                discovery: { status: 'cancelled' },
                cause: 'stopped',
            },
            {
                name: 'a run cancelled on the device',
                discovery: {
                    status: 'failed',
                    error: 'Action cancelled by user',
                    errorCode: 'Failure_ActionCancelled',
                },
                cause: 'stopped',
            },
            {
                name: 'a PIN entry cancelled in Suite',
                discovery: {
                    status: 'failed',
                    error: 'pin-cancelled',
                    errorCode: 'Method_Cancel',
                },
                cause: 'stopped',
            },
            {
                name: 'a disconnected device',
                discovery: {
                    status: 'failed',
                    error: 'Device disconnected',
                    errorCode: 'Device_Disconnected',
                },
                cause: 'device-connection',
            },
            {
                name: 'a missing transport',
                discovery: {
                    status: 'failed',
                    error: 'Transport is missing',
                    errorCode: 'Transport_Missing',
                },
                cause: 'device-connection',
            },
            {
                name: 'a broken THP channel',
                discovery: {
                    status: 'failed',
                    error: 'Unallocated channel',
                    errorCode: 'ThpUnallocatedChannel',
                },
                cause: 'device-connection',
            },
            {
                name: 'a device without the required capability',
                discovery: {
                    status: 'failed',
                    error: 'Device is missing capability',
                    errorCode: 'Device_MissingCapability',
                },
                cause: 'loading',
            },
            {
                name: 'a failure without a code',
                discovery: {
                    status: 'failed',
                    error: 'there must be either one or zero physical devices without state',
                },
                cause: 'loading',
            },
            {
                name: 'a backend failure',
                discovery: {
                    status: 'failed',
                    error: 'All backends are down',
                    errorCode: 'Backend_Error',
                },
                cause: 'loading',
            },
            {
                name: 'a complete run with failed accounts',
                discovery: { status: 'complete' },
                cause: 'loading',
            },
        ],
    )('blames $cause for $name', ({ discovery, cause }) => {
        expect(getDiscoveryFailureCause(discovery)).toBe(cause);
    });
});
