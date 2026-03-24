import { useEffect, useMemo } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Column, H3, Modal, Paragraph } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { DeviceAnimation } from '@trezor/product-components';
import { TREZOR_SUPPORT_DEVICE_URL } from '@trezor/urls';

import { type TroubleshootingTipsItem } from 'src/components/suite/troubleshooting/TroubleshootingTipsItem';
import { TroubleshootingTipsList } from 'src/components/suite/troubleshooting/TroubleshootingTipsList';
import {
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_DEVICE_TURNED_ON_UNLOCKED,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_UDEV,
} from 'src/components/suite/troubleshooting/tips';
import { useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType } from 'src/selectors/suite/suiteSelectors';
import { useAnalytics } from 'src/support/useAnalytics';

import { AnimationCard } from './AnimationCard';
import { useConnectionGlobalModalContext } from './context/ConnectionGlobalModalContext';
type DontSeeYourTrezorModalProps = {
    onClose: () => void;
};

const commonCableTips = [
    TROUBLESHOOTING_TIP_DEVICE_TURNED_ON_UNLOCKED,
    TROUBLESHOOTING_TIP_UDEV,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
];

export const CantSeeTrezorModal = ({ onClose }: DontSeeYourTrezorModalProps) => {
    const analytics = useAnalytics();
    const {
        isBluetoothMode,
        toggleShouldPairAgain,
        toggleShowHints,
        onReScanClick,
        notConnectedKnownDevices,
        notConnectedNearbyDevices,
    } = useConnectionGlobalModalContext();

    // when this modal is displayed, scanning should start again in case it stopped due to timeout, so that user can act on the additional instructions
    useEffect(() => {
        onReScanClick();
    }, [onReScanClick]);

    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));

    const allowPairAgain =
        notConnectedNearbyDevices?.length === 0 && notConnectedKnownDevices.length > 0;

    const openTrezorSupport = () => {
        window.open(TREZOR_SUPPORT_DEVICE_URL, '_blank');
        toggleShowHints();
    };

    const cableItem: TroubleshootingTipsItem[] = useMemo(() => {
        const items = isWebUsbTransport
            ? [...commonCableTips, TROUBLESHOOTING_TIP_SUITE_DESKTOP]
            : commonCableTips;

        return items;
    }, [isWebUsbTransport]);

    if (isBluetoothMode) {
        return (
            <Modal
                onCancel={onClose}
                width={400}
                bottomContent={
                    allowPairAgain && (
                        <Modal.Button
                            intent="neutral"
                            priority="secondary"
                            onClick={() => {
                                analytics.report({
                                    type: events.deviceConnectionHintModalEvent.name,
                                    payload: {
                                        option: 'notWorking',
                                    },
                                });
                                toggleShouldPairAgain();
                                toggleShowHints();
                            }}
                        >
                            <Translation id="TR_STILL_NOT_WORKING" />
                        </Modal.Button>
                    )
                }
            >
                <Column gap={32}>
                    <Column gap={24} padding={{ horizontal: 8 }}>
                        <H3 typographyStyle="headline-md" align="center" textWrap="pretty">
                            <Translation id="TR_TREZOR_NEEDS_TO_BE_IN_PAIRING_MODE" />
                        </H3>
                        <Paragraph
                            intent="neutral"
                            priority="secondary"
                            typographyStyle="body-sm"
                            align="center"
                            textWrap="balance"
                        >
                            <Translation id="TR_WINDOW_WILL_CLOSE_WHEN_TREZOR_IS_PAIRED" />
                        </Paragraph>
                    </Column>
                    <AnimationCard aspectRatio="1">
                        <DeviceAnimation
                            type="PAIRING_MODE"
                            deviceModelInternal={DeviceModelInternal.T3W1}
                            loop
                        />
                    </AnimationCard>
                </Column>
            </Modal>
        );
    }

    return (
        <Modal
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={toggleShowHints}>
                        <Translation id="TR_GOT_IT" />
                    </Modal.Button>
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={() => {
                            openTrezorSupport();
                            onClose();
                        }}
                    >
                        <Translation id="TR_CONTACT_TREZOR_SUPPORT" />
                    </Modal.Button>
                </>
            }
            heading={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
            onCancel={toggleShowHints}
            intent="info"
        >
            <TroubleshootingTipsList items={cableItem} />
        </Modal>
    );
};
