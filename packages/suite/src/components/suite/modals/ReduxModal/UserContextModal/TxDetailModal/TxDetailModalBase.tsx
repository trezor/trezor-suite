import { ReactNode } from 'react';

import { Explorer, getNetwork } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import {
    selectAccountByKey,
    selectExplorer,
    selectIsPhishingTransaction,
    selectTransactionConfirmations,
} from '@suite-common/wallet-core';
import { getAccountKey } from '@suite-common/wallet-utils';
import { Banner, Column, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';

import { Translation, TrezorLink } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { Account, WalletAccountTransaction } from 'src/types/wallet';

import { BasicTxDetails } from './BasicTxDetails';

type TxDetailModalProps = {
    tx: WalletAccountTransaction;
    onCancel: () => void;
    onBackClick: (() => void) | undefined;
    heading: ReactNode;
    bottomContent: ReactNode | undefined;
    children: ReactNode;
};

export const TxDetailModalBase = ({
    tx,
    onCancel,
    onBackClick,
    heading,
    bottomContent,
    children,
}: TxDetailModalProps) => {
    const accountKey = getAccountKey(tx.descriptor, tx.symbol, tx.deviceState);
    const confirmations = useSelector(state =>
        selectTransactionConfirmations(state, tx.txid, accountKey),
    );
    const account = useSelector(state => selectAccountByKey(state, accountKey)) as Account;
    const network = getNetwork(account.symbol);
    const explorer = useSelector(state => selectExplorer(state, account.symbol)) as Explorer;

    const isPhishingTransaction = useSelector(state =>
        selectIsPhishingTransaction(state, tx.txid, accountKey),
    );

    return (
        <Modal
            onCancel={onCancel}
            heading={heading}
            size="large"
            bottomContent={bottomContent}
            onBackClick={onBackClick}
        >
            <Column gap={spacings.md}>
                <BasicTxDetails
                    explorerUrl={getExplorerUrl(explorer, 'tx')!}
                    explorerUrlQueryString={explorer.queryString}
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

                {children}
            </Column>
        </Modal>
    );
};
