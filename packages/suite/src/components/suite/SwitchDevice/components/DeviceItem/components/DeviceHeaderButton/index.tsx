import React from 'react';
import styled from 'styled-components';
import { colors, Icon } from '@trezor/components';
import { Translation } from '@suite-components';
import NotificationCard from '@suite-components/NotificationCard'; // on purpose to avoid hacky sc overriding
import * as deviceUtils from '@suite-utils/device';
import { TrezorDevice } from '@suite-types';

const GrayNotificationCard = styled(NotificationCard)`
    background: ${colors.NEUE_BG_GRAY};
    margin-bottom: 0px;
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
                        'data-test': `@switch-device/${device.path}/solve-issue-button`,
                    }}
                >
                    {deviceStatusMessage && <Translation {...deviceStatusMessage} />}
                </GrayNotificationCard>
            )}
            {!props.needsAttention && !isUnknown && (
                // Device Settings button
                <Icon
                    useCursorPointer
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
