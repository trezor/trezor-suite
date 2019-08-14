import React, { useState, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import TrezorConnect from 'trezor-connect';
import { bindActionCreators } from 'redux';
import styled, { css } from 'styled-components';
import { toggleDeviceMenu, selectDevice } from '@suite-actions/suiteActions';
import { forgetDevice } from '@suite-actions/trezorConnectActions';
import { Button, colors, variables, animations, Tooltip, Icon } from '@trezor/components';
import DeviceItem from '@suite-components/DeviceMenu/components/DeviceItem';
import { isDeviceAccessible, isWebUSB } from '@suite-utils/device';
import l10nCommonMessages from '@suite-views/index.messages';
import WebusbButton from '@suite-components/WebusbButton';
import MenuItems from './components/MenuItems';
import DeviceList from './components/DeviceList';
import l10nMessages from './index.messages';
import { AppState, Omit, TrezorDevice, AcquiredDevice } from '@suite-types';

const { FONT_SIZE, FONT_WEIGHT } = variables;
const { SLIDE_DOWN } = animations;

const Wrapper = styled.div<WrapperProps>`
    position: relative;
    display: flex;
    min-height: 70px;
    width: 320px;
    z-index: 1;

    border-radius: 4px 0 0 0;
    box-shadow: ${props => (props.disabled ? 'none' : '0 3px 8px rgba(0, 0, 0, 0.04)')};

    ${props =>
        (props.isOpen || !props.isSelected) &&
        css`
            box-shadow: none;
        `}
`;

const StyledDivider = styled.div`
    background: #fff;
    color: ${colors.TEXT_PRIMARY};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.BASE};
    padding: 8px 28px 8px 24px;
`;

const Menu = styled.div`
    position: absolute;
    width: 320px;
    top: 70px;
    border-bottom: 1px solid #e3e3e3;
    border-right: 1px solid #e3e3e3;
    animation: ${SLIDE_DOWN} 0.2s cubic-bezier(0.17, 0.04, 0.03, 0.94) forwards;
    background: ${colors.WHITE};
    box-shadow: 0 12px 8px -8px rgba(0, 0, 0, 0.1);
`;

const IconDivider = styled.div`
    width: 8px;
`;

const DeviceIconWrapper = styled.div`
    margin: 0 3px;
`;

// const WalletIconWrapper = styled.div`
//     padding-bottom: 1px;
//     margin: 0 3px;
// `;

const Counter = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid ${colors.DIVIDER};
    border-radius: 50%;
    color: ${colors.TEXT_SECONDARY};
    width: 22px;
    height: 22px;
    line-height: 0.9rem;
    font-size: ${FONT_SIZE.COUNTER};
`;

const ButtonWrapper = styled.div`
    margin: 10px 0;
    padding: 0 24px;
    display: flex;
`;
const StyledButton = styled(Button)`
    flex: 1;
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    devices: AppState['devices'];
    selectedDevice: AppState['suite']['device'];
    selectDevice: (device: TrezorDevice) => void;
    toggleDeviceMenu: (opened: boolean) => void;
    icon?: any;
    disabled?: boolean;
    isOpen: boolean;
    isSelected?: boolean;
    transport: AppState['suite']['transport'];
    className?: string;
}

type WrapperProps = Omit<
    Props,
    | 'onSelect'
    | 'devices'
    | 'selectedDevice'
    | 'selectDevice'
    | 'icon'
    | 'device'
    | 'toggleDeviceMenu'
    | 'transport'
>;

