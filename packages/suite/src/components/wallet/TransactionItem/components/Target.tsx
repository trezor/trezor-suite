import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { FiatValue, Translation, MetadataLabeling, FormattedCryptoAmount } from '@suite-components';
import { ArrayElement } from '@trezor/type-utils';
import {
    getTxOperation,
    getTargetAmount,
    isTestnet,
    formatAmount,
    formatCardanoWithdrawal,
    formatCardanoDeposit,
    formatNetworkAmount,
} from '@suite-common/wallet-utils';
import { WalletAccountTransaction } from '@wallet-types';
import * as notificationActions from '@suite-actions/notificationActions';
import { useActions } from '@suite-hooks';
import { TokenTransferAddressLabel } from './TokenTransferAddressLabel';
import { TargetAddressLabel } from './TargetAddressLabel';
import { BaseTargetLayout } from './BaseTargetLayout';
import { copyToClipboard } from '@trezor/dom-utils';
import { AccountMetadata } from '@suite-types/metadata';
import { ExtendedMessageDescriptor } from '@suite-types';

export const StyledCryptoAmount = styled(FormattedCryptoAmount)`
    width: 100%;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    white-space: nowrap;
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
                    <StyledCryptoAmount
                        value={formatAmount(transfer.amount, transfer.decimals)}
                        symbol={transfer.symbol}
                        signValue={operation}
                    />
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
                    <StyledCryptoAmount
                        value={targetAmount}
                        symbol={transaction.symbol}
                        signValue={operation}
                    />
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
        amount={<StyledCryptoAmount value={amount} symbol={transaction.symbol} signValue={sign} />}
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
    fee,
    transaction,
    useFiatValues,
    ...baseLayoutProps
}: {
    fee: string;
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
        amount={fee}
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
        amount={formatCardanoWithdrawal(transaction) ?? '0'}
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
        amount={formatCardanoDeposit(transaction) ?? '0'}
        transaction={transaction}
        useFiatValues={useFiatValues}
    />
);

export const CoinjoinRow = ({
    transaction,
    useFiatValues,
}: {
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
}) => (
    <BaseTargetLayout
        fiatAmount={
            useFiatValues ? (
                <FiatValue
                    amount={formatNetworkAmount(
                        transaction.amount.startsWith('-')
                            ? transaction.amount.slice(1)
                            : transaction.amount,
                        transaction.symbol,
                    )}
                    symbol={transaction.symbol}
                    source={transaction.rates}
                    useCustomSource
                />
            ) : undefined
        }
        addressLabel={
            <Translation
                id="TR_JOINT_TRANSACTION_TARGET"
                values={{
                    in: transaction.details.vin.length,
                    inMy: transaction.details.vin.filter(v => v.isAccountOwned).length,
                    out: transaction.details.vout.length,
                    outMy: transaction.details.vout.filter(v => v.isAccountOwned).length,
                }}
            />
        }
        isFirst
        isLast
    />
);
