import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectAdapterStatus, selectIsDeviceOsUnpairingRequired } from '@suite-common/bluetooth';
import {
    Box,
    Button,
    Card,
    Column,
    Divider,
    H3,
    IconCircle,
    Image,
    Modal,
    Row,
    Spinner,
    Text,
    motionEasing,
} from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { isDesktop } from '@trezor/env-utils';
import { getLargeModelImagePath } from '@trezor/product-components';

import {
    selectIsManualPairingRequired,
    selectIsUnpairingDevice,
} from 'src/actions/bluetooth/desktopBluetoothSelectors';
import { useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { BluetoothAdapterStatusModal } from './BluetoothAdapterStatusModal';
import { BluetoothConnectionModal } from './BluetoothConnectionModal';
import { BluetoothManualPairingModal } from './BluetoothManualPairingModal';
import { CantSeeTrezorModal } from './CantSeeTrezorModal';
import { CableConnectionAnimation } from './DeviceConnectionAnimation';
import { useConnectionGlobalModalContext } from './context/ConnectionGlobalModalContext';
import { selectHasTransportOfType } from '../../selectors/suite/suiteSelectors';
import { WebUsbButton } from '../suite/WebUsbButton';
import { BluetoothDeviceList } from '../suite/bluetooth/BluetoothDeviceList';
import { UnpairBluetoothDeviceFromOsModal } from '../suite/bluetooth/UnpairBluetoothDeviceFromOsModal';

type DontSeeTrezorPillProps = {
    onClick: () => void;
};

const DontSeeTrezorPill = ({ onClick }: DontSeeTrezorPillProps) => (
    // A little hack so we can use the subtle variant of the button instead of creating a brand new variant for a single use case
    <Box backgroundColor="surfaceFillRaised" borderRadius={10}>
        <Button onClick={onClick} iconLeft="question" intent="info" priority="secondary">
            <Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />
        </Button>
    </Box>
);

type ConnectModalContentProps = {
    children?: React.ReactNode;
    isBluetoothMode: boolean;
};

const ConnectModalContent = ({ children, isBluetoothMode }: ConnectModalContentProps) => {
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));

    return (
        <Column alignItems="center" gap={32} overflow="hidden">
            <H3 typographyStyle="headline-md" align="center" textWrap="balance">
                <Translation
                    id={
                        isBluetoothMode
                            ? 'TR_CONNECT_UNLOCK_BLUETOOTH_DEVICE'
                            : 'TR_CONNECT_UNLOCK_YOUR_DEVICE'
                    }
                />
            </H3>
            {!isWebUsbTransport && (
                <Row gap={8} alignItems="center" justifyContent="center" height={36}>
                    <Spinner size={16} />
                    <Text intent="brand">
                        <Translation
                            id={
                                isBluetoothMode
                                    ? 'TR_SCAN_TREZORS_NEARBY'
                                    : 'TR_CHECK_CONNECTED_TREZORS'
                            }
                        />
                    </Text>
                </Row>
            )}
            {children}
            <CableConnectionAnimation isBluetoothMode={isBluetoothMode} />
        </Column>
    );
};

type ConnectionModeCardProps = {
    onClick: () => void;
};

const ViaBluetoothCard = ({ onClick }: ConnectionModeCardProps) => (
    <Card onClick={onClick} paddingType="large">
        <Column alignItems="center" gap={24}>
            <Image image={getLargeModelImagePath(DeviceModelInternal.T3W1)} height={128} />
            <H3>
                <Column alignItems="center">
                    <Text>
                        <Translation
                            id="TR_CONNECT_DEVICE_NAME"
                            values={{
                                deviceName: 'Trezor Safe 7',
                                b: chunks => (
                                    <Text textWrap="nowrap">
                                        <strong>{chunks}</strong>
                                    </Text>
                                ),
                            }}
                        />
                    </Text>
                    <Row gap={8}>
                        <Text>
                            <Translation id="TR_VIA_BLUETOOTH" />
                        </Text>
                        <IconCircle intent="neutral" name="bluetooth" size={32} />
                    </Row>
                </Column>
            </H3>
        </Column>
    </Card>
);

const ViaCableCard = ({ onClick }: ConnectionModeCardProps) => (
    <Card onClick={onClick} paddingType="large">
        <Column alignItems="center" gap={24}>
            <Row justifyContent="center">
                {[
                    DeviceModelInternal.T2T1,
                    DeviceModelInternal.T3T1,
                    DeviceModelInternal.T3W1,
                    DeviceModelInternal.T2B1,
                    DeviceModelInternal.T1B1,
                ].map((model, index, array) => {
                    const distanceFromEdge = Math.min(index, array.length - 1 - index);

                    return (
                        <Box
                            key={index}
                            position={{ type: 'relative' }}
                            // T1B1 is narrower than other models, so we skip the negative margin
                            margin={
                                model !== DeviceModelInternal.T1B1 ? { horizontal: -8 } : undefined
                            }
                            zIndex={distanceFromEdge}
                        >
                            <AnimatePresence>
                                <motion.div
                                    initial={
                                        index !== Math.floor(array.length / 2)
                                            ? {
                                                  x: index < array.length / 2 ? 20 : -20,
                                              }
                                            : undefined
                                    }
                                    animate={{ x: 0 }}
                                    transition={{
                                        duration: 1,
                                        ease: motionEasing.enter,
                                    }}
                                >
                                    <Image
                                        image={getLargeModelImagePath(model)}
                                        height={80 + distanceFromEdge * 24}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </Box>
                    );
                })}
            </Row>
            <H3>
                <Column alignItems="center">
                    <Text>
                        <Translation
                            id="TR_CONNECT_DEVICE_NAME"
                            values={{
                                deviceName: <Translation id="TR_ANY_TREZOR" />,
                                b: chunks => (
                                    <Text textWrap="nowrap">
                                        <strong>{chunks}</strong>
                                    </Text>
                                ),
                            }}
                        />
                    </Text>
                    <Row gap={8}>
                        <Text>
                            <Translation id="TR_VIA_CABLE" />
                        </Text>
                        <IconCircle intent="neutral" name="cableUsbC" size={32} />
                    </Row>
                </Column>
            </H3>
        </Column>
    </Card>
);

