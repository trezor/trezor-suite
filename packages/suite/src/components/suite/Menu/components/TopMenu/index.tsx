import React from 'react';
import styled from 'styled-components';
import { colors, Icon } from '@trezor/components-v2';
import Divider from '../Divider';
import DeviceIcon from '@suite-components/images/DeviceIcon';
import { Props as ContainerProps } from '../../Container';
import { MENU_PADDING } from '@suite-constants/menu';

const Wrapper = styled.div`
    padding: ${MENU_PADDING}px 10px;
    background: ${colors.BLACK17};
    display: flex;
    flex-direction: column;
`;

const DeviceStatus = styled.div``;

const DeviceRow = styled.div`
    height: 36px;
    color: ${colors.WHITE};
    margin: 10px 0;
    display: flex;
    font-weight: bold;
    font-size: 90%;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

const DeviceLabel = styled.div`
    color: ${colors.WHITE};
    padding-left: 5px;
    display: flex;
    flex: 1;
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
                    <DeviceIcon size={12} device={props.selectedDevice} />
                    <DeviceLabel>{props.selectedDevice.label}</DeviceLabel>
                    <IconWrapper>
                        <Icon size={10} color={colors.WHITE} icon="ARROW_RIGHT" />
                    </IconWrapper>
                </DeviceRow>
            )}
        </DeviceStatus>
        <Divider />
    </Wrapper>
);

export default TopMenu;
