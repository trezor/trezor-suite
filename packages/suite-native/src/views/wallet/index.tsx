import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Text, View, ScrollView } from 'react-native';

import * as routerActions from '@suite-actions/routerActions';

import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    accounts: state.wallet.accounts,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Wallet = (props: Props) => {
    const accounts = props.accounts.map(a => (
        <View key={a.descriptor} style={{ borderWidth: 1, borderBottomColor: 'red' }}>
            <Text>{a.descriptor}</Text>
            <Text>{a.path}</Text>
            <Text>{a.balance}</Text>
            <Text>{a.symbol}</Text>
        </View>
    ));

    return (
        <ScrollView>
            <Text>wallet dashboard</Text>
            {accounts}
        </ScrollView>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Wallet);
