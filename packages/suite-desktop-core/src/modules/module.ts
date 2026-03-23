import type { DeviceEvent, FirmwareStoreEvent, LocalFirmwares } from '@trezor/connect';
import { type InterceptedEvent } from '@trezor/request-manager';
import type { HandshakeClient, TorStatus } from '@trezor/suite-desktop-api';
import { TypedEmitter } from '@trezor/utils';

import { type MainWindowProxy } from '../libs/main-window-proxy';
import type { Store } from '../libs/store';

export type ModuleLoad = (payload: HandshakeClient) => any | Promise<any>;

export type ModuleQuit = () => void | Promise<void>;

// define events internally sent between modules
interface MainThreadMessages {
    'module/request-interceptor': InterceptedEvent;
    'module/reset-tor-circuits': Extract<InterceptedEvent, { type: 'CIRCUIT_MISBEHAVING' }>;
    'module/tor-status-update': TorStatus;
    'module/trezor-connect/device-event': DeviceEvent;
    'module/bridge/toggle': void;
    'module/bridge/status': {
        service: boolean;
        process: boolean;
    };
    'module/trezor-connect/firmware-store': FirmwareStoreEvent;
    'module/firmware/list': LocalFirmwares;
    'app/fully-quit': void;
    'app/show': void;
}

export const mainThreadEmitter = new TypedEmitter<MainThreadMessages>();
export type MainThreadEmitter = typeof mainThreadEmitter;

export type Dependencies = {
    mainWindowProxy: MainWindowProxy;
    store: Store;
    interceptor: RequestInterceptor;
    mainThreadEmitter: MainThreadEmitter;
    cspNonce: string;
};

export type ModuleInterface = {
    onLoad: ModuleLoad;
    onQuit?: ModuleQuit;
} | void;

export type ModuleInit = (dependencies: Dependencies) => ModuleInterface;

export type ModuleInitBackground = (dependencies: Dependencies) => ModuleInterface;
