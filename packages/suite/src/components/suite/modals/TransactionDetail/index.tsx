import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Translation } from '@suite-components';

import { Modal, colors, variables } from '@trezor/components';
import { AppState } from '@suite-types';
import { WalletAccountTransaction } from '@wallet-types';
import TrezorConnect from 'trezor-connect';
import BasicDetails from './components/BasicDetails';
import IODetails from './components/IODetails';
import AmountDetails from './components/AmountDetails';
import BigNumber from 'bignumber.js';
import { formatNetworkAmount, isTestnet, getNetwork } from '@wallet-utils/accountUtils';
import { useSelector } from '@suite-hooks';

const Wrapper = styled.div`
    width: 100%;
    flex-direction: column;
`;

const TabSelector = styled.div`
    width: 100%;
    text-align: left;
    margin-bottom: 6px;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const TabButton = styled.button<{ selected: boolean }>`
    border: none;
    background-color: inherit;
    font-size: ${variables.NEUE_FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding-top: 12px;
    padding-bottom: 12px;
    margin-right: 40px;
    cursor: pointer;
    /* change styles if the button is selected*/
    color: ${props => (props.selected ? `${colors.NEUE_TYPE_GREEN}` : `${colors.BLACK50}`)};
    border-bottom: ${props => (props.selected ? `2px solid ${colors.NEUE_BG_GREEN}` : 'none')};
`;

const AdvancedDetailsWrapper = styled.div`
    padding: 24px 24px 14px 24px;
`;

const mapStateToProps = (state: AppState) => ({
    fiat: state.wallet.fiat,
});

interface TabProps {
    tabSelected: 'amount' | 'io';
}

type Props = {
    tx: WalletAccountTransaction;
    onCancel: () => void;
} & ReturnType<typeof mapStateToProps>;

const TransactionDetail = (props: Props) => {
    const [selectedTab, setSelectedTab] = useState<TabProps['tabSelected']>('amount');

    const { tx } = props;
    const blockchain = useSelector(state => state.wallet.blockchain[tx.symbol]);
    const confirmations =
        tx.blockHeight && tx.blockHeight > 0 ? blockchain.blockHeight - tx.blockHeight + 1 : 0;

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
        // TODO add Bitcoin logo to the header of the modal or somewhere else (discuss with designer)
        <Modal
            cancelable
            onCancel={props.onCancel}
            fixedWidth={['100vw', '90vw', '755px', '755px']}
            contentPaddingSide={['8px', '21px', '21px', '21px']}
            heading={<Translation id="TR_TRANSACTION_DETAILS" />}
        >
            <Wrapper>
                <BasicDetails
                    tx={tx}
                    isFetching={isFetching}
                    explorerUrl={explorerUrl}
                    totalInput={formattedTotalInput}
                    totalOutput={formattedTotalOutput}
                    confirmations={confirmations}
                />
                <AdvancedDetailsWrapper>
                    <TabSelector>
                        <TabButton
                            selected={selectedTab === 'amount'}
                            onClick={() => {
                                setSelectedTab('amount');
                            }}
                        >
                            Amount
                        </TabButton>
                        {network?.networkType !== 'ripple' && (
                            <TabButton
                                selected={selectedTab === 'io'}
                                onClick={() => {
                                    setSelectedTab('io');
                                }}
                            >
                                Inputs, Outputs
                            </TabButton>
                        )}
                    </TabSelector>

                    {selectedTab === 'amount' ? (
                        <AmountDetails
                            tx={tx}
                            totalInput={formattedTotalInput}
                            totalOutput={formattedTotalOutput}
                            txDetails={txDetails}
                            isFetching={isFetching}
                            isTestnet={isTestnet(tx.symbol)}
                        />
                    ) : (
                        network?.networkType !== 'ripple' && (
                            <IODetails tx={tx} txDetails={txDetails} isFetching={isFetching} />
                        )
                    )}
                </AdvancedDetailsWrapper>
            </Wrapper>
        </Modal>
    );
};

export default connect(mapStateToProps)(TransactionDetail);
