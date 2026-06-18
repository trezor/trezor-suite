import type { UiRequestConfirmation } from '@trezor/connect-common';

import { UI_REQUEST, type UiEvent } from './trezorConnectLike';

// Values come straight from connect-common's UI_REQUEST constants — there is no
// intermediate string definition that could drift from the real event types.
// Only interactive UI events get a dedicated SUBPROCESS_TYPE entry; everything
// else flows through the umbrella `UiNotificationSubProcess` and discriminates
// directly on the underlying `UI_REQUEST.*` value. A subprocess is emitted only
// when a UI event arrives — the call's result/error comes from `toPromise()`.
export const SUBPROCESS_TYPE = {
    REQUEST_PASSPHRASE: UI_REQUEST.REQUEST_PASSPHRASE,
    REQUEST_PIN: UI_REQUEST.REQUEST_PIN,
    REQUEST_CONFIRMATION: UI_REQUEST.REQUEST_CONFIRMATION,
} as const;

export type SubProcessType = (typeof SUBPROCESS_TYPE)[keyof typeof SUBPROCESS_TYPE];

export interface SubProcessBase {
    readonly callId: string;
    readonly requestId?: string;
    cancel(): void;
}

// UI events the flow exposes as interactive subprocesses — the consumer must
// produce a response (PIN / passphrase / confirmation value) to unblock the
// device call. Everything else falls into UiNotificationSubProcess.
type InteractiveEventType =
    | typeof UI_REQUEST.REQUEST_PIN
    | typeof UI_REQUEST.REQUEST_PASSPHRASE
    | typeof UI_REQUEST.REQUEST_CONFIRMATION;

export type RequestPassphraseSubProcess = SubProcessBase & {
    type: typeof SUBPROCESS_TYPE.REQUEST_PASSPHRASE;
    send: (passphrase: string, options?: { save?: boolean }) => void;
};

export type RequestPinSubProcess = SubProcessBase & {
    type: typeof SUBPROCESS_TYPE.REQUEST_PIN;
    send: (pin: string) => void;
};

export type RequestConfirmationSubProcess = SubProcessBase & {
    type: typeof SUBPROCESS_TYPE.REQUEST_CONFIRMATION;
    view: UiRequestConfirmation['payload']['view'];
    label?: string;
    confirm: (value: boolean) => void;
};

// Non-interactive UI events pass through with their original payload preserved
// so consumers can discriminate by `type` and read the full event data
// (e.g. `subprocess.payload.code` for `'ui-button'`,
// `subprocess.payload.progress` for `'ui-bundle_progress'`).
export type UiNotificationSubProcess = SubProcessBase &
    Exclude<UiEvent, { type: InteractiveEventType }>;

// A subprocess is emitted only when a UI event arrives from connect. The call's
// result/error is delivered via `Process.toPromise()`, not as a subprocess.
export type AnySubProcess =
    | RequestPassphraseSubProcess
    | RequestPinSubProcess
    | RequestConfirmationSubProcess
    | UiNotificationSubProcess;

export interface Process<TResult> {
    readonly callId: string;
    run(): AsyncIterableIterator<AnySubProcess>;
    cancel(): void;
    toPromise(): Promise<TResult>;
}

export interface CreateWalletOptions {
    devicePath: string;
    usePassphrase: boolean;
}

export interface WalletResult {
    deviceState: string;
}

export type WalletSubProcess = AnySubProcess;

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

export type GetAddressSubProcess = AnySubProcess;

export interface ConnectService {
    createWallet(options: CreateWalletOptions): Process<WalletResult>;
    getAddress(options: GetAddressOptions): Process<AddressResult>;
}
