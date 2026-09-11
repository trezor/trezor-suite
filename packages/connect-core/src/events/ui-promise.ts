import type { DEVICE, UiResponseEvent } from '@trezor/connect-common';
import type { Deferred } from '@trezor/utils';

import type { IDevice } from '../types/idevice';

export type UiPromiseResponse =
    | (UiResponseEvent & { requestId?: string })
    | { type: typeof DEVICE.DISCONNECT; payload?: undefined; requestId?: string };

export type UiPromise<T extends UiPromiseResponse['type']> = Deferred<
    Extract<UiPromiseResponse, { type: T }>,
    T
> & {
    device?: IDevice;
    requestId: string;
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
