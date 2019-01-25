/* @flow */
import React, { PureComponent } from 'react';
import styled from 'styled-components';
import TrezorConnect from 'trezor-connect';
import type { TrezorDevice } from 'flowtype';

import COLORS from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';
import { SLIDE_DOWN } from 'config/animations';

import Button from 'components/Button';
import * as deviceUtils from 'utils/device';
import MenuItems from './components/MenuItems';
import DeviceList from './components/DeviceList';

import type { Props } from '../common';

import Divider from '../Divider';

const Wrapper = styled.div`
    position: absolute;
    z-index: 1;
    width: 100%;
    padding-bottom: 8px; 
    border-bottom: 1px solid #E3E3E3;
    background: white;
    box-shadow: 0 3px 8px rgba(0,0,0,0.06);
    animation: ${SLIDE_DOWN} 0.25s cubic-bezier(0.17, 0.04, 0.03, 0.94) forwards;
`;

const ButtonWrapper = styled.div`
    margin: 10px 0;
    padding: 0 10px;
    display: flex;
`;
const StyledButton = styled(Button)`
    flex: 1;
`;

const StyledDivider = styled(Divider)`
    background: #fff;
    color: ${COLORS.TEXT_PRIMARY};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.BASE};
    border: none;
`;

type DeviceMenuItem = {
    type: string;
    label: string;
}

class DeviceMenu extends PureComponent<Props> {
    constructor(props: Props) {
        super(props);
        this.mouseDownHandler = this.mouseDownHandler.bind(this);
        this.blurHandler = this.blurHandler.bind(this);
        this.myRef = React.createRef();
    }

    componentDidMount(): void {
        window.addEventListener('mousedown', this.mouseDownHandler, false);
        // window.addEventListener('blur', this.blurHandler, false);
        const { transport } = this.props.connect;
        if (transport.type && transport.version.indexOf('webusb') >= 0) TrezorConnect.renderWebUSBButton();
    }

    componentDidUpdate() {
        const { transport } = this.props.connect;
        if (deviceUtils.isWebUSB(transport)) TrezorConnect.renderWebUSBButton();
    }

    componentWillUnmount(): void {
        window.removeEventListener('mousedown', this.mouseDownHandler, false);
    }

    onDeviceMenuClick(item: DeviceMenuItem, device: TrezorDevice): void {
        if (item.type === 'reload') {
            this.props.acquireDevice();
        } else if (item.type === 'forget') {
            this.props.forgetDevice(device);
        } else if (item.type === 'clone') {
            this.props.duplicateDevice(device);
        } else if (item.type === 'settings') {
            this.props.toggleDeviceDropdown(false);
            this.props.gotoDeviceSettings(device);
        }
    }

    getMenuHeight(): number {
        return this.myRef.current ? this.myRef.current.getBoundingClientRect().height : 0;
    }

    blurHandler(): void {
        this.props.toggleDeviceDropdown(false);
    }

    mouseDownHandler(event: MouseEvent): void {
        let elem: any = (event.target: any);
        let block: boolean = false;
        while (elem.parentElement) {
            if (elem.tagName.toLowerCase() === 'aside' || (elem.className && elem.className.indexOf && elem.className.indexOf('modal-container') >= 0)) {
                block = true;
                break;
            }

            elem = elem.parentElement;
        }

        if (!block) {
            this.props.toggleDeviceDropdown(false);
        }
    }

    mouseDownHandler: (event: MouseEvent) => void;

    blurHandler: (event: FocusEvent) => void;

    showDivider() {
        return this.props.devices.length > 1;
    }

    showMenuItems() {
        return deviceUtils.isDeviceAccessible(this.props.wallet.selectedDevice);
    }

    myRef: { current: ?HTMLDivElement }

    render() {
        const { devices, onSelectDevice, forgetDevice } = this.props;
        const { transport } = this.props.connect;
        const { selectedDevice } = this.props.wallet;

        return (
            <Wrapper ref={this.myRef}>
                {this.showMenuItems() && <MenuItems device={selectedDevice} {...this.props} />}
                {this.showDivider() && <StyledDivider hasBorder textLeft="Other devices" />}
                <DeviceList
                    devices={devices}
                    selectedDevice={selectedDevice}
                    onSelectDevice={onSelectDevice}
                    forgetDevice={forgetDevice}
                />
                {deviceUtils.isWebUSB(transport) && (
                    <ButtonWrapper>
                        <StyledButton isWebUsb>Check for devices</StyledButton>
                    </ButtonWrapper>
                )}
            </Wrapper>
        );
    }
}

export default DeviceMenu;