import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, Icon } from '@trezor/components-v2';
import Divider from '../Divider';
import DeviceIcon from '@suite-components/images/DeviceIcon';
import { Props as ContainerProps } from '../../Container';
import { MENU_PADDING } from '@suite-constants/menu';
import DeviceModal from './components/DeviceModal/Container';

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
}

const TopMenu = (props: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const showModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    return (
        <Wrapper>
            <DeviceStatus>
                {!props.selectedDevice && <DeviceRow>no device</DeviceRow>}
                {props.selectedDevice && (
                    <DeviceRow onClick={() => showModal()}>
                        <DeviceIcon size={12} device={props.selectedDevice} />
                        <DeviceLabel>{props.selectedDevice.label}</DeviceLabel>
                        <IconWrapper>
                            <Icon size={10} color={colors.WHITE} icon="ARROW_RIGHT" />
                        </IconWrapper>
                    </DeviceRow>
                )}
                {isOpen && <DeviceModal closeModal={closeModal} isOpen={isOpen} />}
            </DeviceStatus>
            <Divider />
        </Wrapper>
    );
};

export default TopMenu;
