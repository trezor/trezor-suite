import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { TrezorDevice } from '@suite-common/suite-types';
import { selectDeviceUpdateFirmwareVersion } from '@suite-common/wallet-core';
import { EventType, FirmwareUpdatePayload, FirmwareUpdateStartType } from '@suite-native/analytics';
import { useLegacyAnalytics } from '@suite-native/services';
import { FirmwareType } from '@trezor/connect';
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
    const legacyAnalytics = useLegacyAnalytics();
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

            legacyAnalytics.report({
                type: EventType.FirmwareUpdateStarted,
                payload: {
                    ...getAnalyticsPayload(),
                    startType,
                },
            });
        },
        [getAnalyticsPayload, legacyAnalytics, resetTimeStarted],
    );

    const handleAnalyticsReportStucked = useCallback(
        (state: 'modalPart1' | 'modalPart2' | 'buttonVisible') => {
            legacyAnalytics.report({
                type: EventType.FirmwareUpdateStucked,
                payload: {
                    ...getAnalyticsPayload(),
                    duration: getElapsedTimeInSeconds(),
                    stuckedType: state,
                },
            });
        },
        [legacyAnalytics, getAnalyticsPayload, getElapsedTimeInSeconds],
    );

    const handleAnalyticsReportFinished = useCallback(
        ({ error }: { error?: string } = {}) => {
            legacyAnalytics.report({
                type: EventType.FirmwareUpdateFinished,
                payload: {
                    ...getAnalyticsPayload(),
                    duration: getElapsedTimeInSeconds(),
                    error,
                },
            });
        },
        [legacyAnalytics, getAnalyticsPayload, getElapsedTimeInSeconds],
    );

    const handleAnalyticsReportCancelled = useCallback(() => {
        legacyAnalytics.report({
            type: EventType.FirmwareUpdateCancel,
            payload: getAnalyticsPayload(),
        });
    }, [getAnalyticsPayload, legacyAnalytics]);

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
