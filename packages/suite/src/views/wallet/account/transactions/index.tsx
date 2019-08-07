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
    const { params } = props.router;
    // todo: commented out for typescript
    // const { pathname, params } = props.router;
    // const baseUrl = `${pathname}#/${params.coin}/`;
    return (
        <LayoutAccount>
            <Text>
                {params.coin} Account {params.accountId} Transactions
            </Text>
            <Loader />
            <Button
                variant="info"
                onClick={() => {
                    props.getFromStorage(parseInt(params.accountId, 10), 10, 20);
                }}
            >
                Get from storage (10 to 20)
            </Button>
            <Button
                variant="info"
                onClick={() => {
                    props.getFromStorage(parseInt(params.accountId, 10), 10);
                }}
            >
                Get from storage (10 and up)
            </Button>
            <Button
                variant="info"
                onClick={() => {
                    props.getFromStorage(parseInt(params.accountId, 10), undefined, 10);
                }}
            >
                Get from storage (10 and down)
            </Button>
            <Button
                variant="info"
                onClick={() => {
                    props.getFromStorage(parseInt(params.accountId, 10));
                }}
            >
                Get from storage for acc 0
            </Button>
            <Button
                onClick={() => {
                    props.add({
                        accountId: parseInt(params.accountId, 10),
                        timestamp: Date.now(),
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
                    const addTx = () => {
                        props.add({
                            accountId: parseInt(params.accountId, 10),
                            timestamp: Date.now(),
                            txId: Math.random()
                                .toString(36)
                                .substring(7),
                            details: {
                                name: 'label',
                                price: 2,
                                productCode: 'code',
                            },
                        });
                        // setTimeout(addTx, 100);
                    };
                    addTx();
                }}
            >
                Add random tx to selected acc ({params.accountId})
            </Button>
            <Button
                onClick={() => {
                    const addTx = () => {
                        props.add({
                            accountId: Math.floor(Math.random() * 4),
                            timestamp: Date.now(),
                            txId: Math.random()
                                .toString(36)
                                .substring(7),
                            details: {
                                name: 'label',
                                price: 2,
                                productCode: 'code',
                            },
                        });
                        // setTimeout(addTx, 100);
                    };
                    addTx();
                }}
            >
                Add random tx to random acc (0-4)
            </Button>

            {props.wallet.transactions.map(tx => {
                return (
                    <TxWrapper key={tx.id}>
                        {JSON.stringify(tx)}
                        <Button
                            onClick={() => {
                                props.remove(tx.txId);
                            }}
                            variant="error"
                        >
                            X
                        </Button>
                        <Button
                            onClick={() => {
                                props.update(tx.txId);
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