export const ConnectDeviceGlobalModal = ({ onCancel }: { onCancel: () => void }) => {
    const analytics = useAnalytics();
    const [isModeSelected, setIsModeSelected] = useState(false);
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const {
        toggleBluetoothMode,
        toggleShowHints,
        isBluetoothMode,
        showHints,
        openShowRemoveFromOsBluetooth,
        shouldShowBluetoothUnPairDeviceList,
        notConnectedKnownDevices,
        notConnectedNearbyDevices,
        manuallyPairedConnectedDevices,
        showRemoveFromOsBluetooth,
        closeShowRemoveFromOsBluetooth,
        selectedDevice,
    } = useConnectionGlobalModalContext();

    const isManualPairingRequired = useSelector(selectIsManualPairingRequired);
    const wasBluetoothDeviceWiped = useSelector(selectIsDeviceOsUnpairingRequired);
    const isUnpairingDevice = useSelector(selectIsUnpairingDevice);

    const bluetoothAdapterStatus = useSelector(selectAdapterStatus);

    if (wasBluetoothDeviceWiped?.isRequired || isUnpairingDevice) return null;

    if (isBluetoothMode && isManualPairingRequired) {
        return <BluetoothManualPairingModal onCancel={onCancel} />;
    }

    // handle Bluetooth adapter non ideal status cases
    if (
        isBluetoothMode &&
        ['disabled', 'permission-denied', 'not-compatible'].includes(bluetoothAdapterStatus)
    ) {
        return <BluetoothAdapterStatusModal onCancel={onCancel} />;
    }

    // prompt user to remove the device from OS bluetooth settings
    if (showRemoveFromOsBluetooth) {
        return <UnpairBluetoothDeviceFromOsModal onFinish={closeShowRemoveFromOsBluetooth} />;
    }

    // no nearby devices found, but there are known devices that user might troubleshoot, so let him pair again
    if (isBluetoothMode && shouldShowBluetoothUnPairDeviceList) {
        return (
            <Modal
                onCancel={onCancel}
                heading={<Translation id="TR_CONNECT_YOUR_TREZOR" />}
                description={<Translation id="TR_CONNECT_YOUR_TREZOR_DESCRIPTION" />}
                width={600}
            >
                <BluetoothDeviceList
                    deviceList={notConnectedKnownDevices}
                    isScanning={false}
                    onPairAgain={openShowRemoveFromOsBluetooth}
                />
            </Modal>
        );
    }

    // there are nearby devices which can be selected to proceed, show the list and let user connect
    const areConnectableDevices =
        selectedDevice ||
        notConnectedNearbyDevices.length > 0 ||
        manuallyPairedConnectedDevices.length > 0;
    if (isBluetoothMode && areConnectableDevices) {
        return <BluetoothConnectionModal onClose={onCancel} />;
    }

    if (showHints) {
        return (
            <CantSeeTrezorModal
                onClose={() => {
                    analytics.report({
                        type: events.deviceConnectionHintModalEvent.name,
                        payload: {
                            option: 'close',
                        },
                    });
                    onCancel();
                }}
            />
        );
    }

    // scanning for nearby devices
    if (isBluetoothMode) {
        return (
            <Modal.Backdrop onClick={onCancel}>
                <DontSeeTrezorPill onClick={toggleShowHints} />
                <Modal.ModalBase
                    data-testid="@suite/connection-modal"
                    width={400}
                    onCancel={onCancel}
                    onBackClick={() => {
                        setIsModeSelected(false);
                        toggleBluetoothMode();
                    }}
                >
                    <ConnectModalContent isBluetoothMode={true} />
                </Modal.ModalBase>
            </Modal.Backdrop>
        );
    }

    if (isDesktop() && !isModeSelected) {
        return (
            <Modal data-testid="@suite/connection-modal" width={400} onCancel={onCancel}>
                <Column gap={16}>
                    <ViaBluetoothCard
                        onClick={() => {
                            setIsModeSelected(true);
                            toggleBluetoothMode();
                        }}
                    />
                    <Row gap={24}>
                        <Divider margin={0} />
                        <Text
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                            case="uppercase"
                        >
                            or
                        </Text>
                        <Divider margin={0} />
                    </Row>
                    <ViaCableCard onClick={() => setIsModeSelected(true)} />
                </Column>
            </Modal>
        );
    }

    // waiting for user to connect device via wired connection
    return (
        <Modal.Backdrop onClick={onCancel}>
            <DontSeeTrezorPill onClick={toggleShowHints} />
            <Modal.ModalBase
                data-testid="@suite/connection-modal"
                width={400}
                onCancel={onCancel}
                onBackClick={isDesktop() ? () => setIsModeSelected(false) : undefined}
            >
                <ConnectModalContent isBluetoothMode={false}>
                    {isWebUsbTransport && <WebUsbButton intent="brand" size="medium" />}
                </ConnectModalContent>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
