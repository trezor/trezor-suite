import { analytics, EventType, getRandomId } from '@trezor/connect-analytics';
import { storage } from '@trezor/connect-common';
import {
    getBrowserName,
    getBrowserVersion,
    getOsName,
    getOsVersion,
    getScreenWidth,
    getScreenHeight,
    getWindowWidth,
    getWindowHeight,
    getPlatformLanguages,
} from '@trezor/env-utils';

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
    analytics.report(
        { type: EventType.SettingsTracking, payload: { value: false } },
        { force: true },
    );
};

export const initAnalytics = () => {
    let trackingId = storage.load().tracking_id;
    if (!trackingId) {
        trackingId = getRandomId();
        saveTrackingId(trackingId);
    }

    const userAllowedTracking = storage.load().tracking_enabled;

    analytics.init(userAllowedTracking, {
        instanceId: trackingId,
        commitId: process.env.COMMIT_HASH || '',
        isDev: process.env.NODE_ENV === 'development',
        callbacks: {
            onEnable,
            onDisable,
        },
    });

    analytics.report({
        type: EventType.AppInfo,
        payload: {
            browserName: getBrowserName(),
            browserVersion: getBrowserVersion(),
            osName: getOsName(),
            osVersion: getOsVersion(),
            screenWidth: getScreenWidth(),
            screenHeight: getScreenHeight(),
            windowWidth: getWindowWidth(),
            windowHeight: getWindowHeight(),
            platformLanguages: getPlatformLanguages().join(','),
        },
    });
};
