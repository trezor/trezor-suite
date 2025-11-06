import { useMemo, useRef } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { Card, Modal } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { isDesktop } from '@trezor/env-utils';
import { DeviceAnimation } from '@trezor/product-components';
import { TREZOR_SUPPORT_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite/Translation';
import { TroubleshootingTipsItem } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import { TroubleshootingTipsList } from 'src/components/suite/troubleshooting/TroubleshootingTipsList';
import {
    TROUBLESHOOTING_ALL_BLUETOOTH_TIPS,
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_SUITE_DESKTOP_TOGGLE_BRIDGE,
    TROUBLESHOOTING_TIP_UDEV,
    TROUBLESHOOTING_TIP_USB,
} from 'src/components/suite/troubleshooting/tips';
import { useSelector } from 'src/hooks/suite';
import { useBridgeDesktopApi } from 'src/hooks/suite/useBridgeDesktopApi';
import {
    selectHasTransportOfType,
    selectTransportOfType,
} from 'src/selectors/suite/suiteSelectors';

import { useConnectionGlobalModalContext } from './context/ConnectionGlobalModalContext';

type DontSeeYourTrezorModalProps = {
    onClose: () => void;
};

const commonCableTips = [
    TROUBLESHOOTING_TIP_UDEV,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_USB,
];

export const CantSeeTrezorModal = ({ onClose }: DontSeeYourTrezorModalProps) => {
    const {
        isBluetoothMode,
        toggleShouldPairAgain,
        toggleShowHints,
        onReScanClick,
        notConnectedKnownDevices,
        notConnectedNearbyDevices,
    } = useConnectionGlobalModalContext();
    const videoRef = useRef<HTMLVideoElement>(null);

    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const bridge = useSelector(selectTransportOfType('BridgeTransport'));

    const bridgeDesktopApi = useBridgeDesktopApi();

    const allowPairAgain =
        notConnectedNearbyDevices?.length === 0 && notConnectedKnownDevices.length > 0;

    const openTrezorSupport = () => {
        window.open(TREZOR_SUPPORT_URL, '_blank');
        toggleShowHints();
    };

    const cableItem: TroubleshootingTipsItem[] = useMemo(() => {
        const items = isWebUsbTransport
            ? [...commonCableTips, TROUBLESHOOTING_TIP_SUITE_DESKTOP]
            : [
                  TROUBLESHOOTING_TIP_BRIDGE_STATUS,
                  ...commonCableTips,
                  TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
              ];

        if (bridgeDesktopApi?.bridgeProcess?.process && bridge) {
            items.push(TROUBLESHOOTING_TIP_SUITE_DESKTOP_TOGGLE_BRIDGE);
        } else {
            // TODO: here we are going to put instruction to uninstall standalone bridge
        }

        return items;
    }, [isWebUsbTransport, bridgeDesktopApi, bridge]);

    const tipItems = useMemo(() => {
        if (isBluetoothMode && isDesktop()) {
            return TROUBLESHOOTING_ALL_BLUETOOTH_TIPS;
        }

        return cableItem;
    }, [isBluetoothMode, cableItem]);

    const tertiaryButtonTranslation: TranslationKey = useMemo(() => {
        if (isBluetoothMode) {
            return allowPairAgain ? 'TR_STILL_NOT_WORKING' : 'TR_CANCEL';
        }

        return 'TR_CONTACT_TREZOR_SUPPORT';
    }, [isBluetoothMode, allowPairAgain]);

    const handlePrimaryCta = () => {
        if (isBluetoothMode) {
            onReScanClick();
        }
        toggleShowHints();
    };

    const handleTertiaryCta = () => {
        if (isBluetoothMode) {
            if (allowPairAgain) toggleShouldPairAgain();
            toggleShowHints();
        } else {
            openTrezorSupport();
            onClose();
        }
    };

    if (isBluetoothMode) {
        return (
            <Modal
                heading={<Translation id="TR_TREZOR_NEEDS_TO_BE_IN_PAIRING_MODE" />}
                description={<Translation id="TR_WINDOW_WILL_CLOSE_WHEN_TREZOR_IS_PAIRED" />}
                onCancel={onClose}
                size="tiny"
                bottomContent={
                    allowPairAgain ? (
                        <Modal.Button
                            intent="neutral"
                            priority="secondary"
                            onClick={handleTertiaryCta}
                        >
                            <Translation id={tertiaryButtonTranslation} />
                        </Modal.Button>
                    ) : undefined
                }
            >
                <DeviceAnimation
                    ref={videoRef}
                    type="PAIRING_MODE"
                    deviceModelInternal={DeviceModelInternal.T3W1}
                    width={368}
                    height={368}
                    shape="ROUNDED"
                    loop
                />
            </Modal>
        );
    }

    return (
        <Modal
            bottomContent={
                <Modal.Button intent="neutral" priority="secondary" onClick={handleTertiaryCta}>
                    <Translation id={tertiaryButtonTranslation} />
                </Modal.Button>
            }
            heading={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
            onCancel={handlePrimaryCta}
            variant="info"
        >
            <Card paddingType="large">
                <TroubleshootingTipsList items={tipItems} />
            </Card>
        </Modal>
    );
};
