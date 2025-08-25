import { useMemo } from 'react';

import { Button, Modal } from '@trezor/components';
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

type DontSeeYourTrezorModalProps = {
    isBluetoothMode: boolean;
    onGoBack?: () => void;
    onRescan?: () => void;
};

const commonCableTips = [
    TROUBLESHOOTING_TIP_UDEV,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_USB,
];

export const DontSeeYourTrezorModal = ({
    onGoBack,
    isBluetoothMode,
    onRescan,
}: DontSeeYourTrezorModalProps) => {
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));

    const bridgeDesktopApi = useBridgeDesktopApi();

    const openTrezorSupport = () => {
        window.open(TREZOR_SUPPORT_URL, '_blank');
        onGoBack?.();
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

    const handlePrimaryCta = () => {
        if (isBluetoothMode) {
            onRescan?.();
        }
        onGoBack?.();
    };

    return (
        <Modal
            bottomContent={
                <>
                    <Button onClick={handlePrimaryCta} variant="info">
                        <Translation
                            id={isBluetoothMode ? 'TR_BLUETOOTH_SCAN_AGAIN' : 'TR_GOT_IT'}
                        />
                    </Button>
                    <Button
                        variant="tertiary"
                        onClick={isBluetoothMode ? onGoBack : openTrezorSupport}
                    >
                        <Translation
                            id={isBluetoothMode ? 'TR_CANCEL' : 'TR_CONTACT_TREZOR_SUPPORT'}
                        />
                    </Button>
                </>
            }
            heading={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
            onCancel={onGoBack}
        >
            <TroubleshootingTipsList items={tipItems} />
        </Modal>
    );
};
