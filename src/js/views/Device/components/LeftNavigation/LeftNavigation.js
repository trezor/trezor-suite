/* @flow */
import * as React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import styled from 'styled-components';

import type { TrezorDevice } from 'flowtype';
import { DeviceSelect, DeviceDropdown } from './selection/DeviceSelection';
import AccountSelection from './selection/AccountSelection';
import CoinSelection from './selection/CoinSelection';
import StickyContainer from './StickyContainer';

import type { Props } from './index';

type TransitionMenuProps = {
    animationType: string;
    children?: React.Node;
}

const TransitionGroupWrapper = styled(TransitionGroup)`
    width: 640px;
`;
const TransitionContentWrapper = styled.div`
    width: 320px;
    display: inline-block;
    vertical-align: top;
`;

const TransitionMenu = (props: TransitionMenuProps): React$Element<TransitionGroup> => {
    return (
        <TransitionGroupWrapper component="div" className="transition-container">
            <CSSTransition
                key={props.animationType}
                onExit={() => { window.dispatchEvent(new Event('resize')); }}
                onExited={() => window.dispatchEvent(new Event('resize'))}
                in
                out
                classNames={props.animationType}
                appear={false}
                timeout={300}
            >
                <TransitionContentWrapper>
                    {props.children}
                </TransitionContentWrapper>
            </CSSTransition>
        </TransitionGroupWrapper>
    );
};


const LeftNavigation = (props: Props): React$Element<typeof StickyContainer | string> => {
    const selected: ?TrezorDevice = props.wallet.selectedDevice;
    const { location } = props.router;

    if (location.pathname === '/' || !selected) return (<aside />);

    let menu = <section />;

    let shouldRenderDeviceSelection = false;
    // let shouldRenderCoins = false;
    // let shouldRenderAccounts = false;

    let animationType = '';
    if (props.deviceDropdownOpened) {
        shouldRenderDeviceSelection = true;
        // menu = <DeviceDropdown {...props} />;
    } else if (location.state.network) {
        // shouldRenderAccounts = true;
        shouldRenderDeviceSelection = false;
        animationType = 'slide-left';
        // menu = (
        //     <TransitionMenu animationType="slide-left">
        //         <AccountSelection {...props} />
        //     </TransitionMenu>
        // );
    } else if (selected.features && !selected.features.bootloader_mode && selected.features.initialized) {
        // shouldRenderCoins = true;
        shouldRenderDeviceSelection = false;
        animationType = 'slide-right';
        // menu = (
        //     <TransitionMenu animationType="slide-right">
        //         <CoinSelection {...props} />
        //     </TransitionMenu>
        // );
    }

    return (
        <StickyContainer location={location.pathname} deviceSelection={props.deviceDropdownOpened}>
            <DeviceSelect {...props} />
            {/* { menu } */}

            {shouldRenderDeviceSelection ? (
                <DeviceDropdown {...props} />
            ) : (
                <TransitionMenu
                    animationType={animationType}
                >
                    {animationType === 'slide-left' && <AccountSelection key="accounts" {...props} />}
                    {animationType === 'slide-right' && <CoinSelection key="coins" {...props} />}
                </TransitionMenu>
            )}


            <div className="sticky-bottom">
                <div className="help">
                    <a href="https://trezor.io/support/" target="_blank" rel="noreferrer noopener">Need help?</a>
                </div>
            </div>
        </StickyContainer>
    );
};

export default LeftNavigation;
