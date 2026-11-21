import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { type ERRORS } from '@trezor/connect-common';
import { isArrayMember } from '@trezor/utils';

export type DiscoveryFailureCause = 'stopped' | 'device-connection' | 'loading';

// `Method_Cancel` comes from every `TrezorConnect.cancel`, including the PIN and passphrase
// modals, so it does not tell the user's own cancellation apart from another feature's.
const STOPPED_ERROR_CODES: ERRORS.ErrorCode[] = [
    'Method_Cancel',
    'Failure_ActionCancelled',
    'Failure_PinCancelled',
];

const DEVICE_CONNECTION_ERROR_CODES: ERRORS.ErrorCode[] = [
    'Device_Disconnected',
    'Device_NotFound',
    'Device_UsedElsewhere',
    'Transport_Missing',
    'ThpTransportBusy',
    'ThpUnallocatedChannel',
    'ThpDecryptionFailed',
    'ThpDeviceLocked',
    'ThpUnknownError',
];

/**
 * Why the dashboard has no assets to show, so that the card does not blame the network for a
 * problem with the Trezor connection.
 */
export const getDiscoveryFailureCause = (
    discovery: DiscoveryStatus | undefined,
): DiscoveryFailureCause => {
    if (discovery?.status === 'cancelled') return 'stopped';
    if (discovery?.status !== 'failed' || discovery.errorCode === undefined) return 'loading';
    if (isArrayMember(discovery.errorCode, STOPPED_ERROR_CODES)) return 'stopped';
    if (isArrayMember(discovery.errorCode, DEVICE_CONNECTION_ERROR_CODES)) {
        return 'device-connection';
    }

    return 'loading';
};
