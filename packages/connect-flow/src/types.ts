export const SUBPROCESS_TYPE = {
    REQUEST_PASSPHRASE: 'ui-request_passphrase',
    REQUEST_PASSPHRASE_ON_DEVICE: 'ui-request_passphrase_on_device',
    REQUEST_PIN: 'ui-request_pin',
    REQUEST_BUTTON: 'ui-request_button',
    REQUEST_CONFIRMATION: 'ui-request_confirmation',
    COMPLETE: 'flow-complete',
    ERROR: 'flow-error',
} as const;

export type SubProcessType = (typeof SUBPROCESS_TYPE)[keyof typeof SUBPROCESS_TYPE];

export interface SubProcessBase {
    readonly callId: string;
    readonly requestId?: string;
    cancel(): void;
}

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
    code: string;
    data?:
        | { type: 'address'; serializedPath: string; address: string }
        | { type: 'message'; message: string };
};

export type RequestConfirmationSubProcess = SubProcessBase & {
    type: typeof SUBPROCESS_TYPE.REQUEST_CONFIRMATION;
    view: string;
    label?: string;
    confirm: (value: boolean) => void;
};

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

export type WalletSubProcess =
    | RequestPassphraseSubProcess
    | RequestPassphraseOnDeviceSubProcess
    | RequestPinSubProcess
    | RequestButtonSubProcess
    | RequestConfirmationSubProcess
    | CompleteSubProcess<WalletResult>
    | ErrorSubProcess;

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

export type GetAddressSubProcess =
    | RequestPassphraseSubProcess
    | RequestPassphraseOnDeviceSubProcess
    | RequestPinSubProcess
    | RequestButtonSubProcess
    | RequestConfirmationSubProcess
    | CompleteSubProcess<AddressResult>
    | ErrorSubProcess;

export interface ConnectService {
    createWallet(options: CreateWalletOptions): Process<WalletSubProcess>;
    getAddress(options: GetAddressOptions): Process<GetAddressSubProcess>;
}
