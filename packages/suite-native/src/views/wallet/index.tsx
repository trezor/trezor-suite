import React from 'react';
import { connect } from 'react-redux';
import { Text, View } from 'react-native';
import Layout from '@native-components/suite/Layout';
import { AppState } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    accounts: state.wallet.accounts,
    router: state.router,
});

type Props = ReturnType<typeof mapStateToProps>;

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

export default connect(mapStateToProps)(Wallet);
