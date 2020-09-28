import React from 'react';
import styled from 'styled-components';
import { colors, Icon } from '@trezor/components';
import { NotificationCard, Translation } from '@suite-components';
import * as deviceUtils from '@suite-utils/device';
import { TrezorDevice } from '@suite-types';

const GrayNotificationCard = styled(props => <NotificationCard {...props} />)`
    background: ${colors.NEUE_BG_GRAY};
`;
interface Props {
    needsAttention: boolean;
    device: TrezorDevice;
    deviceStatusMessage?: React.ReactNode;
    onSolveIssueClick: () => void;
    onDeviceSettingsClick: () => void;
}

const DeviceHeaderButton = (props: Props) => {
    const { device } = props;
    const deviceStatus = deviceUtils.getStatus(device);
    const deviceStatusMessage = deviceUtils.getDeviceNeedsAttentionMessage(deviceStatus);
    const isUnknown = device.type !== 'acquired';

    return (
        <>
            {props.needsAttention && (
                <GrayNotificationCard
                    variant="warning"
                    button={{
                        children: <Translation id="TR_SOLVE_ISSUE" />,
                        onClick: props.onSolveIssueClick,
                        dataTest: `@switch-device/${device.path}/solve-issue-button`,
                    }}
                >
                    {deviceStatusMessage && <Translation {...deviceStatusMessage} />}
                </GrayNotificationCard>
            )}
            {!props.needsAttention && !isUnknown && (
                // Device Settings button
                <Icon
                    usePointerCursor
                    size={24}
                    icon="SETTINGS"
                    color={colors.NEUE_TYPE_LIGHT_GREY}
                    onClick={props.onDeviceSettingsClick}
                />
            )}
        </>
    );
};

export default DeviceHeaderButton;
