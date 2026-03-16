import type { DEVICE } from '@trezor/connect-common/src/events/device';
import type { UiResponseEvent } from '@trezor/connect-common/src/events/ui-response';
import type { Deferred } from '@trezor/utils';

import type { IDevice } from '../types/idevice';

export type UiPromiseResponse =
    | UiResponseEvent
    | { type: typeof DEVICE.DISCONNECT; payload?: undefined };

export type UiPromise<T extends UiPromiseResponse['type']> = Deferred<
    Extract<UiPromiseResponse, { type: T }>,
    T
> & {
    device?: IDevice;
};

// map all possible UiPromises
type UiPromiseMap = {
    [T in UiPromiseResponse['type']]: UiPromise<T>;
};

// create strict type of any possible UiPromise
export type AnyUiPromise = UiPromiseMap[UiPromiseResponse['type']];

export type UiPromiseCreator = <T extends UiPromiseResponse['type']>(
    type: T,
    device?: IDevice,
) => UiPromise<T>;
