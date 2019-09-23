import React from 'react';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import LayoutAccount from '@wallet-components/LayoutAccount';
import { bindActionCreators } from 'redux';
import * as transactionActions from '@wallet-actions/transactionActions';
import { Button, Loader } from '@trezor/components';
import styled from 'styled-components';
import { AppState, Dispatch } from '@suite-types';

const TxWrapper = styled.div`
    display: flex;
    border-bottom: 1px solid #ccc;
`;

interface Props {
    suite: AppState['suite'];
    router: AppState['router'];
    wallet: AppState['wallet'];
    add: typeof transactionActions.add;
    remove: typeof transactionActions.remove;
    update: typeof transactionActions.update;
    getFromStorage: typeof transactionActions.getFromStorage;
}

const Transactions = (props: Props) => {
    const { app, params } = props.router;
    if (app !== 'wallet' || !params) return null;
    const { accountIndex } = params;
    // todo: commented out for typescript
    // const { pathname, params } = props.router;
    // const baseUrl = `${pathname}#/${params.coin}/`;
    return (
        <LayoutAccount>
            <Text>
                {params.symbol} Account {accountIndex} Transactions
            </Text>
            <Loader />
            <Button
                variant="info"
                onClick={() => {
                    props.getFromStorage(accountIndex, 10, 10);
                }}
            >
                Get from storage (offset 10, limit 10)
            </Button>
            <Button
                variant="info"
                onClick={() => {
                    props.getFromStorage(accountIndex, 10);
                }}
            >
                Get from storage (offset 10, limit undefined)
            </Button>
            <Button
                variant="info"
                onClick={() => {
                    props.getFromStorage(accountIndex, undefined, 10);
                }}
            >
                Get from storage (offset undefined, limit 10)
            </Button>
            <Button
                variant="info"
                onClick={() => {
                    props.getFromStorage(accountIndex);
                }}
            >
                Get from storage for acc 0
            </Button>

            {props.wallet.transactions.map(tx => {
                return (
                    <TxWrapper key={tx.id}>
                        {JSON.stringify(tx)}
                        <Button
                            onClick={() => {
                                props.remove(tx.txid);
                            }}
                            variant="error"
                        >
                            X
                        </Button>
                        <Button
                            onClick={() => {
                                props.update(tx.txid);
                            }}
                            variant="error"
                        >
                            update
                        </Button>
                    </TxWrapper>
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
    update: bindActionCreators(transactionActions.update, dispatch),
    getFromStorage: bindActionCreators(transactionActions.getFromStorage, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Transactions);
