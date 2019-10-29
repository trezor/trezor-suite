import React, { useState, useEffect, useRef } from 'react';
import { Translation } from '@suite-components/Intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled, { css } from 'styled-components';
import * as suiteActions from '@suite-actions/suiteActions';
import { colors, variables, animations, Tooltip, Icon } from '@trezor/components';
import DeviceItem from '@suite-components/DeviceMenu/components/DeviceItem';
import * as deviceUtils from '@suite-utils/device';
import WebusbButton from '@suite-components/WebusbButton';
import MenuItems from './components/MenuItems';
import DeviceList from './components/DeviceList';
import l10nMessages from './index.messages';
import { AppState, Dispatch, AcquiredDevice } from '@suite-types';

const { FONT_SIZE, FONT_WEIGHT } = variables;
const { SLIDE_DOWN } = animations;

const Wrapper = styled.div<Omit<WrapperProps, 'additionalDeviceMenuItems'>>`
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

const WalletIconWrapper = styled.div`
    padding-top: 1px;
    margin: 0 6px;
`;

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

const mapStateToProps = (state: AppState) => ({
    devices: state.devices,
    selectedDevice: state.suite.device,
    transport: state.suite.transport,
    isOpen: state.suite.deviceMenuOpened,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    selectDevice: bindActionCreators(suiteActions.selectDevice, dispatch),
    requestForgetDevice: bindActionCreators(suiteActions.requestForgetDevice, dispatch),
    toggleDeviceMenu: bindActionCreators(suiteActions.toggleDeviceMenu, dispatch),
});

type Props = {
    disabled?: boolean;
    isOpen: boolean;
    isSelected?: boolean;
    additionalDeviceMenuItems: React.ReactNode;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

type WrapperProps = Omit<
    Props,
    | 'onSelect'
    | 'devices'
    | 'selectedDevice'
    | 'selectDevice'
    | 'requestForgetDevice'
    | 'device'
    | 'toggleDeviceMenu'
    | 'transport'
>;

const DeviceMenu = ({
    devices,
    selectedDevice,
    disabled = false,
    isSelected = false,
    selectDevice,
    requestForgetDevice,
    toggleDeviceMenu,
    transport,
    isOpen = false,
    additionalDeviceMenuItems,
    ...rest
}: Props) => {
    const [isAnimated, setIsAnimated] = useState(false);
    const [animationFinished, setAnimationFinished] = useState(false);

    // hooks managing closing the menu on click outside of the menu
    const ref = useRef<HTMLDivElement>(null);
    const handleClickOutside = (event: any) => {
        if (ref.current && !ref.current.contains(event.target)) {
            toggleDeviceMenu(false);
        }
    };

    const deviceMenuRef = useRef<HTMLDivElement>(null);

    const onAnimationEnd = () => {
        setTimeout(() => setAnimationFinished(true), 1);
        if (deviceMenuRef.current) {
            deviceMenuRef.current.removeEventListener('animationend', onAnimationEnd, true);
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('click', handleClickOutside, true);

            if (deviceMenuRef.current) {
                deviceMenuRef.current.addEventListener('animationend', onAnimationEnd, true);
            }
        } else {
            setAnimationFinished(false);
            document.removeEventListener('click', handleClickOutside, true);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!selectedDevice) return null; // TODO: can it happen? if so some placeholder would be better
    // answer: it could happen during onboarding process (waiting for device to reconnect)
    // however device menu is not displayed in onboarding...
    // to avoid rendering error do some placeholder "Device not selected"

    const selectedDeviceAccessible = deviceUtils.isDeviceAccessible(selectedDevice);
    const selectedInstances = deviceUtils.getDeviceInstances(selectedDevice, devices);
    const otherDevices = deviceUtils.getOtherDevices(selectedDevice, devices);
    const otherInstances: AcquiredDevice[][] = [];
    otherDevices.forEach(d => otherInstances.push(deviceUtils.getDeviceInstances(d, devices)));
    const multipleDevices = otherDevices.length > 0;
    const showWalletType = !!selectedDevice.instance;

    return (
        <Wrapper
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
                data-test="@suite/device-item-selected"
                icon={
                    <React.Fragment>
                        {showWalletType && (
                            // <Tooltip
                            //     content={
                            //         <WalletTooltipMsg
                            //             walletType={walletType}
                            //             isDeviceReady={isDeviceReady}
                            //         />
                            //     }
                            //     maxWidth={200}
                            //     placement="bottom"
                            //     delay={500}
                            // >
                            <WalletIconWrapper>
                                <Icon icon="WALLET_HIDDEN" size={16} />
                            </WalletIconWrapper>
                            // </Tooltip>
                        )}
                        {multipleDevices && (
                            <Tooltip
                                content={
                                    <Translation>{l10nMessages.TR_NUMBER_OF_DEVICES}</Translation>
                                }
                                maxWidth={200}
                                placement="bottom"
                                delay={500}
                            >
                                <DeviceIconWrapper>
                                    <Counter>{otherDevices.length + 1}</Counter>
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
                            <Link to={getPattern('wallet-settings')} variant="nostyle">
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
                <Menu ref={deviceMenuRef}>
                    {selectedDeviceAccessible && (
                        <MenuItems
                            additionalDeviceMenuItems={additionalDeviceMenuItems}
                            device={selectedDevice as AcquiredDevice}
                            instances={selectedInstances}
                        />
                    )}
                    {multipleDevices && <StyledDivider>Other devices</StyledDivider>}
                    <DeviceList
                        devices={otherDevices}
                        instances={otherInstances}
                        selectDevice={selectDevice}
                        requestForgetDevice={requestForgetDevice}
                    />
                    {deviceUtils.isWebUSB(transport) && (
                        <ButtonWrapper>
                            <WebusbButton ready={animationFinished} />
                        </ButtonWrapper>
                    )}
                </Menu>
            )}
        </Wrapper>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DeviceMenu);
