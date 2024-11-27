import { useState, useMemo } from 'react';

import { NewModal, Column, Banner } from '@trezor/components';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';
import { isPending, findChainedTransactions, getAccountKey } from '@suite-common/wallet-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    selectAccountByKey,
    selectTransactionConfirmations,
    selectAllPendingTransactions,
    selectIsPhishingTransaction,
} from '@suite-common/wallet-core';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { Translation, TrezorLink } from 'src/components/suite';
import { Account, WalletAccountTransaction } from 'src/types/wallet';

import { BasicTxDetails } from './BasicTxDetails';
import { AdvancedTxDetails, TabID } from './AdvancedTxDetails/AdvancedTxDetails';
import { ChangeFee } from './ChangeFee/ChangeFee';
import { ReplaceTxButton } from './ChangeFee/ReplaceTxButton';

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
    const account = useSelector(state => selectAccountByKey(state, accountKey)) as Account;
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const network = getNetwork(account.symbol);
    const networkFeatures = network.accountTypes[account.accountType]?.features ?? network.features;

    const isPhishingTransaction = useSelector(state =>
        selectIsPhishingTransaction(state, tx.txid, accountKey),
    );

    const onBackClick = () => {
        setSection('DETAILS');
        setTab(undefined);
    };

    const getBottomContent = () => {
        if (
            networkFeatures?.includes('rbf') &&
            tx.rbfParams &&
            !tx.deadline &&
            selectedAccount.status === 'loaded'
        ) {
            if (section === 'CHANGE_FEE') {
                return (
                    <ReplaceTxButton rbfParams={tx.rbfParams} selectedAccount={selectedAccount} />
                );
            } else {
                return (
                    <NewModal.Button
                        variant="tertiary"
                        onClick={() => {
                            setSection('CHANGE_FEE');
                            setTab(undefined);
                        }}
                    >
                        <Translation id="TR_BUMP_FEE" />
                    </NewModal.Button>
                );
            }
        }
    };

    return (
        <NewModal
            onCancel={onCancel}
            heading={
                section === 'CHANGE_FEE' ? (
                    <Translation id="TR_BUMP_FEE" />
                ) : (
                    <Translation id="TR_TRANSACTION_DETAILS" />
                )
            }
            size="large"
            bottomContent={getBottomContent()}
            onBackClick={section === 'CHANGE_FEE' ? onBackClick : undefined}
        >
            <Column gap={spacings.lg}>
                <BasicTxDetails
                    explorerUrl={blockchain.explorer.tx}
                    explorerUrlQueryString={blockchain.explorer.queryString}
                    tx={tx}
                    network={network}
                    confirmations={confirmations}
                />

                {isPhishingTransaction && (
                    <Banner icon>
                        <Translation
                            id="TR_ZERO_PHISHING_BANNER"
                            values={{
                                a: chunks => (
                                    <TrezorLink
                                        typographyStyle="hint"
                                        href={HELP_CENTER_ZERO_VALUE_ATTACKS}
                                        variant="underline"
                                    >
                                        {chunks}
                                    </TrezorLink>
                                ),
                            }}
                        />
                    </Banner>
                )}

                {section === 'CHANGE_FEE' ? (
                    <ChangeFee
                        tx={tx}
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
                        network={network}
                        accountType={account.accountType}
                        tx={tx}
                        chainedTxs={chainedTxs}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                )}
            </Column>
        </NewModal>
    );
};
