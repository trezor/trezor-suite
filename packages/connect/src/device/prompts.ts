import { Messages, TRANSPORT_ERROR } from '@trezor/transport';
import type { ReadWriteError } from '@trezor/transport/src/transports/abstract';

import { DEVICE } from '../events';
import type { Device, DeviceEvents } from './Device';

type PromptEvents = typeof DEVICE.PIN | typeof DEVICE.PASSPHRASE | typeof DEVICE.WORD;
type DeviceEventArgs<K extends PromptEvents> = Omit<DeviceEvents[K], 'callback'>;
type DeviceEventCallback<K extends PromptEvents> = DeviceEvents[K]['callback'];
type PromptReturnType<E extends PromptEvents> =
    | { success: true; payload: NonNullable<Parameters<DeviceEventCallback<E>>[0]> }
    | { success: false; isTransportError: false; error: string; message: string }
    | { success: false; isTransportError: true; error: ReadWriteError };

export type PromptCallback<T> = (response: T | null, error?: string) => void;

export const cancelPrompt = (device: Device, expectResponse = true) => {
    const session = device.getLocalSession();

    if (!session) {
        // device disconnected or acquired by someone else
        return Promise.resolve({
            success: false as const,
            error: TRANSPORT_ERROR.SESSION_NOT_FOUND,
        });
    }

    const cancelArgs = {
        session,
        name: 'Cancel',
        data: {},
        protocol: device.protocol,
    };

    return expectResponse ? device.transport.call(cancelArgs) : device.transport.send(cancelArgs);
};

const extractMessage = (payload?: Messages.MessageResponse) =>
    (payload && 'message' in payload.message && payload.message.message) || '';

const prompt = <E extends PromptEvents>(event: E, { device, ...rest }: DeviceEventArgs<E>) =>
    // return non nullable first arg of PromptCallback<E>
    new Promise<PromptReturnType<E>>(resolve => {
        const cancelAndReject = (error?: string) =>
            cancelPrompt(device).then(response =>
                response.success
                    ? resolve({
                          success: false,
                          error: error || extractMessage(response.payload),
                          message: extractMessage(response.payload),
                          isTransportError: !response.success,
                      })
                    : resolve({
                          success: false,
                          error: response.error,
                          isTransportError: true,
                      }),
            );

        if (device.listenerCount(event) > 0) {
            device.setCancelableAction(cancelAndReject);

            const callback = (...[response, error]: Parameters<DeviceEventCallback<E>>) => {
                device.clearCancelableAction();
                if (error || response == null) {
                    cancelAndReject(error);
                } else {
                    resolve({ success: true, payload: response });
                }
            };

            // @ts-expect-error
            device.emit(event, { device, callback, ...rest });
        } else {
            // this may happen in case communication is out of sync. consider:
            // reload app, send GetFeatures, read PassphraseRequest (from previous session)
            cancelAndReject(`${event} callback not configured`);
        }
    });

export const promptPassphrase = (device: Device) => prompt(DEVICE.PASSPHRASE, { device });

export const promptPin = (device: Device, type?: Messages.PinMatrixRequestType) =>
    prompt(DEVICE.PIN, { device, type });

export const promptWord = (device: Device, type: Messages.WordRequestType) =>
    prompt(DEVICE.WORD, { device, type });
