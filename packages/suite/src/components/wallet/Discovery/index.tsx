import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { View } from 'react-native';
import { AppState, Dispatch } from '@suite-types/index';
import { Button } from '@trezor/components';
import { STATUS as DISCOVERY_STATUS } from '@wallet-reducers/discoveryReducer';
import * as DiscoveryActions from '@wallet-actions/discoveryActions';

interface Props {
    discovery: AppState['wallet']['discovery'];
    accounts: AppState['wallet']['accounts'];
    stop: any;
    start: any;
}

const AccountDiscovery = (props: Props) => {
    const d = props.discovery[0];
    if (!d) return <Button onClick={props.start}>Start</Button>;

    return (
        <View>
            <Button onClick={props.start} isLoading>
                Start
            </Button>
            <Button onClick={props.stop} isInverse>
                Stop
            </Button>
            {d.status === DISCOVERY_STATUS.RUNNING && (
                <Button onClick={props.stop} isInverse>
                    Stop
                </Button>
            )}
        </View>
    );
};

const mapStateToProps = (state: AppState) => ({
    discovery: state.wallet.discovery,
    accounts: state.wallet.accounts,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    stop: bindActionCreators(DiscoveryActions.stop, dispatch),
    start: bindActionCreators(DiscoveryActions.start, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(AccountDiscovery);
