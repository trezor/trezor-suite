import { type ReactNode, useEffect, useState } from 'react';

import { setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { SettingsAnchor, goto } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import * as deviceUtils from '@suite-common/suite-utils';
import {
    Button,
    Column,
    Icon,
    type IconName,
    List,
    Paragraph,
    Row,
    Tooltip,
} from '@trezor/components';
import { mapTrezorModelToIcon } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import {
    addDeviceIdToSeenDisconnectNotification,
    setRecentlyDisconnectedDevice,
} from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import type { AcquiredDevice, ForegroundAppProps, TrezorDevice } from 'src/types/suite';

import { CardWithDevice } from '../CardWithDevice';
import { AddWalletButton } from './AddWalletButton';
import { WalletInstance } from './WalletInstance';

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
    const hasSeenDisconnectTooltip = useSelector(state => state.flags.hasSeenDisconnectTooltip);
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
        dispatch(setFlag({ key: 'hasSeenDisconnectTooltip', value: true }));

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
                                        <Row
                                            gap={spacings.sm}
                                            margin={{ top: spacings.xs }}
                                            flexWrap="wrap"
                                        >
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
                                                        goto({
                                                            routeName: 'settings-index',
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
                                key={`${instance.id}-${instance.instance}-${instance.state}`}
                                isOpen={showTooltip && index === 0}
                                width="100%"
                                placement="right-start"
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
