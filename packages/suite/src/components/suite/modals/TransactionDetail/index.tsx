import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Translation, Modal, TrezorLink } from '@suite-components';
import { variables, Button } from '@trezor/components';
import { OnOffSwitcher } from '@wallet-components';
import { WalletAccountTransaction } from '@wallet-types';
import TrezorConnect from 'trezor-connect';
import BasicDetails from './components/BasicDetails';
import AdvancedDetails, { TabID } from './components/AdvancedDetails';
import ChangeFee from './components/ChangeFee';
import { getNetwork } from '@wallet-utils/accountUtils';
import {
    getConfirmations,
    isPending,
    findChainedTransactions,
} from '@wallet-utils/transactionUtils';
import { useSelector } from '@suite-hooks';

const Wrapper = styled.div`
    width: 100%;
    flex-direction: column;
`;

const SectionActions = styled.div`
    position: relative;
    padding: 15px 0 0;
    display: flex;
    justify-content: flex-end;
    & > * + * {
        margin-left: 12px;
    }
`;

const SectionTitle = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    text-transform: uppercase;
    position: absolute;
    top: 18px;
    left: 0;
`;

type Props = {
    tx: WalletAccountTransaction;
    rbfForm?: boolean;
    onCancel: () => void;
};

const TransactionDetail = (props: Props) => {
    const { tx } = props;
    const { blockchain, transactions } = useSelector(state => ({
        blockchain: state.wallet.blockchain[tx.symbol],
        transactions: state.wallet.transactions.transactions,
    }));
    const confirmations = getConfirmations(tx, blockchain.blockHeight);
    // TODO: replace this part will be refactored after blockbook implementation:
    // https://github.com/trezor/blockbook/issues/555
    // currently we are showing only txs related to this account
    // const chainedTxs =  findChainedTransactions(tx.txid, transactions) : [];
    const chainedTxs = isPending(tx)
        ? findChainedTransactions(tx.txid, transactions)
              .filter(t => t.key.indexOf(tx.descriptor) >= 0) // only for this account (this will change)
              .reduce((result, item) => {
                  return result.concat(item.txs); // transforming results into array
              }, [] as WalletAccountTransaction[])
        : [];

    const network = getNetwork(tx.symbol);
    const explorerBaseUrl = network?.explorer.tx;
    const explorerUrl = explorerBaseUrl ? `${explorerBaseUrl}${tx.txid}` : undefined;

    // txDetails stores response from blockchainGetTransactions()
    const [txDetails, setTxDetails] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(true);

    const [section, setSection] = useState<'CHANGE_FEE' | 'DETAILS'>(
        props.rbfForm ? 'CHANGE_FEE' : 'DETAILS',
    );
    const [tab, setTab] = useState<TabID | undefined>(undefined);
    const [finalize, setFinalize] = useState<boolean>(false);

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
        <Modal
            cancelable
            onCancel={props.onCancel}
            fixedWidth={['100vw', '90vw', '755px', '755px']}
            contentPaddingSide={['8px', '21px', '21px', '21px']}
            heading={<Translation id="TR_TRANSACTION_DETAILS" />}
        >
            <Wrapper>
                <BasicDetails tx={tx} isFetching={isFetching} confirmations={confirmations} />
                <SectionActions>
                    {section === 'CHANGE_FEE' && (
                        <SectionTitle>
                            <Translation id={finalize ? 'TR_FINALIZE_TX' : 'TR_REPLACE_TX'} />
                        </SectionTitle>
                    )}
                    {tx.rbfParams && (
                        <>
                            {section === 'DETAILS' && (
                                <Button
                                    variant="tertiary"
                                    onClick={() => {
                                        setSection('CHANGE_FEE');
                                        setTab(undefined);
                                    }}
                                >
                                    <Translation id="TR_BUMP_FEE" />
                                </Button>
                            )}
                            <Button
                                variant="tertiary"
                                icon="RBF"
                                onClick={() => {
                                    setFinalize(!finalize);
                                    if (section !== 'CHANGE_FEE') {
                                        setSection('CHANGE_FEE');
                                        setTab(undefined);
                                    }
                                }}
                            >
                                <Translation id="RBF" />
                                <OnOffSwitcher isOn={!finalize} />
                            </Button>
                            {section === 'CHANGE_FEE' && (
                                <Button
                                    variant="tertiary"
                                    onClick={() => {
                                        setSection('DETAILS');
                                        setFinalize(false);
                                        setTab(undefined);
                                    }}
                                >
                                    <Translation id="TR_CANCEL" />
                                </Button>
                            )}
                        </>
                    )}
                    {explorerUrl && section === 'DETAILS' && (
                        <TrezorLink variant="nostyle" href={explorerUrl}>
                            <Button variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                                <Translation id="TR_OPEN_IN_BLOCK_EXPLORER" />
                            </Button>
                        </TrezorLink>
                    )}
                </SectionActions>
                {section === 'CHANGE_FEE' ? (
                    <ChangeFee
                        tx={tx}
                        finalize={finalize}
                        chainedTxs={chainedTxs}
                        showChained={() => {
                            setSection('DETAILS');
                            setTab('chained');
                        }}
                    />
                ) : (
                    <AdvancedDetails
                        defaultTab={tab}
                        network={network!}
                        tx={tx}
                        txDetails={txDetails}
                        isFetching={isFetching}
                        chainedTxs={chainedTxs}
                    />
                )}
            </Wrapper>
        </Modal>
    );
};

export default TransactionDetail;
