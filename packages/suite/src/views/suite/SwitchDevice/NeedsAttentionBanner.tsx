import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { goto } from '@suite/router';
import {
    type DeviceStatus as ConnectedDeviceStatus,
    type getStatus,
} from '@suite-common/suite-utils';
import { acquireDevice, selectDeviceThunk } from '@suite-common/wallet-core';
import { Banner, type BannerIntent } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { redirectAfterWalletSelectedThunk } from 'src/actions/wallet/addWalletThunk';
import { useDispatch } from 'src/hooks/suite';
import type { ForegroundAppProps, TrezorDevice } from 'src/types/suite';

import { getDeviceResolveStatusCTAMessage } from './getDeviceResolveStatusCTAMessage';

const getDeviceNeedsAttentionMessage = (
    deviceStatus: ReturnType<typeof getStatus>,
): TranslationKey | null => {
    switch (deviceStatus) {
        case 'bootloader': // device without firmware or in the bootloader mode
            return 'TR_NEEDS_ATTENTION_NEW_DEVICE';
        case 'initialize': // wiped device
            return 'TR_NEEDS_ATTENTION_INITIALIZE';
        case 'seedless':
            return 'TR_NEEDS_ATTENTION_SEEDLESS';
        case 'used-in-other-window':
            return 'TR_NEEDS_ATTENTION_USED_IN_OTHER_WINDOW';
        case 'was-used-in-other-window':
            return 'TR_NEEDS_ATTENTION_WAS_USED_IN_OTHER_WINDOW';
        case 'unacquired':
            return 'TR_NEEDS_ATTENTION_UNACQUIRED';
        case 'firmware-required':
            return 'TR_NEEDS_ATTENTION_FIRMWARE_REQUIRED';
        case 'firmware-corrupted':
            return 'TR_NEEDS_ATTENTION_FIRMWARE_CORRUPTED';
        case 'unavailable':
            return 'TR_NEEDS_ATTENTION_UNAVAILABLE';
        case 'unreadable':
            return 'TR_NEEDS_ATTENTION_UNREADABLE';
        case 'device-thp-locked':
            return 'TR_NEEDS_ATTENTION_UNACQUIRED_THP_REQUIRED';
        case 'device-busy':
            return 'TR_NEEDS_ATTENTION_DEVICE_BUSY';
        case 'device-bootloader-locked':
            return 'TR_NEEDS_ATTENTION_DEVICE_LOCKED';
        case 'device-hard-locked':
            return 'TR_NEEDS_ATTENTION_DEVICE_LOCKED';
        case 'device-pin-locked':
            return 'TR_NEEDS_ATTENTION_DEVICE_LOCKED';
        case 'device-rebooting':
            return 'TR_RESTARTING_TREZOR';

        case 'connected':
        case 'disconnected':
        case 'firmware-recommended':
        case 'unknown':
        case 'acquired':
            return null;

        default:
            return exhaustive(deviceStatus);
    }
};

const getDeviceStatusWarningIntent = (deviceStatus: ReturnType<typeof getStatus>): BannerIntent => {
    switch (deviceStatus) {
        case 'bootloader':
        case 'initialize':
        case 'was-used-in-other-window':
        case 'used-in-other-window':
        case 'unacquired':
        case 'device-thp-locked':
            return 'info';
        case 'firmware-required':
        case 'firmware-corrupted':
            return 'critical';
        default:
            return 'warning';
    }
};

export type NeedsAttentionBannerProps = {
    device: TrezorDevice;
    deviceStatus: ConnectedDeviceStatus;
    onCancel?: ForegroundAppProps['onCancel'];
};

export const NeedsAttentionBanner = ({
    device,
    deviceStatus,
    onCancel,
}: NeedsAttentionBannerProps) => {
    const deviceResolveIssueCTAMessage = getDeviceResolveStatusCTAMessage(deviceStatus);
    const deviceStatusBannerIntent = getDeviceStatusWarningIntent(deviceStatus);
    const deviceStatusMessage = getDeviceNeedsAttentionMessage(deviceStatus);
    const isLocked = useDevice().isLocked(true);
    const dispatch = useDispatch();

    const selectDevice = () => {
        dispatch(selectDeviceThunk({ device }));
        dispatch(redirectAfterWalletSelectedThunk());
        onCancel?.(false);
    };

    const createOnIssueClickHandler = (): (() => void) | null => {
        switch (deviceStatus) {
            case 'firmware-required':
                return () => {
                    onCancel?.(false);
                    dispatch(selectDeviceThunk({ device }));
                    dispatch(goto({ routeName: 'firmware-index' }));
                };
            // If onboarding is pending, then it should pass through Manual Device Check.
            case 'initialize': // Wiped device with firmware present.
            case 'bootloader': // Fresh or factory-reset device? Can also be initalized device manually put into BL,
                // but we cannot tell (device.features.initialized is null)
                return () => {
                    selectDevice();
                    dispatch(goto({ routeName: 'suite-start' }));
                };

            case 'seedless':
            case 'firmware-corrupted':
            case 'unavailable':
            case 'unreadable':
            case 'connected':
            case 'disconnected':
            case 'firmware-recommended':
            case 'unknown':
                return () => selectDevice();

            case 'used-in-other-window':
            case 'was-used-in-other-window':
            case 'unacquired':
                return () => dispatch(acquireDevice({ requestedDevice: device }));
            case 'device-thp-locked':
                return () => {
                    onCancel?.(false);
                    dispatch(acquireDevice({ requestedDevice: device }));
                };

            case 'device-busy':
            case 'device-rebooting':
            case 'device-bootloader-locked':
            case 'device-hard-locked':
            case 'device-pin-locked':
            case 'acquired':
                return null;

            default:
                return exhaustive(deviceStatus);
        }
    };

    const onIssueClick = createOnIssueClickHandler();

    return (
        <Banner
            intent={deviceStatusBannerIntent}
            rightContent={
                onIssueClick && (
                    <Banner.Button
                        onClick={onIssueClick}
                        data-testid="@switch-device/solve-issue-button"
                        isDisabled={isLocked}
                    >
                        <Translation id={deviceResolveIssueCTAMessage} />
                    </Banner.Button>
                )
            }
            description={deviceStatusMessage ? <Translation id={deviceStatusMessage} /> : undefined}
        />
    );
};
