import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceUpdateFirmwareVersion } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import {
    type FirmwareUpdatePayload,
    type FirmwareUpdateStartType,
    events,
} from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { type FirmwareType } from '@trezor/connect';
import {
    DeviceModelInternal,
    getBootloaderVersion,
    getFirmwareVersion,
} from '@trezor/device-utils';

export const useFirmwareAnalytics = ({
    device,
    targetFirmwareType,
    navigationLocation,
}: {
    device?: TrezorDevice;
    targetFirmwareType: FirmwareType;
    navigationLocation?: 'settings' | 'onboarding';
}) => {
    const toFwVersion = useSelector(selectDeviceUpdateFirmwareVersion);
    const analytics = useAnalytics();
    const prepareAnalyticsPayload = useCallback(
        () => ({
            model: device?.features?.internal_model ?? DeviceModelInternal.UNKNOWN,
            fromBootloaderVersion: getBootloaderVersion(device),
            fromFwVersion: device?.firmware === 'none' ? 'none' : getFirmwareVersion(device),
            toFwVersion: toFwVersion ?? '?.?.?',
            fromFwType: (device?.firmwareType || 'none') as FirmwareType | 'none',
            toFwType: targetFirmwareType,
            location: navigationLocation ?? null,
        }),
        [device, targetFirmwareType, toFwVersion, navigationLocation],
    );

    // Use refs to avoid any re-renders because of analytics and to make useCallback dependencies stable
    // so it won't trigger any useEffect which could interfere with other business logic.
    const analyticsPayload = useRef<FirmwareUpdatePayload>(prepareAnalyticsPayload());
    // eslint-disable-next-line react-hooks/purity
    const timeStarted = useRef<number>(Date.now());

    useEffect(() => {
        analyticsPayload.current = prepareAnalyticsPayload();
    }, [prepareAnalyticsPayload]);

    const getElapsedTimeInSeconds = useCallback(
        () => Math.floor((Date.now() - timeStarted.current) / 1000),
        [],
    );

    const getAnalyticsPayload = useCallback(() => analyticsPayload.current, [analyticsPayload]);

    const resetTimeStarted = useCallback(() => {
        timeStarted.current = Date.now();
    }, []);

    const handleAnalyticsReportStarted = useCallback(
        ({ startType }: { startType: FirmwareUpdateStartType }) => {
            resetTimeStarted();

            analytics.report({
                type: events.firmwareFirmwareUpdateStartedEvent.name,
                payload: {
                    ...getAnalyticsPayload(),
                    startType,
                },
            });
        },
        [getAnalyticsPayload, analytics, resetTimeStarted],
    );

    const handleAnalyticsReportStucked = useCallback(
        (state: 'modalPart1' | 'modalPart2' | 'buttonVisible') => {
            analytics.report({
                type: events.firmwareFirmwareUpdateStuckedEvent.name,
                payload: {
                    ...getAnalyticsPayload(),
                    duration: getElapsedTimeInSeconds(),
                    stuckedType: state,
                },
            });
        },
        [analytics, getAnalyticsPayload, getElapsedTimeInSeconds],
    );

    const handleAnalyticsReportFinished = useCallback(
        ({ error }: { error?: string } = {}) => {
            analytics.report({
                type: events.firmwareFirmwareUpdateFinishedEvent.name,
                payload: {
                    ...getAnalyticsPayload(),
                    duration: getElapsedTimeInSeconds(),
                    error,
                },
            });
        },
        [analytics, getAnalyticsPayload, getElapsedTimeInSeconds],
    );

    const handleAnalyticsReportCancelled = useCallback(() => {
        analytics.report({
            type: events.firmwareFirmwareUpdateCancelEvent.name,
            payload: getAnalyticsPayload(),
        });
    }, [getAnalyticsPayload, analytics]);

    return {
        getElapsedTimeInSeconds,
        getAnalyticsPayload,
        resetTimeStarted,
        handleAnalyticsReportStucked,
        handleAnalyticsReportFinished,
        handleAnalyticsReportCancelled,
        handleAnalyticsReportStarted,
    };
};
