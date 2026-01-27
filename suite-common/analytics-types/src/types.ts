import { EventType } from './constants';

/** @deprecated use `AnalyticsSharedEvents` */
export type SuiteSharedLegacyAnalyticsEvents = {
    type: EventType.DeviceConnectionDeviceConfirmation;
    payload: {
        option: 'confirmed' | 'close';
    };
};
