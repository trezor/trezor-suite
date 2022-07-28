import React from 'react';
import styled from 'styled-components';
import { HiddenPlaceholder, FiatValue, Translation, MetadataLabeling } from '@suite-components';
import { ArrayElement } from '@trezor/type-utils';
import { getTxOperation, getTargetAmount } from '@wallet-utils/transactionUtils';
import { isTestnet } from '@wallet-utils/accountUtils';
import { WalletAccountTransaction } from '@wallet-types';
import * as notificationActions from '@suite-actions/notificationActions';
import { useActions } from '@suite-hooks';
import Sign from '@suite-components/Sign';
import TokenTransferAddressLabel from '../TokenTransferAddressLabel';
import TargetAddressLabel from '../TargetAddressLabel';
import BaseTargetLayout from '../BaseTargetLayout';
import { copyToClipboard } from '@suite-utils/dom';
import { AccountMetadata } from '@suite-types/metadata';
import { ExtendedMessageDescriptor } from '@suite-types';

const StyledHiddenPlaceholder = styled(props => <HiddenPlaceholder {...props} />)`
    /* padding: 8px 0px; row padding */
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

interface TokenTransferProps {
    transfer: ArrayElement<WalletAccountTransaction['tokens']>;
    transaction: WalletAccountTransaction;
    singleRowLayout?: boolean;
    useAnimation?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
}

export const TokenTransfer = ({
    transfer,
    transaction,

    ...baseLayoutProps
}: TokenTransferProps) => {
    const operation = getTxOperation(transfer);
    return (
        <BaseTargetLayout
            {...baseLayoutProps}
            addressLabel={<TokenTransferAddressLabel transfer={transfer} type={transaction.type} />}
            amount={
                !baseLayoutProps.singleRowLayout && (
                    <StyledHiddenPlaceholder>
                        {operation && <Sign value={operation} />}
                        {transfer.amount} {transfer.symbol}
                    </StyledHiddenPlaceholder>
                )
            }
        />
    );
};

interface TargetProps {
    target: ArrayElement<WalletAccountTransaction['targets']>;
    transaction: WalletAccountTransaction;
    singleRowLayout?: boolean;
    useAnimation?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    accountKey: string;
    accountMetadata?: AccountMetadata;
    isActionDisabled?: boolean;
}

export const Target = ({
    target,
    transaction,
    accountMetadata,
    accountKey,
    isActionDisabled,
    ...baseLayoutProps
}: TargetProps) => {
    const targetAmount = getTargetAmount(target, transaction);
    const operation = getTxOperation(transaction);
    const { addNotification } = useActions({ addNotification: notificationActions.addToast });
    const targetMetadata = accountMetadata?.outputLabels?.[transaction.txid]?.[target.n];

    return (
        <BaseTargetLayout
            {...baseLayoutProps}
            addressLabel={
                <MetadataLabeling
                    isDisabled={isActionDisabled}
                    defaultVisibleValue={
                        <TargetAddressLabel
                            accountMetadata={accountMetadata}
                            target={target}
                            type={transaction.type}
                        />
                    }
                    dropdownOptions={[
                        {
                            callback: () => {
                                if (!target?.addresses) {
                                    // probably should not happen?
                                    return addNotification({
                                        type: 'error',
                                        error: 'There is nothing to copy',
                                    });
                                }
                                const result = copyToClipboard(target.addresses.join(), null);
                                if (typeof result === 'string') {
                                    return addNotification({ type: 'error', error: result });
                                }
                                return addNotification({ type: 'copy-to-clipboard' });
                            },
                            label: <Translation id="TR_ADDRESS_MODAL_CLIPBOARD" />,
                            key: 'copy-address',
                        },
                    ]}
                    payload={{
                        type: 'outputLabel',
                        accountKey,
                        txid: transaction.txid,
                        outputIndex: target.n,
                        defaultValue: `${transaction.txid}-${target.n}`,
                        value: targetMetadata,
                    }}
                />
            }
            amount={
                targetAmount && !baseLayoutProps.singleRowLayout ? (
                    <StyledHiddenPlaceholder>
                        {operation && <Sign value={operation} />}
                        {targetAmount} {transaction.symbol}
                    </StyledHiddenPlaceholder>
                ) : undefined
            }
            fiatAmount={
                !isTestnet(transaction.symbol) && targetAmount ? (
                    <FiatValue
                        amount={targetAmount}
                        symbol={transaction.symbol}
                        source={transaction.rates}
                        useCustomSource
                    />
                ) : undefined
            }
        />
    );
};

export const CustomRow = ({
    transaction,
    title,
    amount,
    sign,
    useFiatValues,
    ...baseLayoutProps
}: {
    amount: string;
    sign: 'pos' | 'neg';
    title: ExtendedMessageDescriptor['id'];
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    className?: string;
}) => (
    <BaseTargetLayout
        {...baseLayoutProps}
        addressLabel={<Translation id={title} />}
        amount={
            <StyledHiddenPlaceholder>
                <Sign value={sign} />
                {amount} {transaction.symbol}
            </StyledHiddenPlaceholder>
        }
        fiatAmount={
            useFiatValues ? (
                <FiatValue
                    amount={amount}
                    symbol={transaction.symbol}
                    source={transaction.rates}
                    useCustomSource
                />
            ) : undefined
        }
    />
);

export const FeeRow = ({
    transaction,
    useFiatValues,
    ...baseLayoutProps
}: {
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    className?: string;
}) => (
    <CustomRow
        {...baseLayoutProps}
        title="FEE"
        sign="neg"
        amount={transaction.fee}
        transaction={transaction}
        useFiatValues={useFiatValues}
    />
);

export const WithdrawalRow = ({
    transaction,
    useFiatValues,
    ...baseLayoutProps
}: {
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    className?: string;
}) => (
    <CustomRow
        {...baseLayoutProps}
        title="TR_TX_WITHDRAWAL"
        sign="pos"
        amount={transaction.cardanoSpecific?.withdrawal ?? '0'}
        transaction={transaction}
        useFiatValues={useFiatValues}
    />
);

export const DepositRow = ({
    transaction,
    useFiatValues,
    ...baseLayoutProps
}: {
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    className?: string;
}) => (
    <CustomRow
        {...baseLayoutProps}
        title="TR_TX_DEPOSIT"
        sign="neg"
        amount={transaction.cardanoSpecific?.deposit ?? '0'}
        transaction={transaction}
        useFiatValues={useFiatValues}
    />
);
