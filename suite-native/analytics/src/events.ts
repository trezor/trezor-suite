import { EventType } from './constants';

export type AppAnalyticsEvent = {
    type: EventType.SettingsAnalytics;
    payload: {
        value: boolean;
    };
};
