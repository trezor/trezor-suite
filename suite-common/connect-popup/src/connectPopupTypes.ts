import { Deferred } from '@trezor/utils';

export type ConnectPopupCall = {
    method: string;
    processName?: string;
    origin?: string;
    confirmation: Deferred<void>;
};
