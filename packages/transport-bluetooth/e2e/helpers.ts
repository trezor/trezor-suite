import { TrezorBluetooth } from '../src/client/trezor-bluetooth';
import type { NotificationEvent } from '../src/client/types';

export const SERVER_URL = process.env.TREZOR_BLUETOOTH_URL ?? 'ws://127.0.0.1:21327';
export const AUTH_TOKEN = process.env.TREZOR_BLUETOOTH_AUTH_TOKEN ?? 'e2e-token';

export const createClient = () =>
    new TrezorBluetooth({
        url: SERVER_URL,
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForEvent = <E extends keyof NotificationEvent>(
    client: TrezorBluetooth,
    event: E,
    predicate: (payload: NotificationEvent[E]) => boolean = () => true,
    timeout = 15_000,
) =>
    new Promise<NotificationEvent[E]>((resolve, reject) => {
        const pending: { timer?: ReturnType<typeof setTimeout> } = {};
        const listener = (payload: NotificationEvent[E]) => {
            if (!predicate(payload)) return;
            clearTimeout(pending.timer);
            client.off(event, listener);
            resolve(payload);
        };
        pending.timer = setTimeout(() => {
            client.off(event, listener);
            reject(new Error(`Timeout waiting for "${event}"`));
        }, timeout);
        client.on(event, listener as any);
    });
