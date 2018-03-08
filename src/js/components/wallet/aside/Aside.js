/* @flow */
'use strict';

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import { DeviceSelect, DeviceDropdown } from './DeviceSelection';
import AccountSelection from './AccountSelection';
import CoinSelection from './CoinSelection';
import StickyContainer from './StickyContainer';
import { findSelectedDevice } from '../../../reducers/TrezorConnectReducer';

const TransitionMenu = (props: any) => {
    return (
        <TransitionGroup component="div" className="transition-container">
            <CSSTransition 
                key={ props.animationType }
                onExit= { () => { window.dispatchEvent( new Event('resize') ) } }
                onExited= { () => window.dispatchEvent( new Event('resize') ) }
                in={ true }
                out={ true }
                classNames={ props.animationType }
                appear={false}
                timeout={ 300 }>
                { props.children }
            </CSSTransition>
        </TransitionGroup>
    )
}

const Aside = (props: any): any => {

    const selected = findSelectedDevice(props.connect);
    const { location } = props.router;

    if (location.pathname === '/' || !selected) return (<aside></aside>);

    // TODO
    // if (selectedDevice.unacquired) {
    //     return (
    //         <aside>
    //             <div className="transition-container"></div>
    //             <a className="help" href="https://trezor.io/support/" target="_blank" rel="noreferrer noopener">
    //                 Need help?
    //             </a>
    //         </aside>
    //     );
    // }

    let menu = null;
    
    if (props.deviceDropdownOpened) {
        menu = <DeviceDropdown {...props} />;
    } else if (location.params.coin) {
        menu = (
            <TransitionMenu animationType={"slide-left"}>
                <AccountSelection { ...props} />
            </TransitionMenu>
        );
    } else if (!selected.unacquired) {
        menu = (
            <TransitionMenu animationType={"slide-right"}>
                <CoinSelection { ...props} />
            </TransitionMenu>
        );
    }

    return (
        <StickyContainer location={ location } devices={ props.deviceDropdownOpened.toString() }>
            <DeviceSelect {...props} />
            { menu }
            <div className="help">
                <a href="https://trezor.io/support/" target="_blank" rel="noreferrer noopener">Need help?</a>
            </div>
        </StickyContainer>
    )
}

export default Aside;