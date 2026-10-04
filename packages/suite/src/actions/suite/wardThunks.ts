import { type SuiteSettingsRootState, selectWarddToken, selectWarddUrl } from '@suite/settings';
import { getProofOfDelegatedIdentity } from '@suite-common/delegated-identity-key';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import {
    type DeviceRootState,
    isTrezorDeviceWithState,
    selectDeviceByStaticSessionId,
    selectSelectedDevice,
} from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import {
    type DeviceCancelledErrType,
    type DeviceErrorType,
    type DeviceNotConnectedErrorType,
    type TrezorDeviceWithState,
} from '@suite-common/suite-types';
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';
import { type Result, err, exhaustive, ok } from '@trezor/type-utils';

import { type WardError, getWardErrorFromConnect } from 'src/utils/suite/wardErrors';

const WARD_PREFIX = '@suite/ward';

// `wardRelay` fetches the wallet's Evolu node with this proof and hands it to wardd, which owns the
// wallet's WARD replica with a child of that node. The node itself never reaches Suite.
const PROOF_OF_DELEGATED_IDENTITY_HEADER = 'EvoluGetNode';

export type WardStatus = {
    counter: number;
    /** `null` until the witness knows this wallet. */
    wmCounter: number | null;
    isBehind: boolean;
};

export type WardFlushResult = {
    published: number;
    remaining: number;
};

type WardDevice = {
    device: TrezorDeviceWithState;
    deviceState: StaticSessionId;
};

type DelegatedIdentityKeyError =
    DeviceErrorType | DeviceCancelledErrType | DeviceNotConnectedErrorType;

const getDeviceParam = (device: TrezorDeviceWithState) => ({
    path: device.path,
    instance: device.instance,
    state: device.state,
    useEmptyPassphrase: device.useEmptyPassphrase,
});

// Every WARD call is scoped to the selected wallet. The device derives the entry keys, and wardd
// opens the store of the wallet, that is the passphrase, that the session is unlocked for.
const requireDevice = (getState: () => DeviceRootState): Result<WardDevice, WardError> => {
    const device = selectSelectedDevice(getState());

    if (!isTrezorDeviceWithState(device) || !device.connected) {
        return err({ code: 'no_device' });
    }

    return ok({ device, deviceState: device.state.staticSessionId });
};

const getWardErrorFromDelegatedKeyError = (error: DelegatedIdentityKeyError): WardError => {
    switch (error.type) {
        case 'DeviceCancelled':
            return { code: 'cancelled' };
        case 'DeviceNotConnectedError':
            return { code: 'no_device', detail: error.message };
        case 'DeviceError':
            return { code: 'device_failure', detail: error.message };
        default:
            return exhaustive(error);
    }
};

const getCount = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;

const parseWardStatus = (result: Record<string, unknown>): Result<WardStatus, WardError> => {
    const counter = getCount(result.counter);
    const wmCounter = result.wmCounter === null ? null : getCount(result.wmCounter);

    if (counter === undefined || wmCounter === undefined) {
        return err({ code: 'internal', detail: 'wardd sent a status without counters' });
    }

    return ok({ counter, wmCounter, isBehind: result.behind === true });
};

const parseWardFlushResult = (
    result: Record<string, unknown>,
): Result<WardFlushResult, WardError> => {
    const published = getCount(result.published);
    const remaining = getCount(result.remaining);

    if (published === undefined || remaining === undefined) {
        return err({ code: 'internal', detail: 'wardd sent a flush result without counts' });
    }

    return ok({ published, remaining });
};

type WardRelayState = DeviceRootState & SuiteSettingsRootState;

type WardRelayDeps = {
    services: EnsureDelegatedIdentityKeyDep;
};

type RunWardRelayParams = {
    operation: 'flush' | 'status';
    expectedDeviceState: StaticSessionId | undefined;
    getState: () => WardRelayState;
    extra: WardRelayDeps;
};

// Lends the selected wallet's session to wardd for one operation. wardd then drives the device
// itself with `WardSync`, `WardFlushQueue` and the rest. Suite only supplies the token and the
// proof.
const runWardRelay = async ({
    operation,
    expectedDeviceState,
    getState,
    extra,
}: RunWardRelayParams): Promise<Result<Record<string, unknown>, WardError>> => {
    const url = selectWarddUrl(getState());
    const token = selectWarddToken(getState());

    if (token === undefined) {
        return err({ code: 'missing_token' });
    }

    const selected = requireDevice(getState);

    if (!selected.success) {
        return selected;
    }

    const { device, deviceState } = selected.payload;

    if (expectedDeviceState !== undefined && expectedDeviceState !== deviceState) {
        return err({ code: 'wallet_changed' });
    }

    const delegatedKey = await extra.services.ensureDelegatedIdentityKey({ device });

    if (!delegatedKey.success) {
        return err(getWardErrorFromDelegatedKeyError(delegatedKey.error));
    }

    const proof = getProofOfDelegatedIdentity({
        delegatedKey: delegatedKey.payload,
        header: PROOF_OF_DELEGATED_IDENTITY_HEADER,
    });

    // Signing fails only when the stored delegated key is corrupted.
    if (!proof.success) {
        return err({
            code: 'internal',
            detail: 'the delegated identity proof could not be signed',
        });
    }

    // Retrieving the delegated key may have changed the session id, so take the device as it is
    // now. The static session id still names the same wallet.
    const currentDevice = selectDeviceByStaticSessionId(getState(), deviceState);

    if (currentDevice === undefined) {
        return err({ code: 'no_device' });
    }

    const response = await TrezorConnect.wardRelay({
        device: getDeviceParam(currentDevice),
        url,
        token,
        op: operation,
        proof_of_delegated_identity: proof.payload,
    });

    if (!response.success) {
        return err(getWardErrorFromConnect(response.error));
    }

    return ok(response.payload);
};

