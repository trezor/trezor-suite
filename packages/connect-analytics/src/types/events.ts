import { EventType } from '../constants';

export type ConnectAnalyticsEvent = {
    type: EventType.SettingsTracking;
    payload: {
        value: boolean;
    };
};
