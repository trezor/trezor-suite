import { useMemo } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { Modal } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
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
import { selectHasTransportOfType } from 'src/selectors/suite/suiteSelectors';

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
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));

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

        if (bridgeDesktopApi?.bridgeProcess?.process) {
            items.push(TROUBLESHOOTING_TIP_SUITE_DESKTOP_TOGGLE_BRIDGE);
        } else {
            // TODO: here we are going to put instruction to uninstall standalone bridge
        }

        return items;
    }, [isWebUsbTransport, bridgeDesktopApi]);

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

    return (
        <Modal
            bottomContent={
                <>
                    <Modal.Button onClick={handlePrimaryCta} variant="info">
                        <Translation
                            id={isBluetoothMode ? 'TR_BLUETOOTH_SCAN_AGAIN' : 'TR_GOT_IT'}
                        />
                    </Modal.Button>
                    <Modal.Button variant="tertiary" onClick={handleTertiaryCta}>
                        <Translation id={tertiaryButtonTranslation} />
                    </Modal.Button>
                </>
            }
            heading={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
            onCancel={onClose}
        >
            <TroubleshootingTipsList items={tipItems} />
        </Modal>
    );
};
