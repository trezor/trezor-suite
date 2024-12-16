import { ReactNode } from 'react';

import { NewModal, Column, Banner } from '@trezor/components';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';
import { getAccountKey } from '@suite-common/wallet-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    selectAccountByKey,
    selectTransactionConfirmations,
    selectIsPhishingTransaction,
} from '@suite-common/wallet-core';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { Translation, TrezorLink } from 'src/components/suite';
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
    const blockchain = useSelector(state => state.wallet.blockchain[tx.symbol]);

    const accountKey = getAccountKey(tx.descriptor, tx.symbol, tx.deviceState);
    const confirmations = useSelector(state =>
        selectTransactionConfirmations(state, tx.txid, accountKey),
    );
    const account = useSelector(state => selectAccountByKey(state, accountKey)) as Account;
    const network = getNetwork(account.symbol);

    const isPhishingTransaction = useSelector(state =>
        selectIsPhishingTransaction(state, tx.txid, accountKey),
    );

    return (
        <NewModal
            onCancel={onCancel}
            heading={heading}
            size="large"
            bottomContent={bottomContent}
            onBackClick={onBackClick}
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

                {children}
            </Column>
        </NewModal>
    );
};
