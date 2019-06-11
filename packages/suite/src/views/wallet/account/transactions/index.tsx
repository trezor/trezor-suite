import React from 'react';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { State } from '@suite-types/index';
import Layout from '@wallet-components/Layout';

interface Props {
    suite: State['suite'];
    router: State['router'];
}

const Transactions = (props: Props) => {
    const { pathname, params } = props.router;
    const baseUrl = `${pathname}#/${params.coin}/`;
    return (
        <Layout>
            <Text>
                {params.coin} Account {params.accountId} Transactions
            </Text>
        </Layout>
    );
};

const mapStateToProps = (state: State) => ({
    suite: state.suite,
    router: state.router,
});

export default connect(mapStateToProps)(Transactions);
