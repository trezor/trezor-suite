import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
// import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { Translation } from '@suite-components';

import ModalWrapper from '@suite-components/ModalWrapper';
import { H2, Link, Button } from '@trezor/components';
import { AppState } from '@suite-types';
import { WalletAccountTransaction } from '@wallet-types';
import TrezorConnect from 'trezor-connect';
import BasicDetails from './components/BasicDetails';
import FiatDetails from './components/FiatDetails';
import IODetails from './components/IODetails';
import BigNumber from 'bignumber.js';
import { formatNetworkAmount, isTestnet, getNetwork } from '@wallet-utils/accountUtils';

const Wrapper = styled(ModalWrapper)`
    width: 100%;
    max-width: 720px;
    flex-direction: column;
`;

const Title = styled(H2)`
    margin-bottom: 20px;
`;

const Divider = styled.div`
    display: flex;
    width: 100%;
    margin-bottom: 20px;
`;

const Buttons = styled.div`
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-top: 40px;
`;

const mapStateToProps = (state: AppState) => ({
    fiat: state.wallet.fiat,
});

type Props = {
    tx: WalletAccountTransaction;
    onCancel: () => void;
} & ReturnType<typeof mapStateToProps>;

const TransactionDetail = (props: Props) => {
    const { tx } = props;
    const network = getNetwork(tx.symbol);
    const explorerBaseUrl = network?.explorer.tx;
    const explorerUrl = explorerBaseUrl ? `${explorerBaseUrl}${tx.txid}` : undefined;

    // txDetails stores response from blockchainGetTransactions()
    const [txDetails, setTxDetails] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(true);

    // sum of all inputs
    const totalInput: BigNumber | undefined = txDetails?.vin?.reduce(
        (acc: BigNumber, input: any) => acc.plus(input.value),
        new BigNumber('0'),
    );

    console.log('totalInput', totalInput?.toFixed());

    // sum of all outputs
    const totalOutput: BigNumber | undefined = txDetails?.vout?.reduce(
        (acc: BigNumber, output: any) => acc.plus(output.value ?? 0),
        new BigNumber('0'),
    );

    // formatNetworkAmount returns "-1" in case of an error, thus can't be used in reduce above
    const formattedTotalInput =
        totalInput && !totalInput.isNaN()
            ? formatNetworkAmount(totalInput.toFixed(), tx.symbol)
            : undefined;
    const formattedTotalOutput =
        totalOutput && !totalOutput.isNaN()
            ? formatNetworkAmount(totalOutput.toFixed(), tx.symbol)
            : undefined;

    console.log('formattedTotalInput', formattedTotalInput);

    useEffect(() => {
        // fetch tx details and store them inside the local state 'txDetails'
        const fetchTxDetails = async () => {
            setIsFetching(true);
            const res = await TrezorConnect.blockchainGetTransactions({
                txs: [tx.txid],
                coin: tx.symbol,
            });

            if (res.success && res.payload.length > 0) {
                setTxDetails(res.payload[0].tx);
            }
            setIsFetching(false);
        };

        fetchTxDetails();
    }, [tx]);

    return (
        <Wrapper>
            <Title>
                <Translation id="TR_TRANSACTION_DETAILS" />
            </Title>

            <BasicDetails
                tx={tx}
                txDetails={txDetails}
                isFetching={isFetching}
                explorerUrl={explorerUrl}
                totalInput={formattedTotalInput}
                totalOutput={formattedTotalOutput}
            />
            <Divider />

            {!isTestnet(tx.symbol) && (
                <>
                    <FiatDetails tx={tx} totalOutput={formattedTotalOutput} />
                    <Divider />
                </>
            )}

            {network?.networkType !== 'ripple' && (
                <IODetails tx={tx} txDetails={txDetails} isFetching={isFetching} />
            )}

            <Buttons>
                <Button variant="secondary" onClick={() => props.onCancel()}>
                    <Translation id="TR_CLOSE" />
                </Button>
                <Button alignIcon="right" icon="EXTERNAL_LINK" variant="secondary">
                    <Link variant="nostyle" href={explorerUrl}>
                        <Translation id="TR_SHOW_DETAILS_IN_BLOCK_EXPLORER" />
                    </Link>
                </Button>
            </Buttons>
        </Wrapper>
    );
};

export default connect(mapStateToProps)(TransactionDetail);
