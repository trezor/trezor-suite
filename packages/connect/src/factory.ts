import type { EventEmitter } from 'events';

import { Type } from '@trezor/schema-utils';

import { UI } from './events';
import type { CallMethod, CallMethodKeys } from './events/call';
import {
    type TrezorConnect,
    TrezorConnectAccount,
    TrezorConnectBitcoin,
    TrezorConnectBlockchain,
    TrezorConnectCardano,
    TrezorConnectDevice,
    TrezorConnectEthereum,
    TrezorConnectEvolu,
    TrezorConnectMonero,
    TrezorConnectRipple,
    TrezorConnectSolana,
    TrezorConnectStellar,
    TrezorConnectTezos,
    TrezorConnectTron,
} from './types';
import type { InitType } from './types/api/init';

export interface ConnectFactoryDependencies<SettingsType extends Record<string, any>> {
    init: InitType<SettingsType>;
    call: CallMethod;
    eventEmitter: EventEmitter;
    updateConnectSettings: TrezorConnect['updateConnectSettings'];
    uiResponse: TrezorConnect['uiResponse'];
    cancel: TrezorConnect['cancel'];
    dispose: TrezorConnect['dispose'];
}

const connectCallables = Type.Composite([
    // Not including `TrezorConnectManagement` as callable methods.
    TrezorConnectDevice,
    TrezorConnectBlockchain,
    TrezorConnectAccount,
    TrezorConnectBitcoin,
    TrezorConnectEthereum,
    TrezorConnectCardano,
    TrezorConnectMonero,
    TrezorConnectRipple,
    TrezorConnectSolana,
    TrezorConnectStellar,
    TrezorConnectTezos,
    TrezorConnectTron,
    TrezorConnectEvolu,
]);

export const connectCallableMethods = Object.keys(connectCallables.properties) as CallMethodKeys[];

export const factory = <
    SettingsType extends Record<string, any>,
    ExtraMethodsType extends Record<string, any>,
>(
    {
        eventEmitter,
        init,
        call,
        updateConnectSettings,
        uiResponse,
        cancel,
        dispose,
    }: ConnectFactoryDependencies<SettingsType>,
    extraMethods: ExtraMethodsType = {} as ExtraMethodsType,
): Omit<TrezorConnect, 'init'> & {
    init: InitType<SettingsType>;
    call: CallMethod;
} & ExtraMethodsType => {
    const callableMethods = Object.fromEntries(
        connectCallableMethods.map(method => [
            method,
            (params: any) =>
                call({
                    ...params,
                    method,
                    useEventListener: method.toLowerCase().endsWith('getaddress')
                        ? eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0
                        : undefined,
                }),
        ]),
    ) as Pick<TrezorConnect, (typeof connectCallableMethods)[number]>;

    return {
        init,
        updateConnectSettings,

        on: <T extends string, P extends (...args: any[]) => any>(type: T, fn: P) => {
            eventEmitter.on(type, fn);
        },

        off: (type, fn) => {
            eventEmitter.removeListener(type, fn);
        },

        removeAllListeners: type => {
            if (typeof type === 'string') {
                eventEmitter.removeAllListeners(type);
            } else {
                eventEmitter.removeAllListeners();
            }
        },

        uiResponse,

        call,

        dispose,

        cancel,

        ...callableMethods,

        ...extraMethods,
    };
};