export type WardQueueEntryThunkParams = {
    /** The wallet the caller writes for. The write is refused if another wallet is selected. */
    deviceState: StaticSessionId;
    appId: string;
    /** Hex-encoded bytes. */
    identifier: string;
    /** Hex-encoded bytes. */
    value: string;
};

export type WardQueueEntryThunkState = DeviceRootState & SuiteSettingsRootState;

/**
 * Queue a WARD write on the device, which shows it and asks the user to confirm. The change
 * reaches WARD with the next `wardFlushThunk`.
 *
 * Fails with `wallet_changed` if `deviceState` is not the selected wallet when the request starts.
 * A confirmed write succeeds even if the user selected another wallet during the confirmation: the
 * request named `deviceState`, so the device queued the change for that wallet, and the caller
 * records it for `deviceState`. `wardFlushThunk({ deviceState })` then reports `wallet_changed`
 * until that wallet is selected again, and the change waits in the device queue.
 */
export const wardQueueEntryThunk = createThunk<
    Result<void, WardError>,
    WardQueueEntryThunkParams,
    { state: WardQueueEntryThunkState }
>(
    `${WARD_PREFIX}/queueEntry`,
    async ({ deviceState: expectedDeviceState, appId, identifier, value }, { getState }) => {
        // Without wardd the change could never be published. The device queue holds 20 changes,
        // shared by all wallets, so do not ask the user to confirm one that cannot leave it.
        if (selectWarddToken(getState()) === undefined) {
            return err({ code: 'missing_token' });
        }

        const selected = requireDevice(getState);

        if (!selected.success) {
            return selected;
        }

        const { device, deviceState } = selected.payload;

        if (deviceState !== expectedDeviceState) {
            return err({ code: 'wallet_changed' });
        }

        const response = await TrezorConnect.wardQueueSetEntry({
            device: getDeviceParam(device),
            app_id: appId,
            identifier,
            value,
            // A compact record stores only a hash of the identity, so the device can publish it
            // only when the flush names it. wardd's flush drains the queue without naming entries.
            compact: false,
        });

        if (!response.success) {
            return err(getWardErrorFromConnect(response.error));
        }

        return ok();
    },
);

export type WardFlushThunkParams = {
    /** Refuse unless this wallet is still the selected one, e.g. right after queueing for it. */
    deviceState?: StaticSessionId;
};

export type WardFlushThunkState = WardRelayState;

export type WardFlushThunkDeps = WardRelayDeps;

/**
 * Publish the changes the selected wallet holds in the device queue. wardd syncs the device,
 * drains its queue and advances the witness, all in one device session and without a screen.
 */
export const wardFlushThunk = createThunk<
    Result<WardFlushResult, WardError>,
    WardFlushThunkParams | undefined,
    { state: WardFlushThunkState; extra: WardFlushThunkDeps }
>(`${WARD_PREFIX}/flush`, async (params, { getState, extra }) => {
    const relay = await runWardRelay({
        operation: 'flush',
        expectedDeviceState: params?.deviceState,
        getState,
        extra,
    });

    if (!relay.success) {
        return relay;
    }

    return parseWardFlushResult(relay.payload);
});

export type WardStatusThunkState = WardRelayState;

export type WardStatusThunkDeps = WardRelayDeps;

/**
 * The head of the selected wallet's WARD replica and the witness's. The device is asked only for
 * the wallet's WARD id and Evolu node.
 */
export const wardStatusThunk = createThunk<
    Result<WardStatus, WardError>,
    void,
    { state: WardStatusThunkState; extra: WardStatusThunkDeps }
>(`${WARD_PREFIX}/status`, async (_, { getState, extra }) => {
    const relay = await runWardRelay({
        operation: 'status',
        expectedDeviceState: undefined,
        getState,
        extra,
    });

    if (!relay.success) {
        return relay;
    }

    return parseWardStatus(relay.payload);
});

export type WardResetAppThunkState = DeviceRootState;

/**
 * Retire the app the device pinned as its WARD app, so that another app (or this one after its
 * host key changed) may claim the role. The user holds to confirm on the device. Nothing stored in
 * WARD is discarded. `wasBound` tells whether a pin was actually retired.
 */
export const wardResetAppThunk = createThunk<
    Result<{ wasBound: boolean }, WardError>,
    void,
    { state: WardResetAppThunkState }
>(`${WARD_PREFIX}/resetApp`, async (_, { getState }) => {
    const selected = requireDevice(getState);

    if (!selected.success) {
        return selected;
    }

    const response = await TrezorConnect.wardResetApp({
        device: getDeviceParam(selected.payload.device),
    });

    if (!response.success) {
        return err(getWardErrorFromConnect(response.error));
    }

    return ok({ wasBound: response.payload.was_bound === true });
});
