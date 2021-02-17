import React, { useState } from 'react';
import styled from 'styled-components';
import { Translation, Modal } from '@suite-components';
import { variables, Button } from '@trezor/components';
import { WalletAccountTransaction } from '@wallet-types';
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
`;

const SectionTitle = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Col = styled.div`
    display: flex;
    flex: 1 1 33%;
`;

const Middle = styled(Col)`
    justify-content: center;
`;
const Right = styled(Col)`
    justify-content: flex-end;
    & > * + * {
        margin-left: 12px;
    }
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

    const [section, setSection] = useState<'CHANGE_FEE' | 'DETAILS'>(
        props.rbfForm ? 'CHANGE_FEE' : 'DETAILS',
    );
    const [tab, setTab] = useState<TabID | undefined>(undefined);
    const [finalize, setFinalize] = useState<boolean>(false);

    return (
        <Modal
            cancelable
            onCancel={props.onCancel}
            fixedWidth={['100vw', '90vw', '755px', '755px']}
            contentPaddingSide={['8px', '21px', '21px', '21px']}
            heading={<Translation id="TR_TRANSACTION_DETAILS" />}
        >
            <Wrapper>
                <BasicDetails tx={tx} network={network!} confirmations={confirmations} />
                <SectionActions>
                    {tx.rbfParams && (
                        <>
                            {section === 'CHANGE_FEE' && (
                                // Show back button and section title when bumping fee/finalizing txs
                                <>
                                    <Col>
                                        <Button
                                            variant="tertiary"
                                            onClick={() => {
                                                setSection('DETAILS');
                                                setFinalize(false);
                                                setTab(undefined);
                                            }}
                                            icon="ARROW_LEFT"
                                        >
                                            <Translation id="TR_BACK" />
                                        </Button>
                                    </Col>
                                    <Middle>
                                        <SectionTitle>
                                            <Translation
                                                id={finalize ? 'TR_FINALIZE_TX' : 'TR_REPLACE_TX'}
                                            />
                                        </SectionTitle>
                                    </Middle>
                                </>
                            )}

                            <Right>
                                {section === 'DETAILS' && (
                                    // change fee and finalize tx buttons visible only in details
                                    <>
                                        <Button
                                            variant="tertiary"
                                            onClick={() => {
                                                setSection('CHANGE_FEE');
                                                setTab(undefined);
                                            }}
                                        >
                                            <Translation id="TR_BUMP_FEE" />
                                        </Button>
                                        {network?.networkType === 'bitcoin' && (
                                            // finalize button only possible in BTC rbf
                                            <Button
                                                variant="tertiary"
                                                onClick={() => {
                                                    setFinalize(true);
                                                    setSection('CHANGE_FEE');
                                                    setTab(undefined);
                                                }}
                                            >
                                                <Translation id="TR_FINALIZE_TX" />
                                            </Button>
                                        )}
                                    </>
                                )}
                            </Right>
                        </>
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
                        chainedTxs={chainedTxs}
                    />
                )}
            </Wrapper>
        </Modal>
    );
};

export default TransactionDetail;
