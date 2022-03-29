import type { DEVICE } from './device';
import type { Device } from '../device/Device';
import type { UiResponseEvent } from './ui-response';
import type { Deferred } from '../utils/deferred';

export type UiPromiseResponse =
    | UiResponseEvent
    | { type: typeof DEVICE.DISCONNECT; payload?: undefined };

export type UiPromise<T extends UiPromiseResponse['type']> = Deferred<
    Extract<UiPromiseResponse, { type: T }>,
    T,
    Device
>;
