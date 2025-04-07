import { TranslationKey } from '@suite-common/intl-types';
import { ConnectedDeviceStatus, getStatus } from '@suite-common/suite-utils';
import { acquireDevice, selectDeviceThunk } from '@suite-common/wallet-core';
import { Banner, BannerVariant } from '@trezor/components';

import { goto } from '../../../actions/suite/routerActions';
import { redirectAfterWalletSelectedThunk } from '../../../actions/wallet/addWalletThunk';
import { Translation } from '../../../components/suite';
import { useDevice, useDispatch } from '../../../hooks/suite';
import type { ForegroundAppProps, TrezorDevice } from '../../../types/suite';

const getDeviceResolveStatusCTAMessage = (
    deviceStatus: ReturnType<typeof getStatus>,
): TranslationKey => {
    switch (deviceStatus) {
        case 'bootloader':
            return 'TR_SELECT_DEVICE_SHORT';
        case 'initialize':
            return 'TR_CONTINUE_SETUP';
        default:
            return 'TR_SOLVE_ISSUE';
    }
};

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

        case 'connected':
        case 'disconnected':
        case 'firmware-recommended':
        case 'unknown':
            return null;

        default: {
            const _unhandledCase: never = deviceStatus;
            throw new Error(`Unhandled type: ${_unhandledCase}`);
        }
    }
};

const getDeviceStatusWarningVariant = (
    deviceStatus: ReturnType<typeof getStatus>,
): BannerVariant => {
    switch (deviceStatus) {
        case 'bootloader':
        case 'initialize':
            return 'info';
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
    const deviceStatusBannerVariant = getDeviceStatusWarningVariant(deviceStatus);
    const deviceStatusMessage = getDeviceNeedsAttentionMessage(deviceStatus);
    const isLocked = useDevice().isLocked(true);
    const dispatch = useDispatch();

    const selectDevice = () => {
        dispatch(selectDeviceThunk({ device }));
        dispatch(redirectAfterWalletSelectedThunk());
        onCancel?.(false);
    };

    const onSolveIssueClick = (): void => {
        switch (deviceStatus) {
            case 'initialize': // wiped device
                dispatch(goto('onboarding-index'));
                break;

            case 'bootloader': // device without firmware or in the bootloader mode
            case 'seedless':
            case 'firmware-required':
            case 'unavailable':
            case 'unreadable':
            case 'connected':
            case 'disconnected':
            case 'firmware-recommended':
            case 'unknown':
                selectDevice();
                break;

            case 'used-in-other-window':
            case 'was-used-in-other-window':
            case 'unacquired':
                dispatch(acquireDevice(device));
                break;

            default: {
                const _unhandledCase: never = deviceStatus;
                throw new Error(`Unhandled type: ${_unhandledCase}`);
            }
        }
    };

    return (
        <Banner
            variant={deviceStatusBannerVariant}
            rightContent={
                <Banner.Button
                    onClick={onSolveIssueClick}
                    data-testid="@switch-device/solve-issue-button"
                    isDisabled={isLocked}
                >
                    <Translation id={deviceResolveIssueCTAMessage} />
                </Banner.Button>
            }
        >
            {deviceStatusMessage && <Translation id={deviceStatusMessage} />}
        </Banner>
    );
};
