import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Translation, TrezorLink } from '@suite-components';
import { Modal, Button, variables } from '@trezor/components';
import { OnOffSwitcher } from '@wallet-components';
import { WalletAccountTransaction } from '@wallet-types';
import TrezorConnect from 'trezor-connect';
import BasicDetails from './components/BasicDetails';
import AdvancedDetails from './components/AdvancedDetails';
import ChangeFee from './components/ChangeFee';
import { getNetwork } from '@wallet-utils/accountUtils';
import { getConfirmations } from '@wallet-utils/transactionUtils';
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
    const blockchain = useSelector(state => state.wallet.blockchain[tx.symbol]);
    const confirmations = getConfirmations(tx, blockchain.blockHeight);

    const network = getNetwork(tx.symbol);
    const explorerBaseUrl = network?.explorer.tx;
    const explorerUrl = explorerBaseUrl ? `${explorerBaseUrl}${tx.txid}` : undefined;

    // txDetails stores response from blockchainGetTransactions()
    const [txDetails, setTxDetails] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(true);

    const [section, setSection] = useState<'CHANGE_FEE' | 'DETAILS'>(
        props.rbfForm ? 'CHANGE_FEE' : 'DETAILS',
    );
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
        // TODO add Bitcoin logo to the header of the modal or somewhere else (discuss with designer)
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
                                <Button variant="tertiary" onClick={() => setSection('CHANGE_FEE')}>
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
                    <ChangeFee tx={tx} finalize={finalize} />
                ) : (
                    <AdvancedDetails
                        network={network!}
                        tx={tx}
                        txDetails={txDetails}
                        isFetching={isFetching}
                    />
                )}
            </Wrapper>
        </Modal>
    );
};

export default TransactionDetail;
