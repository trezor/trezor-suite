import React from 'react';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { AppState, Dispatch } from '@suite-types/index';
import LayoutAccount from '@wallet-components/LayoutAccount';
import { bindActionCreators } from 'redux';
import * as transactionActions from '@wallet-actions/transactionActions';
import { Button } from '@trezor/components';

interface Props {
    suite: AppState['suite'];
    router: AppState['router'];
    wallet: AppState['wallet'];
    add: typeof transactionActions.add;
    remove: typeof transactionActions.remove;
}

const Transactions = (props: Props) => {
    const { params } = props.router;
    // todo: commented out for typescript
    // const { pathname, params } = props.router;
    // const baseUrl = `${pathname}#/${params.coin}/`;
    return (
        <LayoutAccount>
            <Text>
                {params.coin} Account {params.accountId} Transactions
            </Text>
            <Button
                onClick={() => {
                    props.add({
                        accountId: parseInt(params.accountId, 10),
                        txId: 'abc',
                        details: {
                            name: 'label',
                            price: 2,
                            productCode: 'code',
                        },
                    });
                }}
            >
                Add tx
            </Button>
            <Button
                onClick={() => {
                    props.add({
                        accountId: parseInt(params.accountId, 10),
                        txId: Math.random()
                            .toString(36)
                            .substring(7),
                        details: {
                            name: 'label',
                            price: 2,
                            productCode: 'code',
                        },
                    });
                }}
            >
                Add random tx
            </Button>

            {props.wallet.transactions.map(tx => {
                return (
                    <div>
                        {JSON.stringify(tx)}
                        <Button
                            onClick={() => {
                                props.remove(tx.txId);
                            }}
                            variant="error"
                        >
                            X
                        </Button>
                    </div>
                );
            })}
        </LayoutAccount>
    );
};

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    router: state.router,
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    add: bindActionCreators(transactionActions.add, dispatch),
    remove: bindActionCreators(transactionActions.remove, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Transactions);
