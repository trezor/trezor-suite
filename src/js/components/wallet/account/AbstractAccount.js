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

    componentWillUnmount() {
        this.props.disposeAccount();
    }

    render(state: any): any {

        const props = this.props;

        if (!state.deviceState) {
            return (<section></section>);
        }
    
        const device = this.props.devices.find(d => d.state === state.deviceState);
        if (!device) {
            return (<section>Device with state {state.deviceState} not found</section>);
        }
        const discovery = props.discovery.find(d => d.deviceState === device.state && d.network === state.network);
        const account = props.accounts.find(a => a.deviceState === state.deviceState && a.index === state.accountIndex && a.network === state.network);

        if (!account) {
            if (!discovery || discovery.waitingForDevice) {
                return (
                    <section>
                        <Notification 
                            className="info" 
                            title="Loading account" 
                            message=""
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