import { TranslationKey } from '@suite-common/intl-types';
import { ConnectedDeviceStatus, getStatus } from '@suite-common/suite-utils';
import { acquireDevice, selectDeviceThunk } from '@suite-common/wallet-core';
import { Banner, BannerVariant, Icon, IconName, Row } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { Translation } from 'src/components/suite/Translation';

import { getDeviceResolveStatusCTAMessage } from './getDeviceResolveStatusCTAMessage';
import { goto } from '../../../actions/suite/routerActions';
import { redirectAfterWalletSelectedThunk } from '../../../actions/wallet/addWalletThunk';
import { useDevice, useDispatch } from '../../../hooks/suite';
import type { ForegroundAppProps, TrezorDevice } from '../../../types/suite';

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
        case 'unavailable':
            return 'TR_NEEDS_ATTENTION_UNAVAILABLE';
        case 'unreadable':
            return 'TR_NEEDS_ATTENTION_UNREADABLE';
        case 'device-thp-locked':
            return 'TR_NEEDS_ATTENTION_UNACQUIRED_THP_REQUIRED';
        case 'device-busy':
            return 'TR_NEEDS_ATTENTION_DEVICE_BUSY';
        case 'device-bootloader-locked':
            return 'TR_NEEDS_ATTENTION_DEVICE_BUSY'; // TODO
        case 'device-hard-locked':
            return 'TR_NEEDS_ATTENTION_DEVICE_BUSY'; // TODO
        case 'device-pin-locked':
            return 'TR_NEEDS_ATTENTION_DEVICE_BUSY'; // TODO
        case 'device-rebooting':
            return 'TR_NEEDS_ATTENTION_DEVICE_BUSY'; // TODO

        case 'connected':
        case 'disconnected':
        case 'firmware-recommended':
        case 'unknown':
            return null;

        default:
            return exhaustive(deviceStatus);
    }
};

const getDeviceStatusWarningVariant = (
    deviceStatus: ReturnType<typeof getStatus>,
): BannerVariant => {
    switch (deviceStatus) {
        case 'bootloader':
        case 'initialize':
        case 'was-used-in-other-window':
        case 'used-in-other-window':
        case 'unacquired':
        case 'device-thp-locked':
            return 'info';
        case 'firmware-required':
            return 'destructive';
        default:
            return 'warning';
    }
};

const getDeviceStatusBannerIcon = (
    deviceStatusVariant: ReturnType<typeof getDeviceStatusWarningVariant>,
): IconName => {
    switch (deviceStatusVariant) {
        case 'warning':
            return 'warning';
        case 'destructive':
            return 'warningCircle';
        default:
            return 'info';
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
    const deviceStatusBannerVariant = getDeviceStatusWarningVariant(deviceStatus);
    const deviceStatusBannerIcon = getDeviceStatusBannerIcon(deviceStatusBannerVariant);
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
            // If onboarding is pending, then it should pass through Manual Device Check.
            case 'initialize': // Wiped device with firmware present.
            case 'bootloader': // Fresh or factory-reset device? Can also be initalized device manually put into BL,
                // but we cannot tell (device.features.initialized is null)
                return () => {
                    selectDevice();
                    dispatch(goto('suite-start'));
                };

            case 'seedless':
            case 'firmware-required':
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
                return null;

            default:
                return exhaustive(deviceStatus);
        }
    };

    const onIssueClick = createOnIssueClickHandler();

    return (
        <Banner
            variant={deviceStatusBannerVariant}
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
        >
            {deviceStatusMessage && (
                <Row gap={8}>
                    <Icon size="medium" name={deviceStatusBannerIcon} />
                    <Translation id={deviceStatusMessage} />
                </Row>
            )}
        </Banner>
    );
};
