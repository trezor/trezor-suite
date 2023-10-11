import { useState, useMemo } from 'react';
import styled from 'styled-components';
import { variables, Button } from '@trezor/components';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';
import { getIsZeroValuePhishing } from '@suite-common/suite-utils';
import {
    isPending,
    findChainedTransactions,
    getAccountKey,
    getAccountNetwork,
} from '@suite-common/wallet-utils';
import { useSelector } from 'src/hooks/suite';
import {
    selectAccountByKey,
    selectTransactionConfirmations,
    selectAllPendingTransactions,
} from '@suite-common/wallet-core';
import { Translation, Modal, TrezorLink } from 'src/components/suite';
import { WalletAccountTransaction } from 'src/types/wallet';
import { BasicTxDetails } from './BasicTxDetails';
import { AdvancedTxDetails, TabID } from './AdvancedTxDetails/AdvancedTxDetails';
import { ChangeFee } from './ChangeFee/ChangeFee';

const StyledModal = styled(Modal)`
    width: 755px;

    ${Modal.Body} {
        padding: 10px;
    }
`;

const PhishingBanner = styled.div`
    margin-bottom: 6px;
    padding: 6px 0;
    border-radius: 8px;
    background: ${({ theme }) => theme.BG_RED};
    color: ${({ theme }) => theme.TYPE_WHITE};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const HelpLink = styled(TrezorLink)`
    color: ${({ theme }) => theme.TYPE_WHITE};
`;

const SectionActions = styled.div`
    position: relative;
    padding: 15px 0 0;
    display: flex;
    justify-content: flex-end;
`;

const SectionTitle = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
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

    > * + * {
        margin-left: 12px;
    }
`;

type TxDetailModalProps = {
    tx: WalletAccountTransaction;
    rbfForm?: boolean;
    onCancel: () => void;
};

export const TxDetailModal = ({ tx, rbfForm, onCancel }: TxDetailModalProps) => {
    const blockchain = useSelector(state => state.wallet.blockchain[tx.symbol]);
    const transactions = useSelector(selectAllPendingTransactions);

    const [section, setSection] = useState<'CHANGE_FEE' | 'DETAILS'>(
        rbfForm ? 'CHANGE_FEE' : 'DETAILS',
    );
    const [tab, setTab] = useState<TabID | undefined>(undefined);
    const [finalize, setFinalize] = useState<boolean>(false);

    // const confirmations = getConfirmations(tx, blockchain.blockHeight);
    // TODO: replace this part will be refactored after blockbook implementation:
    // https://github.com/trezor/blockbook/issues/555
    const chainedTxs = useMemo(() => {
        if (!isPending(tx)) return;
        return findChainedTransactions(tx.descriptor, tx.txid, transactions);
    }, [tx, transactions]);
    const accountKey = getAccountKey(tx.descriptor, tx.symbol, tx.deviceState);
    const confirmations = useSelector(state =>
        selectTransactionConfirmations(state, tx.txid, accountKey),
    );
    const account = useSelector(state => selectAccountByKey(state, accountKey));
    const network = account && getAccountNetwork(account);
    const isZeroValuePhishing = getIsZeroValuePhishing(tx);

    return (
        <StyledModal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id="TR_TRANSACTION_DETAILS" />}
        >
            {isZeroValuePhishing && (
                <PhishingBanner>
                    <Translation
                        id="TR_ZERO_PHISHING_BANNER"
                        values={{
                            a: chunks => (
                                <HelpLink href={HELP_CENTER_ZERO_VALUE_ATTACKS} variant="underline">
                                    {chunks}
                                </HelpLink>
                            ),
                        }}
                    />
                </PhishingBanner>
            )}

            <BasicTxDetails
                explorerUrl={blockchain.explorer.tx}
                explorerUrlQueryString={blockchain.explorer.queryString}
                tx={tx}
                network={network!}
                confirmations={confirmations}
            />

            <SectionActions>
                {network?.features?.includes('rbf') && tx.rbfParams && !tx.deadline && (
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
                <AdvancedTxDetails
                    explorerUrl={blockchain.explorer.tx}
                    defaultTab={tab}
                    network={network!}
                    tx={tx}
                    chainedTxs={chainedTxs}
                />
            )}
        </StyledModal>
    );
};
