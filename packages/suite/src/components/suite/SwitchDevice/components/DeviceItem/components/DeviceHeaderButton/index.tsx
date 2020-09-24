import React from 'react';
import styled from 'styled-components';
import { Button, colors, variables, Icon } from '@trezor/components';
import { Translation } from '@suite-components';
import * as deviceUtils from '@suite-utils/device';
import { TrezorDevice } from '@suite-types';

const Row = styled.div`
    display: flex;
    align-items: center;
`;

const Attention = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.RED_ERROR};
    margin-right: 20px;
`;

const AttentionIconWrapper = styled.div`
    margin-right: 1ch;
`;

interface Props {
    device: TrezorDevice;
    deviceStatusMessage?: React.ReactNode;
    onSolveIssueClick: () => void;
    onDeviceSettingsClick: () => void;
}

const SolveIssueButton = ({ onSolveIssueClick, deviceStatusMessage, device }: Props) => (
    <Row>
        <Attention>
            <AttentionIconWrapper>
                <Icon icon="WARNING" size={16} color={colors.RED_ERROR} />
            </AttentionIconWrapper>
            {deviceStatusMessage && <>{deviceStatusMessage}</>}
        </Attention>
        <Button
            variant="secondary"
            onClick={onSolveIssueClick}
            data-test={`@switch-device/${device.path}/solve-issue-button`}
        >
            <Translation id="TR_SOLVE_ISSUE" />
        </Button>
    </Row>
);

const DeviceSettingsButton = ({ onDeviceSettingsClick }: Props) => (
    <Icon
        useCursorPointer
        size={24}
        icon="SETTINGS"
        color={colors.NEUE_TYPE_LIGHT_GREY}
        onClick={onDeviceSettingsClick}
    />
);

const DeviceHeaderButton = (props: Props) => {
    const { device } = props;
    const deviceStatus = deviceUtils.getStatus(device);
    const deviceStatusMessage = deviceUtils.getDeviceNeedsAttentionMessage(deviceStatus);
    const isUnknown = device.type !== 'acquired';
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);

    if (needsAttention)
        return (
            <SolveIssueButton
                deviceStatusMessage={
                    deviceStatusMessage ? <Translation {...deviceStatusMessage} /> : undefined
                }
                {...props}
            />
        );

    if (!isUnknown) return <DeviceSettingsButton {...props} />;

    return null;
};

export default DeviceHeaderButton;
