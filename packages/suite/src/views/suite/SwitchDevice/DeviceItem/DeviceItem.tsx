import { ReactNode, useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import * as deviceUtils from '@suite-common/suite-utils';
import { Button, Column, Icon, IconName, List, Paragraph, Row, Tooltip } from '@trezor/components';
import { mapTrezorModelToIcon } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import {
    addDeviceIdToSeenDisconnectNotification,
    setFlag,
    setRecentlyDisconnectedDevice,
} from 'src/actions/suite/suiteActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import type { AcquiredDevice, ForegroundAppProps, TrezorDevice } from 'src/types/suite';

import { AddWalletButton } from './AddWalletButton';
import { WalletInstance } from './WalletInstance';
import { CardWithDevice } from '../CardWithDevice';

type DeviceItemProps = {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    onCancel?: ForegroundAppProps['onCancel'];
};

const ListItem = ({ children, iconName }: { children: ReactNode; iconName: IconName }) => (
    <List.Item
        bulletComponent={<Icon name={iconName} intent="neutral" priority="secondary" size={20} />}
    >
        <Paragraph
            typographyStyle="body-md"
            intent="neutral"
            priority="secondary"
            textWrap="pretty"
        >
            {children}
        </Paragraph>
    </List.Item>
);

export const DeviceItem = ({ device, instances, onCancel }: DeviceItemProps) => {
    const dispatch = useDispatch();
    const selectedDevice = useSelector(selectSelectedDevice);
    const deviceId = selectedDevice?.id;
    const recentlyDisconnectedDevice = useSelector(state => state.suite.recentlyDisconnectedDevice);
    const hasSeenDisconnectTooltip = useSelector(
        state => state.suite.flags.hasSeenDisconnectTooltip,
    );
    const [showTooltip, setShowTooltip] = useState(false);
    const deviceModelInternal = device.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;
    const instancesWithState = instances.filter(i => i.state);

    useEffect(() => {
        if (recentlyDisconnectedDevice === device.id) {
            if (!device.connected && !hasSeenDisconnectTooltip) {
                setShowTooltip(true);
            } else {
                dispatch(setRecentlyDisconnectedDevice(null));
                setShowTooltip(false);
            }
        } else {
            setShowTooltip(false);
        }
    }, [
        recentlyDisconnectedDevice,
        device.id,
        device.connected,
        hasSeenDisconnectTooltip,
        dispatch,
    ]);

    const onTooltipClose = () => {
        setShowTooltip(false);
        dispatch(setRecentlyDisconnectedDevice(null));
        dispatch(setFlag('hasSeenDisconnectTooltip', true));

        if (deviceId) {
            dispatch(addDeviceIdToSeenDisconnectNotification(deviceId));
        }
    };

    return (
        <CardWithDevice
            onCancel={onCancel}
            device={device}
            actions={null} // Do not show close button
        >
            <Column gap={8}>
                {instancesWithState.length > 0 && (
                    <Column gap={8}>
                        {instancesWithState.map((instance, index) => (
                            <Tooltip
                                content={
                                    <Column
                                        padding={{
                                            horizontal: spacings.sm,
                                            vertical: spacings.xs,
                                        }}
                                        gap={spacings.md}
                                    >
                                        <Paragraph
                                            typographyStyle="body-md-strong"
                                            textWrap="balance"
                                        >
                                            <Translation id="TR_DEVICE_DISCONNECTED_TOOLTIP_TITLE" />
                                        </Paragraph>
                                        <List bulletGap={spacings.sm}>
                                            <ListItem iconName="eject">
                                                <Translation id="TR_DEVICE_DISCONNECTED_TOOLTIP_ITEM_1" />
                                            </ListItem>
                                            <ListItem
                                                iconName={mapTrezorModelToIcon[deviceModelInternal]}
                                            >
                                                <Translation id="TR_DEVICE_DISCONNECTED_TOOLTIP_ITEM_2" />
                                            </ListItem>
                                        </List>
                                        <Row gap={spacings.sm} margin={{ top: spacings.xs }}>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    onTooltipClose();
                                                    onCancel?.();
                                                }}
                                            >
                                                <Translation id="TR_DEVICE_DISCONNECTED_TOOLTIP_BUTTON_PRIMARY" />
                                            </Button>
                                            <Button
                                                size="small"
                                                intent="neutral"
                                                priority="secondary"
                                                onClick={() => {
                                                    onTooltipClose();
                                                    dispatch(
                                                        goto('settings-index', {
                                                            anchor: SettingsAnchor.AutoEject,
                                                        }),
                                                    );
                                                }}
                                            >
                                                <Translation id="TR_DEVICE_DISCONNECTED_TOOLTIP_BUTTON_SECONDARY" />
                                            </Button>
                                        </Row>
                                    </Column>
                                }
                                key={`${instance.id}-${instance.walletNumber}-${instance.state}`}
                                isOpen={showTooltip && index === 0}
                                width="100%"
                                placement="right-start"
                                hasArrow
                                offset={30}
                            >
                                <WalletInstance
                                    instance={instance}
                                    isSelected={deviceUtils.isSelectedInstance(
                                        selectedDevice,
                                        instance,
                                    )}
                                    index={index}
                                    onCancel={onCancel}
                                />
                            </Tooltip>
                        ))}
                    </Column>
                )}
                <AddWalletButton device={device} instances={instances} onCancel={onCancel} />
            </Column>
        </CardWithDevice>
    );
};
