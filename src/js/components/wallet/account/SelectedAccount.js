/* @flow */


import * as React from 'react';
import { Notification } from '~/js/components/common/Notification';

import type {
    State, TrezorDevice, Action, ThunkAction,
} from '~/flowtype';
import type { Account } from '~/js/reducers/AccountsReducer';
import type { Discovery } from '~/js/reducers/DiscoveryReducer';

export type StateProps = {
    className: string;
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    wallet: $ElementType<State, 'wallet'>,
    children?: React.Node
}

export type DispatchProps = {

}

export type Props = StateProps & DispatchProps;

const SelectedAccount = (props: Props) => {
    const device = props.wallet.selectedDevice;
    if (!device || !device.state) {
        return (<section><Notification className="info" title="Loading device..." /></section>);
    }

    const accountState = props.selectedAccount;

    const {
        account,
        discovery,
    } = accountState;

    // account not found (yet). checking why...
    if (!account) {
        if (!discovery || discovery.waitingForDevice) {
            if (device.connected) {
                // case 1: device is connected but discovery not started yet (probably waiting for auth)
                if (device.available) {
                    return (
                        <section>
                            <Notification className="info" title="Loading accounts..." />
                        </section>
                    );
                }
                // case 2: device is unavailable (created with different passphrase settings) account cannot be accessed
                return (
                    <section>
                        <Notification
                            className="info"
                            title={`Device ${device.instanceLabel} is unavailable`}
                            message="Change passphrase settings to use this device"
                        />
                    </section>
                );
            }
            // case 3: device is disconnected
            return (
                <section>
                    <Notification
                        className="info"
                        title={`Device ${device.instanceLabel} is disconnected`}
                        message="Connect device to load accounts"
                    />
                </section>
            );
        } if (discovery.waitingForBackend) {
            // case 4: backend is not working
            return (
                <section>
                    <Notification className="warning" title="Backend not working" />
                </section>
            );
        } if (discovery.completed) {
            // case 5: account not found and discovery is completed
            return (
                <section>
                    <Notification className="warning" title="Account does not exist" />
                </section>
            );
        }
        // case 6: discovery is not completed yet
        return (
            <section>
                <Notification className="info" title="Loading accounts..." />
            </section>
        );
    }

    let notification: ?React$Element<typeof Notification> = null;
    if (!device.connected) {
        notification = <Notification className="info" title={`Device ${device.instanceLabel} is disconnected`} />;
    } else if (!device.available) {
        notification = <Notification className="info" title={`Device ${device.instanceLabel} is unavailable`} message="Change passphrase settings to use this device" />;
    }

    if (discovery && !discovery.completed && !notification) {
        notification = <Notification className="info" title="Loading accounts..." />;
    }

    return (
        <section className={props.className}>
            { notification }
            { props.children }
        </section>
    );
};

export default SelectedAccount;