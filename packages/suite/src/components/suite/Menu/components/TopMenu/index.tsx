import React from 'react';
import styled from 'styled-components';
import { colors, Icon } from '@trezor/components-v2';
import Divider from '../Divider';
import DeviceIcon from '@suite-components/images/DeviceIcon';
import { Props as ContainerProps } from '../../Container';
import { MENU_PADDING } from '@suite-constants/menu';

const Wrapper = styled.div`
    padding-left: ${MENU_PADDING}px;
    background: ${colors.BLACK17};
    display: flex;
    flex-direction: column;
`;

const DeviceStatus = styled.div``;

const DeviceRow = styled.div`
    height: 36px;
    color: ${colors.WHITE};
    margin-top: 14px;
    display: flex;
    font-weight: bold;
    font-size: 90%;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    padding-left: 10px;
    padding-right: 10px;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;

    &:hover {
        background-color: ${colors.BLACK25};
    }
`;

const DeviceLabel = styled.div`
    color: ${colors.WHITE};
    padding-left: 5px;
    display: flex;
    flex: 1;
`;

const DeviceIconWrapper = styled.div`
    padding-top: 2px;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
`;

interface Props {
    selectedDevice: ContainerProps['selectedDevice'];
    goto: ContainerProps['goto'];
}

const TopMenu = (props: Props) => (
    <Wrapper>
        <DeviceStatus>
            {!props.selectedDevice && <DeviceRow />}
            {props.selectedDevice && (
                <DeviceRow onClick={() => props.goto('suite-switch-device', { cancelable: true })}>
                    <DeviceIconWrapper>
                        <DeviceIcon size={12} color={colors.GREEN} device={props.selectedDevice} />
                    </DeviceIconWrapper>
                    <DeviceLabel>{props.selectedDevice.label}</DeviceLabel>
                    <IconWrapper>
                        <Icon size={7} color={colors.WHITE} icon="ARROW_RIGHT" />
                    </IconWrapper>
                </DeviceRow>
            )}
        </DeviceStatus>
        <Divider />
    </Wrapper>
);

export default TopMenu;
