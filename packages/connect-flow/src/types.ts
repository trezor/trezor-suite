import type { UiRequestButton, UiRequestConfirmation } from '@trezor/connect-common';

import { UI_REQUEST, type UiEvent } from './trezorConnectLike';

// Values come straight from connect-common's UI_REQUEST constants — there is no
// intermediate string definition that could drift from the real event types.
// Each UI event the consumer needs to react to (interactive ones like PIN /
// passphrase, plus the most common observation events like button requests
// and on-device passphrase entry) has a dedicated SUBPROCESS_TYPE entry;
// everything else flows through the umbrella `UiNotificationSubProcess`.
export const SUBPROCESS_TYPE = {
    REQUEST_PASSPHRASE: UI_REQUEST.REQUEST_PASSPHRASE,
    REQUEST_PASSPHRASE_ON_DEVICE: UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE,
    REQUEST_PIN: UI_REQUEST.REQUEST_PIN,
    REQUEST_BUTTON: UI_REQUEST.REQUEST_BUTTON,
    REQUEST_CONFIRMATION: UI_REQUEST.REQUEST_CONFIRMATION,
    COMPLETE: 'flow-complete',
    ERROR: 'flow-error',
} as const;

export type SubProcessType = (typeof SUBPROCESS_TYPE)[keyof typeof SUBPROCESS_TYPE];

export interface SubProcessBase {
    readonly callId: string;
    readonly requestId?: string;
    cancel(): void;
}

// UI events the flow exposes as their own subprocess variant. Interactive
// ones (PIN / passphrase / confirmation) require the consumer to send a
// response to unblock the device call; observation ones (button request,
// on-device passphrase) just surface that the device is waiting for the
// user. Everything else falls into UiNotificationSubProcess.
type DedicatedEventType =
    | typeof UI_REQUEST.REQUEST_PIN
    | typeof UI_REQUEST.REQUEST_PASSPHRASE
    | typeof UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE
    | typeof UI_REQUEST.REQUEST_BUTTON
    | typeof UI_REQUEST.REQUEST_CONFIRMATION;

export type RequestPassphraseSubProcess = SubProcessBase & {
    type: typeof SUBPROCESS_TYPE.REQUEST_PASSPHRASE;
    send: (passphrase: string, options?: { save?: boolean }) => void;
};

export type RequestPassphraseOnDeviceSubProcess = SubProcessBase & {
    type: typeof SUBPROCESS_TYPE.REQUEST_PASSPHRASE_ON_DEVICE;
};

export type RequestPinSubProcess = SubProcessBase & {
    type: typeof SUBPROCESS_TYPE.REQUEST_PIN;
    send: (pin: string) => void;
};

export type RequestButtonSubProcess = SubProcessBase & {
    type: typeof SUBPROCESS_TYPE.REQUEST_BUTTON;
    code: UiRequestButton['payload']['code'];
};

export type RequestConfirmationSubProcess = SubProcessBase & {
    type: typeof SUBPROCESS_TYPE.REQUEST_CONFIRMATION;
    view: UiRequestConfirmation['payload']['view'];
    label?: string;
    confirm: (value: boolean) => void;
};

// Non-interactive UI events pass through with their original payload preserved
// so consumers can discriminate by `type` and read the full event data
// (e.g. `subprocess.payload.progress` for `'ui-bundle_progress'`).
export type UiNotificationSubProcess = SubProcessBase &
    Exclude<UiEvent, { type: DedicatedEventType }>;

export type CompleteSubProcess<TResult> = SubProcessBase & {
    type: typeof SUBPROCESS_TYPE.COMPLETE;
    result: TResult;
};

export type ErrorSubProcess = SubProcessBase & {
    type: typeof SUBPROCESS_TYPE.ERROR;
    error: Error;
};

export type AnySubProcess<TResult> =
    | RequestPassphraseSubProcess
    | RequestPassphraseOnDeviceSubProcess
    | RequestPinSubProcess
    | RequestButtonSubProcess
    | RequestConfirmationSubProcess
    | UiNotificationSubProcess
    | CompleteSubProcess<TResult>
    | ErrorSubProcess;

export type ResultOf<T extends SubProcessBase> = T extends CompleteSubProcess<infer R> ? R : never;

export interface Process<TSubProcess extends SubProcessBase> {
    readonly callId: string;
    run(): AsyncIterableIterator<TSubProcess>;
    cancel(): void;
    toPromise(): Promise<ResultOf<TSubProcess>>;
}

export interface CreateWalletOptions {
    devicePath: string;
    usePassphrase: boolean;
}

export interface WalletResult {
    deviceState: string;
}

export type WalletSubProcess = AnySubProcess<WalletResult>;

export interface GetAddressOptions {
    devicePath?: string;
    path: string | number[];
    coin?: string;
    showOnTrezor?: boolean;
}

export interface AddressResult {
    address: string;
    path: number[];
    serializedPath: string;
}

export type GetAddressSubProcess = AnySubProcess<AddressResult>;

export interface ConnectService {
    createWallet(options: CreateWalletOptions): Process<WalletSubProcess>;
    getAddress(options: GetAddressOptions): Process<GetAddressSubProcess>;
    /**
     * Look up a currently-running process by its `callId`. Returns `null`
     * if no process with that id is registered (it never started, or it
     * has already completed/errored/cancelled and removed itself).
     */
    getProcess(options: { processId: string }): Process<AnySubProcess<unknown>> | null;
}
