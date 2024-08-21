import { Messages, TRANSPORT_ERROR } from '@trezor/transport';

import { ERRORS } from '../constants';
import { DEVICE } from '../events';
import type { Device, DeviceEvents } from './Device';

export type PromptCallback<T> = (response: T | null, error?: Error) => void;

type PromptEvents = typeof DEVICE.PIN | typeof DEVICE.PASSPHRASE | typeof DEVICE.WORD;
// infer all args of Device.emit but one (callback)
type PromptArgs<T extends unknown[]> = T extends readonly [...infer Args, any] ? Args : never;
// infer last arg of Device.emit (callback)
type CallbackArgFn<T extends unknown[]> = T extends readonly [...unknown[], infer Cb] ? Cb : never;
type AnyFn = (...args: any[]) => any;
type DeviceEventArgs<K extends keyof DeviceEvents> = DeviceEvents[K] extends AnyFn
    ? PromptArgs<Parameters<DeviceEvents[K]>>
    : never;
type DeviceEventCallback<K extends keyof DeviceEvents> = DeviceEvents[K] extends AnyFn
    ? CallbackArgFn<Parameters<DeviceEvents[K]>>
    : never;

export const cancelPrompt = (device: Device, expectResponse = true) => {
    if (!device.transportSession) {
        // device disconnected or acquired by someone else
        return Promise.resolve({
            success: false,
            error: TRANSPORT_ERROR.SESSION_NOT_FOUND,
        } as const);
    }

    const cancelArgs = {
        session: device.transportSession,
        name: 'Cancel',
        data: {},
        protocol: device.protocol,
    };

    return expectResponse ? device.transport.call(cancelArgs) : device.transport.send(cancelArgs);
};

const prompt = <E extends PromptEvents>(event: E, ...[device, ...args]: DeviceEventArgs<E>) => {
    // return non nullable first arg of PromptCallback<E>
    return new Promise<NonNullable<Parameters<DeviceEventCallback<E>>[0]>>((resolve, reject) => {
        const cancelAndReject = (error?: Error) =>
            cancelPrompt(device).then(onCancel =>
                reject(
                    error ||
                        new Error(
                            onCancel.success
                                ? (onCancel.payload?.message.message as string)
                                : onCancel.error,
                        ),
                ),
            );

        if (device.listenerCount(event) > 0) {
            device.setCancelableAction(cancelAndReject);

            const callback = (...[response, error]: Parameters<DeviceEventCallback<E>>) => {
                device.clearCancelableAction();
                if (error || response == null) {
                    cancelAndReject(error);
                } else {
                    resolve(response);
                }
            };

            const emitArgs = [event, device, ...args, callback] as unknown as Parameters<
                typeof device.emit<E>
            >;

            device.emit(...emitArgs);
        } else {
            cancelAndReject(ERRORS.TypedError('Runtime', `${event} callback not configured`));
        }
    });
};

export const promptPassphrase = (device: Device) => {
    return prompt(DEVICE.PASSPHRASE, device);
};

export const promptPin = (device: Device, type?: Messages.PinMatrixRequestType) => {
    return prompt(DEVICE.PIN, device, type);
};

export const promptWord = (device: Device, type: Messages.WordRequestType) => {
    return prompt(DEVICE.WORD, device, type);
};
