import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { Modal, Button, variables, useTheme } from '@trezor/components';
import { WalletAccountTransactionSection } from '@suite-actions/modalActions';
import { OnOffSwitcher } from '@wallet-components';
import { WalletAccountTransaction } from '@wallet-types';
import TrezorConnect from 'trezor-connect';
import BasicDetails from './components/BasicDetails';
import IODetails from './components/IODetails';
import AmountDetails from './components/AmountDetails';
import ChangeFee from './components/ChangeFee';
import { isTestnet, getNetwork } from '@wallet-utils/accountUtils';
import { getConfirmations } from '@wallet-utils/transactionUtils';
import { useSelector } from '@suite-hooks';
import { useReplaceTransaction } from '@wallet-hooks/useReplaceTransaction';

const Wrapper = styled.div`
    width: 100%;
    flex-direction: column;
`;

const TabSelector = styled.div`
    width: 100%;
    text-align: left;
    margin-bottom: 6px;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
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
    color: ${props =>
        props.selected ? `${props.theme.TYPE_GREEN}` : `${props.theme.TYPE_LIGHT_GREY}`};
    border-bottom: ${props => (props.selected ? `2px solid ${props.theme.BG_GREEN}` : 'none')};
`;

const AdvancedDetailsWrapper = styled.div`
    padding: 24px 24px 14px 24px;
`;

const ChangeFeeWrapper = styled.div`
    padding: 24px 0 14px;
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

interface TabProps {
    tabSelected: 'amount' | 'io';
}

type Props = {
    tx: WalletAccountTransaction;
    section: WalletAccountTransactionSection;
    onCancel: () => void;
};

const TransactionDetail = (props: Props) => {
    const [selectedTab, setSelectedTab] = useState<TabProps['tabSelected']>('amount');

    const { tx } = props;
    const blockchain = useSelector(state => state.wallet.blockchain[tx.symbol]);
    const confirmations = getConfirmations(tx, blockchain.blockHeight);

    const network = getNetwork(tx.symbol);
    const explorerBaseUrl = network?.explorer.tx;
    const explorerUrl = explorerBaseUrl ? `${explorerBaseUrl}${tx.txid}` : undefined;

    // txDetails stores response from blockchainGetTransactions()
    const [txDetails, setTxDetails] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(true);
    const { sign } = useReplaceTransaction(tx);

    const [section, setSection] = useState<WalletAccountTransactionSection>(
        props.section || 'DETAILS',
    );
    const [rbfEnabled, setRbfEnabled] = useState<boolean>(false); // TODO replace mock

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
                            <Translation id="TR_CHANGE_FEE" />
                        </SectionTitle>
                    )}
                    {tx.rbfParams && (
                        <>
                            {section === 'DETAILS' && (
                                <Button variant="tertiary" onClick={() => setSection('CHANGE_FEE')}>
                                    <Translation id="TR_CHANGE_FEE" />
                                </Button>
                            )}
                            <Button variant="tertiary" icon="RBF" onClick={() => {}}>
                                <Translation id="RBF" />
                                <OnOffSwitcher isOn={rbfEnabled} />
                            </Button>
                            {section === 'CHANGE_FEE' && (
                                <Button variant="tertiary" onClick={() => setSection('DETAILS')}>
                                    <Translation id="TR_CANCEL" />
                                </Button>
                            )}
                        </>
                    )}
                    {explorerUrl && section === 'DETAILS' && (
                        <a href={explorerUrl} target="_blank" rel="noreferrer">
                            <Button variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                                <Translation id="TR_OPEN_IN_BLOCK_EXPLORER" />
                            </Button>
                        </a>
                    )}
                </SectionActions>
                {section === 'CHANGE_FEE' ? (
                    <ChangeFeeWrapper>
                        <ChangeFee tx={tx} />
                    </ChangeFeeWrapper>
                ) : (
                    <AdvancedDetailsWrapper>
                        <TabSelector>
                            <TabButton
                                selected={selectedTab === 'amount'}
                                onClick={() => {
                                    setSelectedTab('amount');
                                }}
                            >
                                <Translation id="TR_TX_TAB_AMOUNT" />
                            </TabButton>
                            {network?.networkType !== 'ripple' && (
                                <TabButton
                                    selected={selectedTab === 'io'}
                                    onClick={() => {
                                        setSelectedTab('io');
                                    }}
                                >
                                    <Translation id="TR_INPUTS_OUTPUTS" />
                                </TabButton>
                            )}
                        </TabSelector>

                        {selectedTab === 'amount' ? (
                            <AmountDetails
                                tx={tx}
                                txDetails={txDetails}
                                // isFetching={isFetching}
                                isTestnet={isTestnet(tx.symbol)}
                            />
                        ) : (
                            network?.networkType !== 'ripple' && (
                                <IODetails tx={tx} txDetails={txDetails} isFetching={isFetching} />
                            )
                        )}
                    </AdvancedDetailsWrapper>
                )}
            </Wrapper>
        </Modal>
    );
};

export default TransactionDetail;
