import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { DeviceModelInternal, FirmwareType } from '@trezor/connect';
import {
    analytics,
    EventType,
    FirmwareUpdatePayload,
    FirmwareUpdateStartType,
} from '@suite-native/analytics';
import { TrezorDevice } from '@suite-common/suite-types';
import { getFirmwareVersion, getBootloaderVersion } from '@trezor/device-utils';
import { selectDeviceUpdateFirmwareVersion } from '@suite-common/wallet-core';

export const useFirmwareAnalytics = ({
    device,
    targetFirmwareType,
}: {
    device?: TrezorDevice;
    targetFirmwareType: FirmwareType;
}) => {
    const toFwVersion = useSelector(selectDeviceUpdateFirmwareVersion);

    const prepareAnalyticsPayload = useCallback(
        () => ({
            model: device?.features?.internal_model ?? DeviceModelInternal.UNKNOWN,
            fromBootloaderVersion: getBootloaderVersion(device),
            fromFwVersion: device?.firmware === 'none' ? 'none' : getFirmwareVersion(device),
            toFwVersion: toFwVersion ?? '?.?.?',
            fromFwType: (device?.firmwareType || 'none') as FirmwareType | 'none',
            toFwType: targetFirmwareType,
        }),
        [device, targetFirmwareType, toFwVersion],
    );

    // Use refs to avoid any re-renders because of analytics and to make useCallback dependencies stable
    // so it won't trigger any useEffect which could interfere with other business logic.
    const analyticsPayload = useRef<FirmwareUpdatePayload>(prepareAnalyticsPayload());
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
                type: EventType.FirmwareUpdateStarted,
                payload: {
                    ...getAnalyticsPayload(),
                    startType,
                },
            });
        },
        [getAnalyticsPayload, resetTimeStarted],
    );

    const handleAnalyticsReportStucked = useCallback(
        (state: 'modalPart1' | 'modalPart2' | 'buttonVisible') => {
            analytics.report({
                type: EventType.FirmwareUpdateStucked,
                payload: {
                    ...getAnalyticsPayload(),
                    duration: getElapsedTimeInSeconds(),
                    stuckedType: state,
                },
            });
        },
        [getElapsedTimeInSeconds, getAnalyticsPayload],
    );

    const handleAnalyticsReportFinished = useCallback(
        ({ error }: { error?: string } = {}) => {
            analytics.report({
                type: EventType.FirmwareUpdateFinished,
                payload: {
                    ...getAnalyticsPayload(),
                    duration: getElapsedTimeInSeconds(),
                    error,
                },
            });
        },
        [getElapsedTimeInSeconds, getAnalyticsPayload],
    );

    const handleAnalyticsReportCancelled = useCallback(() => {
        analytics.report({
            type: EventType.FirmwareUpdateCancel,
            payload: getAnalyticsPayload(),
        });
    }, [getAnalyticsPayload]);

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
