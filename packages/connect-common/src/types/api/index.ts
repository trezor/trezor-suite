import type { TrezorConnectCallable } from './callable';
import type { TrezorConnectInternal } from './internal';
import type { TrezorConnectManagement } from './management';
import type { CallMethodPayload } from '../../events/call';
import type { ConnectSettings, Manifest } from '../settings';

export type { TrezorConnectCallable };

export interface TrezorConnectCore<InitSettings extends Record<string, any>> {
    init(settings: InitSettings & { manifest: Manifest }): Promise<void>;
    call(params: CallMethodPayload): Promise<any>;
    cancel(params?: string | { reason?: string; callId?: string }): void;
    dispose(): void;
}

export type TrezorConnectPublicAPI<InitSettings extends Record<string, any>> =
    TrezorConnectCore<InitSettings> & Omit<TrezorConnectCallable, keyof TrezorConnectManagement>;

export type TrezorConnectPrivilegedAPI = TrezorConnectCore<ConnectSettings> &
    TrezorConnectInternal &
    TrezorConnectCallable;
