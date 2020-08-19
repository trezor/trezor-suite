import React from 'react';
import styled from 'styled-components';
import { HiddenPlaceholder, FiatValue, Translation } from '@suite-components';
import { ArrayElement } from '@suite/types/utils';
import { getTxOperation, getTargetAmount } from '@wallet-utils/transactionUtils';
import { isTestnet } from '@wallet-utils/accountUtils';
import { WalletAccountTransaction } from '@wallet-types';
import Sign from '@suite-components/Sign';
import TokenTransferAddressLabel from '../TokenTransferAddressLabel';
import TargetAddressLabel from '../TargetAddressLabel';
import BaseTargetLayout from '../BaseTargetLayout';

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
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
    const operation = getTxOperation(transaction);
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
}

export const Target = ({ target, transaction, ...baseLayoutProps }: TargetProps) => {
    const targetAmount = getTargetAmount(target, transaction);
    const operation = getTxOperation(transaction);

    return (
        <BaseTargetLayout
            {...baseLayoutProps}
            addressLabel={<TargetAddressLabel target={target} type={transaction.type} />}
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
}) => {
    return (
        <BaseTargetLayout
            {...baseLayoutProps}
            addressLabel={<Translation id="FEE" />}
            amount={
                <StyledHiddenPlaceholder>
                    <Sign value="neg" />
                    {transaction.fee} {transaction.symbol}
                </StyledHiddenPlaceholder>
            }
            fiatAmount={
                useFiatValues ? (
                    <FiatValue
                        amount={transaction.fee}
                        symbol={transaction.symbol}
                        source={transaction.rates}
                        useCustomSource
                    />
                ) : undefined
            }
        />
    );
};
