import type { TrezorConnectCallable, TrezorConnectPublicCallable } from './callable';
import type { TrezorConnectInternal } from './internal';
import type { CallMethodPayload } from '../../events/call';
import type { ConnectSettings, Manifest } from '../settings';

export type { TrezorConnectCallable, TrezorConnectPublicCallable };

export interface TrezorConnectCore<InitSettings extends Record<string, any>> {
    init(settings: InitSettings & { manifest: Manifest }): Promise<void>;
    call(params: CallMethodPayload): Promise<any>;
    cancel(params?: string | { reason?: string; callId?: string }): void;
    dispose(): void;
}

export interface TrezorConnectPublicAPI<InitSettings extends Record<string, any>>
    extends TrezorConnectCore<InitSettings>, TrezorConnectPublicCallable {}

export interface TrezorConnectPrivilegedAPI
    extends TrezorConnectCore<ConnectSettings>, TrezorConnectInternal, TrezorConnectCallable {}
