import { type Getter } from '@suite-common/dependency-injection';
import {
    type RequestDeviceAccessDep,
    type RerunFwAuthenticityChecksCall,
    type TrezorConnectDep,
    type TrezorDevice,
} from '@suite-common/suite-types';

export type RerunFwAuthenticityChecksDeps = RequestDeviceAccessDep &
    TrezorConnectDep & {
        getSelectedDevice: Getter<[], TrezorDevice | undefined>;
    };

/**
 * Connect call to rerun FW authenticity checks (getFeatures used as the most basic no-op device call).
 *
 * This retries on a timer for as long as the checks keep failing, so it asks for the device only
 * when nothing else wants it. The result is irrelevant, and so is when it arrives: Connect updates
 * the device payload and that propagates into Redux on its own.
 */
export const createRerunFwAuthenticityChecks =
    (deps: RerunFwAuthenticityChecksDeps): RerunFwAuthenticityChecksCall =>
    () => {
        const device = deps.getSelectedDevice();
        if (device === undefined) return;

        void deps.requestDeviceAccess(
            () => deps.trezorConnect.getFeatures({ device: { path: device.path } }),
            { priority: 'skipIfBusy' },
        );
    };
