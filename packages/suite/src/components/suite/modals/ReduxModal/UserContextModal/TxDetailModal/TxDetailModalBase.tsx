import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { selectIsDeviceRemembered } from '@suite-common/device';
import { type Explorer, getNetwork } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import {
    selectAccountByKey,
    selectExplorer,
    selectIsPhishingTransaction,
    selectTransactionConfirmations,
    selectTransactionIsMarkedAsNotScam,
    transactionsActions,
} from '@suite-common/wallet-core';
import { createAccountKey } from '@suite-common/wallet-types';
import { Banner, Button, Column, Modal, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';

import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

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
    const accountKey = createAccountKey({
        accountDescriptor: tx.descriptor,
        networkSymbol: tx.symbol,
        deviceStaticSessionId: tx.deviceState,
    });
    const confirmations = useSelector(state =>
        selectTransactionConfirmations(state, tx.txid, accountKey),
    );
    const account = useSelector(state => selectAccountByKey(state, accountKey)) as Account;
    const network = getNetwork(account.symbol);
    const explorer = useSelector(state => selectExplorer(state, account.symbol)) as Explorer;
    const isDeviceRemembered = useSelector(selectIsDeviceRemembered);

    const isPhishingTransaction = useSelector(state =>
        selectIsPhishingTransaction(state, tx.txid, accountKey),
    );
    const isTxMarkedAsNotScam = useSelector(state =>
        selectTransactionIsMarkedAsNotScam(state, tx.txid, accountKey),
    );

    const dispatch = useDispatch();

    const onMarkTxAsNotScamClick = () => {
        dispatch(
            transactionsActions.markTransactionAsNotScam({
                key: accountKey,
                txid: tx.txid,
                isMarkedAsNotScam: true,
            }),
        );
    };

    const onUnmarkTxAsNotScamClick = () => {
        dispatch(
            transactionsActions.markTransactionAsNotScam({
                key: accountKey,
                txid: tx.txid,
                isMarkedAsNotScam: false,
            }),
        );
    };

    return (
        <Modal
            onCancel={onCancel}
            heading={heading}
            width={760}
            bottomContent={bottomContent}
            onBackClick={onBackClick}
            // Disable shadow bottom to make `Fees` component fully visible
            shadowBottom={false}
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
                    <Banner
                        icon
                        intent="warning"
                        description={
                            <Translation
                                id="TR_ZERO_PHISHING_BANNER"
                                values={{
                                    a: chunks => (
                                        <TrezorLink href={HELP_CENTER_ZERO_VALUE_ATTACKS}>
                                            {chunks}
                                        </TrezorLink>
                                    ),
                                }}
                            />
                        }
                        rightContent={
                            <Tooltip
                                content={<Translation id="TR_UNHIDE_TRANSACTION_TOOLTIP" />}
                                isActive={!isDeviceRemembered}
                            >
                                <Button
                                    intent="warning"
                                    priority="primary"
                                    size="small"
                                    onClick={onMarkTxAsNotScamClick}
                                    isDisabled={!isDeviceRemembered}
                                >
                                    <Translation id="TR_UNHIDE_TRANSACTION" />
                                </Button>
                            </Tooltip>
                        }
                    />
                )}

                {!isPhishingTransaction && isTxMarkedAsNotScam && (
                    <Banner
                        icon
                        intent="info"
                        description={<Translation id="TR_MARKED_AS_RECOGNIZED_BANNER" />}
                        rightContent={
                            <Tooltip
                                content={<Translation id="TR_HIDE_TRANSACTION_TOOLTIP" />}
                                isActive={!isDeviceRemembered}
                            >
                                <Button
                                    intent="info"
                                    priority="primary"
                                    size="small"
                                    onClick={onUnmarkTxAsNotScamClick}
                                    isDisabled={!isDeviceRemembered}
                                >
                                    <Translation id="TR_HIDE_TRANSACTION" />
                                </Button>
                            </Tooltip>
                        }
                    />
                )}

                {children}
            </Column>
        </Modal>
    );
};
