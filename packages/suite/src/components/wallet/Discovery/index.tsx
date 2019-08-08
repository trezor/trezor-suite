import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { View } from 'react-native';
import { AppState, Dispatch } from '@suite-types/index';
import { H4, P, Button } from '@trezor/components';
import { STATUS } from '@wallet-reducers/discoveryReducer';
import * as DiscoveryActions from '@wallet-actions/discoveryActions';

interface Props {
    discovery: AppState['wallet']['discovery'];
    accounts: AppState['wallet']['accounts'];
    stop: any;
    start: any;
}

const printAccounts = (a: any) => {
    let prev = -1;
    return a.map((account: any, i: any) => {
        let accountHeader = null;
        if (account.index !== prev) {
            prev = account.index;
            accountHeader = <H4>Account#{account.index + 1}:</H4>;
        }
        const key = `${account.path}${account.network}${i}`;
        const accountType = account.type !== 'normal' ? `(${account.type}) ` : '';
        return (
            <View key={key}>
                {accountHeader}
                <P>
                    {account.network.toUpperCase()} {accountType}balance: {account.balance};{' '}
                    {account.history.total} txs
                </P>
            </View>
        );
    });
};

const AccountDiscovery = (props: Props) => {
    const d = props.discovery[0];
    if (!d) return <Button onClick={props.start}>Start</Button>;

    const perc = Math.round((d.loaded / d.total) * 100);
    // const isStartVisible = d.status;
    // const isRunning = d.status === STATUS.IDLE || STATUS.STOPPED;
    return (
        <View>
            <Button onClick={props.start} isLoading>
                Start
            </Button>
            <Button onClick={props.stop} isInverse>
                Stop
            </Button>
            {/* {d.status !== STATUS.RUNNING && (
                
            )} */}
            {d.status === STATUS.RUNNING && (
                <Button onClick={props.stop} isInverse>
                    Stop
                </Button>
            )}
            <P>Progress: {perc}%</P>
            {printAccounts(props.accounts)}
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
