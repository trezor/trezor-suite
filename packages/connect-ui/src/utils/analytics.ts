import { analytics, EventType, getRandomId } from '@trezor/connect-analytics';
import { storage } from '@trezor/connect-common';

const saveTrackingEnablement = (enablement: boolean) => {
    storage.save(state => ({
        ...state,
        tracking_enabled: enablement,
    }));
};

const saveTrackingId = (trackingId: string) => {
    storage.save(state => ({
        ...state,
        tracking_id: trackingId,
    }));
};

const onEnable = () => {
    saveTrackingEnablement(true);
    analytics.report({ type: EventType.SettingsTracking, payload: { value: true } });
};

const onDisable = () => {
    saveTrackingEnablement(false);
    analytics.report({ type: EventType.SettingsTracking, payload: { value: false } }, true);
};

export const initAnalytics = () => {
    let trackingId = storage.load().tracking_id;
    if (!trackingId) {
        trackingId = getRandomId();
        saveTrackingId(trackingId);
    }

    const userAllowedTracking = storage.load().tracking_enabled;

    analytics.init(userAllowedTracking || false, {
        instanceId: trackingId,
        commitId: process.env.COMMIT_HASH || '',
        isDev: process.env.NODE_ENV === 'development',
        callbacks: {
            onEnable,
            onDisable,
        },
        useQueue: true,
    });
};
