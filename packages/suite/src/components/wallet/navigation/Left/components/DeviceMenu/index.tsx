/* @flow */
import React, { PureComponent } from 'react';
import styled from 'styled-components';
import TrezorConnect from 'trezor-connect';
import { FormattedMessage } from 'react-intl';
import { Button, icons, colors, variables, animations } from '@trezor/components';
import * as deviceUtils from '@suite/utils/device';
import l10nCommonMessages from '@suite/views/common.messages';
import MenuItems from './components/MenuItems';
import Divider from '../Divider';

const Wrapper = styled.div`
    position: absolute;
    z-index: 1;
    width: 100%;
    padding-bottom: 8px;
    border-bottom: 1px solid #e3e3e3;
    background: white;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
    animation: ${animations.SLIDE_DOWN} 0.25s cubic-bezier(0.17, 0.04, 0.03, 0.94) forwards;
`;

const Overlay = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.1);
    animation: ${animations.FADE_IN} 0.25s;
`;

const ButtonWrapper = styled.div`
    margin: 10px 0;
    padding: 0 24px;
    display: flex;
`;
const StyledButton = styled(Button)`
    flex: 1;
`;

const StyledDivider = styled(Divider)`
    background: #fff;
    color: ${colors.TEXT_PRIMARY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.BASE};
    border: none;
`;

class DeviceMenu extends PureComponent {
    constructor(props) {
        super(props);
        this.mouseDownHandler = this.mouseDownHandler.bind(this);
        this.blurHandler = this.blurHandler.bind(this);
        this.myRef = React.createRef();
    }

    componentDidMount(): void {
        window.addEventListener('mousedown', this.mouseDownHandler, false);
        // window.addEventListener('blur', this.blurHandler, false);
        const { transport } = this.props.connect;
        if (deviceUtils.isWebUSB(transport)) TrezorConnect.renderWebUSBButton();
    }

    componentDidUpdate() {
        const { transport } = this.props.connect;
        if (deviceUtils.isWebUSB(transport)) TrezorConnect.renderWebUSBButton();
    }

    componentWillUnmount(): void {
        window.removeEventListener('mousedown', this.mouseDownHandler, false);
    }

    getMenuHeight(): number {
        return this.myRef.current ? this.myRef.current.getBoundingClientRect().height : 0;
    }

    blurHandler(): void {
        this.props.toggleDeviceDropdown(false);
    }

    mouseDownHandler(event): void {
        let elem: any = (event.target);
        let block: boolean = false;
        while (elem.parentElement) {
            if (
                elem.tagName.toLowerCase() === 'aside' ||
                (elem.className &&
                    elem.className.indexOf &&
                    elem.className.indexOf('modal-container') >= 0)
            ) {
                block = true;
                break;
            }

            elem = elem.parentElement;
        }

        if (!block) {
            this.props.toggleDeviceDropdown(false);
        }
    }

    mouseDownHandler: (event) => void;

    blurHandler: () => void;

    showDivider() {
        return this.props.devices.length > 1;
    }

    showMenuItems() {
        return deviceUtils.isDeviceAccessible(this.props.wallet.selectedDevice);
    }

    myRef: { current };

    render() {
        const { devices, onSelectDevice, forgetDevice, toggleDeviceDropdown } = this.props;
        const { transport } = this.props.connect;
        const { selectedDevice, dropdownOpened } = this.props.wallet;

        return (
            <>
                <Wrapper ref={this.myRef}>
                    {this.showMenuItems() && <MenuItems device={selectedDevice} {...this.props} />}
                    {this.showDivider() && <StyledDivider hasBorder textLeft="Other devices" />}
                    {/* <DeviceList
                        devices={devices}
                        selectedDevice={selectedDevice}
                        onSelectDevice={onSelectDevice}
                        forgetDevice={forgetDevice}
                    /> */}
                    {deviceUtils.isWebUSB(transport) && (
                        <ButtonWrapper>
                            <StyledButton
                                isInverse
                                icon={icons.PLUS}
                                additionalClassName="trezor-webusb-button"
                            >
                                <FormattedMessage {...l10nCommonMessages.TR_CHECK_FOR_DEVICES} />
                            </StyledButton>
                        </ButtonWrapper>
                    )}
                </Wrapper>
                <Overlay
                    onClick={() => {
                        toggleDeviceDropdown(!dropdownOpened);
                    }}
                />
            </>
        );
    }
}

export default DeviceMenu;
