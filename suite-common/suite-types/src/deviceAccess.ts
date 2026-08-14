/**
 * How a request competes with the other device calls.
 *
 * The platforms serialize device access differently — the mobile app queues calls on a mutex, the
 * desktop and web app only guard them with the Redux device lock — so a priority describes what the
 * caller wants, not what the mechanism underneath does with it.
 */
export type DeviceAccessPriority =
    /** Go ahead of everything already waiting. */
    | 'prioritized'
    /** Wait for the turn. */
    | 'default'
    /**
     * Give up instead of waiting. For calls that repeat on a timer, where a skipped attempt costs
     * nothing and a queued one would only pile up behind the others.
     */
    | 'skipIfBusy';

export type RequestDeviceAccessOptions = {
    priority?: DeviceAccessPriority;
};

export type DeviceAccessResult<TPayload> =
    { success: true; payload: TPayload } | { success: false; error: string; wasSkipped: boolean };

/**
 * Runs a device call under the platform's locking mechanism.
 *
 * Failure to reach the device and failure of the call itself are both reported as `success: false`;
 * `wasSkipped` tells the two apart from the case where the request gave up on its own because the
 * device was busy, which is a normal outcome of `skipIfBusy` rather than an error.
 */
export type RequestDeviceAccess = <TPayload>(
    deviceCallback: () => TPayload,
    options?: RequestDeviceAccessOptions,
) => Promise<DeviceAccessResult<Awaited<TPayload>>>;

export type RequestDeviceAccessDep = {
    requestDeviceAccess: RequestDeviceAccess;
};
