/* @flow */


//import React, { Node } from 'react';
import * as React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import { DeviceSelect, DeviceDropdown } from './DeviceSelection';
import AccountSelection from './AccountSelection';
import CoinSelection from './CoinSelection';
import StickyContainer from './StickyContainer';

import type { Props } from './index';
import type { TrezorDevice } from '~/flowtype';


type TransitionMenuProps = {
    animationType: string;
    children?: React.Node;
}

const TransitionMenu = (props: TransitionMenuProps): React$Element<TransitionGroup> => (
    <TransitionGroup component="div" className="transition-container">
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
            { props.children }
        </CSSTransition>
    </TransitionGroup>
);

const Aside = (props: Props): React$Element<typeof StickyContainer | string> => {
    const selected: ?TrezorDevice = props.wallet.selectedDevice;
    const { location } = props.router;

    if (location.pathname === '/' || !selected) return (<aside />);

    let menu = <section />;

    if (props.deviceDropdownOpened) {
        menu = <DeviceDropdown {...props} />;
    } else if (location.state.network) {
        menu = (
            <TransitionMenu animationType="slide-left">
                <AccountSelection {...props} />
            </TransitionMenu>
        );
    } else if (selected.features && !selected.features.bootloader_mode && selected.features.initialized) {
        menu = (
            <TransitionMenu animationType="slide-right">
                <CoinSelection {...props} />
            </TransitionMenu>
        );
    }

    return (
        <StickyContainer location={location.pathname} deviceSelection={props.deviceDropdownOpened}>
            <DeviceSelect {...props} />
            { menu }
            <div className="sticky-bottom">
                <div className="help">
                    <a href="https://trezor.io/support/" target="_blank" rel="noreferrer noopener">Need help?</a>
                </div>
            </div>
        </StickyContainer>
    );
};

export default Aside;