const DeviceMenu = ({
    devices,
    selectedDevice,
    icon,
    disabled = false,
    isSelected = false,
    className,
    selectDevice,
    toggleDeviceMenu,
    transport,
    isOpen = false,
    ...rest
}: Props) => {
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        if (isWebUSB(transport)) TrezorConnect.renderWebUSBButton();
    });

    // hooks managing closing the menu on click outside of the menu
    const ref = useRef<HTMLDivElement>(null);
    const handleClickOutside = (event: any) => {
        if (ref.current && !ref.current.contains(event.target)) {
            toggleDeviceMenu(false);
        }
    };
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('click', handleClickOutside, true);
        } else {
            document.removeEventListener('click', handleClickOutside, true);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!selectedDevice) return null; // TODO: can it happen? if so some placeholder would be better

    const selectedDeviceAccessible = isDeviceAccessible(selectedDevice);
    const multipleDevices = devices.length > 1;

    return (
        <Wrapper
            className={className}
            onClick={() => {
                setIsAnimated(true);
                toggleDeviceMenu(!isOpen);
            }}
            disabled={!selectedDeviceAccessible && devices.length === 1}
            isOpen={isOpen}
            ref={ref}
            {...rest}
        >
            <DeviceItem
                device={selectedDevice}
                isHoverable={false}
                disabled={disabled}
                isSelected
                icon={
                    <React.Fragment>
                        {/* {showWalletType && (
                            <Tooltip
                                content={
                                    <WalletTooltipMsg
                                        walletType={walletType}
                                        isDeviceReady={isDeviceReady}
                                    />
                                }
                                maxWidth={200}
                                placement="bottom"
                                delay={500}
                            >
                                <WalletIconWrapper>
                                    <WalletTypeIcon
                                        onClick={e => {
                                            if (selectedDevice && isDeviceReady) {
                                                this.props.duplicateDevice(selectedDevice);
                                                e.stopPropagation();
                                            }
                                        }}
                                        hoverColor={
                                            isDeviceReady
                                                ? colors.TEXT_PRIMARY
                                                : colors.TEXT_SECONDARY
                                        }
                                        type={walletType}
                                        size={16}
                                        color={colors.TEXT_SECONDARY}
                                    />
                                </WalletIconWrapper>
                            </Tooltip>
                        )} */}
                        {devices.length > 1 && (
                            <Tooltip
                                content={
                                    <FormattedMessage {...l10nMessages.TR_NUMBER_OF_DEVICES} />
                                }
                                maxWidth={200}
                                placement="bottom"
                                delay={500}
                            >
                                <DeviceIconWrapper>
                                    <Counter>{devices.length}</Counter>
                                </DeviceIconWrapper>
                            </Tooltip>
                        )}
                        {/* <Tooltip
                        content={
                            <FormattedMessage
                                {...l10nCommonMessages.TR_APPLICATION_SETTINGS}
                            />
                        }
                        maxWidth={200}
                        placement="bottom"
                        delay={500}
                    >
                        <WalletTypeIconWrapper>
                            <Link to={getPattern('wallet-settings')}>
                                <Icon
                                    size={16}
                                    color={colors.TEXT_SECONDARY}
                                    hoverColor={colors.TEXT_PRIMARY}
                                    icon="COG"
                                />
                            </Link>
                        </WalletTypeIconWrapper>
                    </Tooltip> */}
                        <IconDivider />
                        <Icon
                            canAnimate={isAnimated}
                            isActive={isOpen}
                            size={16}
                            color={colors.TEXT_SECONDARY}
                            icon="ARROW_DOWN"
                        />
                    </React.Fragment>
                }
            />
            {isOpen && (
                <Menu>
                    {selectedDeviceAccessible && (
                        <MenuItems device={selectedDevice as AcquiredDevice} />
                    )}
                    {multipleDevices && <StyledDivider>Other devices</StyledDivider>}
                    <DeviceList
                        devices={devices}
                        selectedDevice={selectedDevice}
                        onSelectDevice={selectDevice}
                        forgetDevice={forgetDevice}
                    />
                    {isWebUSB(transport) && (
                        <ButtonWrapper>
                            <WebusbButton />
                        </ButtonWrapper>
                    )}
                </Menu>
            )}
        </Wrapper>
    );
};

const mapStateToProps = (state: AppState) => ({
    devices: state.devices,
    selectedDevice: state.suite.device,
    transport: state.suite.transport,
    isOpen: state.suite.deviceMenuOpened,
});

export default connect(
    mapStateToProps,
    dispatch => ({
        selectDevice: bindActionCreators(selectDevice, dispatch),
        forgetDevice: bindActionCreators(forgetDevice, dispatch),
        toggleDeviceMenu: bindActionCreators(toggleDeviceMenu, dispatch),
    }),
)(DeviceMenu);
