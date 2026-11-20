import { type EventInstance, type events } from '@suite-common/analytics';
import { type SignVerifyError } from '@trezor/network-module-suite-common-types';
import { exhaustive } from '@trezor/type-utils';

type FailureAttributes = Pick<
    EventInstance<typeof events.coinSignMessageEvent>['payload'],
    'status' | 'error'
>;

export const getFailureAttributes = (error: SignVerifyError): FailureAttributes => {
    switch (error.type) {
        case 'DeviceCancelled':
            return { status: 'cancelled', error: error.type };
        case 'DeviceError':
            return { status: 'error', error: error.code };
        case 'DeviceNotConnectedError':
            return { status: 'error', error: error.type };
        default:
            return exhaustive(error);
    }
};

export const getErrorMessage = (error: SignVerifyError): string => {
    switch (error.type) {
        case 'DeviceError':
        case 'DeviceNotConnectedError':
            return error.message;
        case 'DeviceCancelled':
            return 'Cancelled';
        default:
            return exhaustive(error);
    }
};
