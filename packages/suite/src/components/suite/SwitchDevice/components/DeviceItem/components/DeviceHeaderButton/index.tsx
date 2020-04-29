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
    onSolveIssueClick: () => void;
    onDeviceSettingsClick: () => void;
}

const SolveIssueButton = ({ onSolveIssueClick }: Props) => (
    <Row>
        <Attention>
            <AttentionIconWrapper>
                <Icon icon="WARNING" size={16} color={colors.RED_ERROR} />
            </AttentionIconWrapper>
            <Translation id="TR_DEVICE_NEEDS_ATTENTION" />
        </Attention>
        <Button variant="secondary" onClick={onSolveIssueClick}>
            <Translation id="TR_SOLVE_ISSUE" />
        </Button>
    </Row>
);

const DeviceSettingsButton = ({ onDeviceSettingsClick }: Props) => (
    <Button variant="tertiary" icon="SETTINGS" onClick={onDeviceSettingsClick}>
        <Translation id="TR_DEVICE_SETTINGS" />
    </Button>
);

export default (props: Props) => {
    const { device } = props;
    const deviceStatus = deviceUtils.getStatus(device);
    const isUnknown = device.type !== 'acquired';
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);

    if (needsAttention) return <SolveIssueButton {...props} />;

    if (!isUnknown) return <DeviceSettingsButton {...props} />;

    return null;
};
