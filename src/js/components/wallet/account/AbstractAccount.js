/* @flow */
'use strict';

import React, { Component } from 'react';
import { Notification } from '../../common/Notification';

export default class AbstractAccount extends Component {

    componentDidMount() {
        this.props.initAccount();
    }

    componentWillUpdate(newProps: any) {
        this.props.updateAccount();
    }

    // shouldInitAccount(newProps: any): boolean {
    //     const locationChanged: boolean = newProps.location.pathname !== this.props.location.pathname;
    //     const accountNotLoaded: boolean = !newProps.detail.loaded && !this.props.detail.loaded;
    //     return (locationChanged || accountNotLoaded);
    // }

    // shouldUpdateAccount(newProps: any): boolean {
    //     const { detail } = this.props;
    //     const loaded: boolean = detail.loaded;

    //     if (detail.address === '') {
    //         const currentAccount = this.props.accounts.find(a => a.index === detail.addressIndex && a.coin === detail.coin && a.checksum === detail.checksum);

    //     }
        
        
    //    // return (loaded && );
    // }

    componentWillUnmount() {
        this.props.disposeAccount();
    }

    render(state: any): any {

        const props = this.props;

        if (!state.checksum) {
            return (<section></section>);
        }
    
        const device = this.props.devices.find(d => d.checksum === state.checksum);
        const discovery = props.discovery.find(d => d.checksum === device.checksum && d.coin === state.coin);
        const account = props.accounts.find(a => a.checksum === state.checksum && a.index === state.accountIndex && a.coin === state.coin);

        if (!account) {
            if (!discovery || discovery.waitingForDevice) {
                return (
                    <section>
                        <Notification 
                            className="info" 
                            title="Account is not loaded yet" 
                            message={ `Connect ${ device.instanceLabel } device to continue` }
                             />
                    </section>
                );
            } else if (discovery.completed) {
                return (
                    <section>
                        <Notification className="warning" title="Account is not exist" />
                    </section>
                );
            } else {
                return (
                    <section>
                        <Notification className="info" title="Account is loading..." />
                    </section>
                );
            }
        }

        return null;
    }
}