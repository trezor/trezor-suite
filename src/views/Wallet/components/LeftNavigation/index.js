import React, { Component } from 'react';
import PropTypes from 'prop-types';
import colors from 'config/colors';
import Icon from 'components/Icon';
import icons from 'config/icons';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import styled from 'styled-components';
import DeviceHeader from 'components/DeviceHeader';
import AccountMenu from './components/AccountMenu';
import CoinMenu from './components/CoinMenu';
import DeviceMenu from './components/DeviceMenu';
import StickyContainer from './components/StickyContainer';

const Header = styled(DeviceHeader)``;

const TransitionGroupWrapper = styled(TransitionGroup)`
    width: 640px;
`;

const TransitionContentWrapper = styled.div`
    width: 320px;
    display: inline-block;
    vertical-align: top;
`;

const Footer = styled.div`
    position: fixed;
    bottom: 0;
    background: ${colors.MAIN};
    border-right: 1px solid ${colors.DIVIDER};
`;

const Body = styled.div`
    overflow: auto;
    background: ${colors.LANDING};
`;

const Help = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 319px;
    padding: 8px 0px;
    border-top: 1px solid ${colors.DIVIDER};
`;

const A = styled.a`
    color: ${colors.TEXT_SECONDARY};
    font-size: 12px;
    display: inline-block;
    padding: 8px;
    height: auto;

    &:hover {
        background: transparent;
        color: ${colors.TEXT_PRIMARY};
    }
`;

class LeftNavigation extends Component {
    constructor(props) {
        super(props);
        this.state = {
            animationType: null,
            shouldRenderDeviceSelection: false,
        };
    }

    componentDidMount() {
        this.setState({
            animationType: null,
            shouldRenderDeviceSelection: false,
        });
    }

    componentWillReceiveProps(nextProps) {
        const { deviceDropdownOpened } = nextProps;
        const { selectedDevice } = nextProps.wallet;
        const hasNetwork = nextProps.location.state && nextProps.location.state.network;
        const hasFeatures = selectedDevice && selectedDevice.features;
        const deviceReady = hasFeatures && !selectedDevice.features.bootloader_mode && selectedDevice.features.initialized;

        if (deviceDropdownOpened) {
            this.setState({ shouldRenderDeviceSelection: true });
        } else if (hasNetwork) {
            this.setState({
                shouldRenderDeviceSelection: false,
                animationType: 'slide-left',
            });
        } else if (deviceReady) {
            this.setState({
                shouldRenderDeviceSelection: false,
                animationType: 'slide-right',
            });
        }
    }

    // TODO: refactor to transition component for reuse of transitions
    getMenuTransition(children) {
        return (
            <TransitionGroupWrapper component="div" className="transition-container">
                <CSSTransition
                    key={this.state.animationType}
                    onEnter={() => {
                        console.warn('ON ENTER');
                    }}
                    onEntering={() => {
                        console.warn('ON ENTERING (ACTIVE)');
                    }}
                    onExit={() => {
                        console.warn('ON EXIT');
                        window.dispatchEvent(new Event('resize'));
                    }}
                    onExiting={() => {
                        console.warn('ON EXITING (ACTIVE)');
                    }}
                    onExited={() => window.dispatchEvent(new Event('resize'))}
                    classNames={this.state.animationType}
                    appear={false}
                    timeout={30000}
                    in
                    out
                >
                    <TransitionContentWrapper>
                        {children}
                    </TransitionContentWrapper>
                </CSSTransition>
            </TransitionGroupWrapper>);
    }

    shouldRenderAccounts() {
        const { selectedDevice } = this.props.wallet;
        return selectedDevice
            && this.props.location
            && this.props.location.state
            && this.props.location.state.network
            && !this.state.shouldRenderDeviceSelection
            && this.state.animationType === 'slide-left';
    }

    handleOpen() {
        this.props.toggleDeviceDropdown(!this.props.deviceDropdownOpened);
    }

    shouldRenderCoins() {
        return !this.state.shouldRenderDeviceSelection && this.state.animationType === 'slide-right';
    }

    render() {
        return (
            <StickyContainer
                location={this.props.location.pathname}
                deviceSelection={this.props.deviceDropdownOpened}
            >
                <Header
                    onClickWrapper={() => this.handleOpen()}
                    device={this.props.wallet.selectedDevice}
                    transport={this.props.connect.transport}
                    devices={this.props.devices}
                    isOpen={this.props.deviceDropdownOpened}
                    {...this.props}
                />
                <Body>
                    {this.state.shouldRenderDeviceSelection && <DeviceMenu {...this.props} />}
                    {this.shouldRenderAccounts() && this.getMenuTransition(<AccountMenu {...this.props} />)}
                    {this.shouldRenderCoins() && this.getMenuTransition(<CoinMenu {...this.props} />)}
                </Body>
                <Footer className="sticky-bottom">
                    <Help>
                        <A
                            href="https://trezor.io/support/"
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            <Icon size={26} icon={icons.CHAT} color={colors.TEXT_SECONDARY} />Need help?
                        </A>
                    </Help>
                </Footer>
            </StickyContainer>
        );
    }
}

LeftNavigation.propTypes = {
    selectedDevice: PropTypes.object,
    wallet: PropTypes.object,
    deviceDropdownOpened: PropTypes.bool,
};


export default LeftNavigation;
