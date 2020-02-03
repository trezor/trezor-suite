import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
// import { bindActionCreators } from 'redux';
import styled from 'styled-components';
// import { Translation } from '@suite-components/Translation';
import { H2, Link, Button } from '@trezor/components-v2';
import { Dispatch } from '@suite-types';
import { WalletAccountTransaction } from '@suite/reducers/wallet/transactionReducer';
import TrezorConnect from 'trezor-connect';
import NETWORKS from '@wallet-config/networks';
import BasicDetails from './components/BasicDetails';
import FiatDetails from './components/FiatDetails';
import IODetails from './components/IODetails';

const Wrapper = styled.div`
    width: 100%;
    max-width: 720px;
    flex-direction: column;
`;

const Title = styled(H2)`
    margin-bottom: 20px;
`;

const Divider = styled.div`
    width: 100%;
    height: 20px;
`;

const Buttons = styled.div`
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-top: 40px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    // onScan: bindActionCreators(sendFormActions.onQrScan, dispatch),
});

type Props = {
    tx: WalletAccountTransaction;
    onCancel: () => void;
} & ReturnType<typeof mapDispatchToProps>;

const TransactionDetail = (props: Props) => {
    const { tx } = props;
    const explorerBaseUrl = NETWORKS.find(n => n.symbol === tx.symbol)?.explorer.tx;
    const explorerUrl = explorerBaseUrl ? `${explorerBaseUrl}${tx.txid}` : undefined;

    const [txDetails, setTxDetails] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        // fetch tx details and store them inside the local state 'txDetails'
        const fetchTxDetails = async () => {
            setIsFetching(true);
            // @ts-ignore
            const res = await TrezorConnect.blockchainGetTransactions({
                txs: [tx.txid],
                coin: tx.symbol,
            });

            if (res.success && res.payload.length > 0) {
                const txDetail = res.payload[0];
                setTxDetails(txDetail.tx);
            }
            setIsFetching(false);
        };

        fetchTxDetails();
    }, [tx]);

    return (
        <Wrapper>
            <Title>Transaction details</Title>
            <BasicDetails
                tx={tx}
                txDetails={txDetails}
                isFetching={isFetching}
                explorerUrl={explorerUrl}
            />
            <Divider />
            <FiatDetails tx={tx} />
            <Divider />
            <IODetails tx={tx} txDetails={txDetails} isFetching={isFetching} />
            <Buttons>
                <Button variant="secondary" onClick={() => props.onCancel()}>
                    Close
                </Button>
                <Button alignIcon="right" icon="EXTERNAL_LINK" variant="secondary">
                    <Link variant="nostyle" href={explorerUrl}>
                        Show details in Block Explorer
                    </Link>
                </Button>
            </Buttons>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(TransactionDetail);
