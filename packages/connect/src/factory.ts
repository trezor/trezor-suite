import { Type } from '@trezor/schema-utils';

import { UI_REQUEST } from './events';
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
import type { ConnectEmitter } from './types/emitter';

export interface ConnectFactoryDependencies<SettingsType extends Record<string, any>> {
    init: InitType<SettingsType>;
    call: CallMethod;
    eventEmitter: ConnectEmitter;
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
                        ? eventEmitter.listenerCount(UI_REQUEST.ADDRESS_VALIDATION) > 0
                        : undefined,
                }),
        ]),
    ) as Pick<TrezorConnect, (typeof connectCallableMethods)[number]>;

    return {
        init,
        updateConnectSettings,

        on: eventEmitter.on.bind(eventEmitter),

        off: eventEmitter.removeListener.bind(eventEmitter),

        removeAllListeners: eventEmitter.removeAllListeners.bind(eventEmitter),

        uiResponse,

        call,

        dispose,

        cancel,

        ...callableMethods,

        ...extraMethods,
    };
};
