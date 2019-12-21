import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Text, View, ScrollView } from 'react-native';

import Layout from '@suite-components/Layout';
import * as routerActions from '@suite-actions/routerActions';

import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    accounts: state.wallet.accounts,
    selectedAccount: state.wallet.selectedAccount,
    router: state.router,
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

    const accountIdFromReducer = props.router.params
        ? JSON.stringify(props.router.params)
        : 'unknown';

    return (
        <View>
            <Text>{accountIdFromReducer}</Text>
            <Layout title="Wallet" disableTabs>
                <Text>Account transactions</Text>
                {accounts}
            </Layout>
        </View>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Wallet);
