import React from 'react';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { State } from '@suite-types/index';
import Content from '@wallet-components/Content';
import LayoutAccount from '@wallet-components/LayoutAccount';

interface Props {
    suite: State['suite'];
    router: State['router'];
}

const Transactions = (props: Props) => {
    const { params } = props.router;
    // todo: commented out for typescript
    // const { pathname, params } = props.router;
    // const baseUrl = `${pathname}#/${params.coin}/`;
    return (
        <LayoutAccount>
            <Content>
                <Text>
                    {params.coin} Account {params.accountId} Transactions
                </Text>
            </Content>
        </LayoutAccount>
    );
};

const mapStateToProps = (state: State) => ({
    suite: state.suite,
    router: state.router,
});

export default connect(mapStateToProps)(Transactions);
